import { describe, test } from "vitest";
import { createServerActionProvider, type Validator } from "./server";
import { ActionError } from ".";
import { defaultErrorMapper } from "./utils";

describe("Call server action", () => {
  const action = createServerActionProvider();

  test("Should return success", async () => {
    const myAction = action(undefined, async () => {
      return 10;
    });

    await expect(myAction()).resolves.toStrictEqual({ success: true, data: 10 });
  });

  test("Should return error", async () => {
    const myAction = action(undefined, async () => {
      throw new ActionError("Oh oh, an error");
    });

    await expect(myAction()).resolves.toStrictEqual({ success: false, error: "Oh oh, an error" });
  });

  test("Should validate input", async () => {
    const validator: Validator<number> = {
      parse(value) {
        const n = parseInt(value as string);
        if (isNaN(n)) {
          throw new Error("Invalid input");
        }

        return n;
      },
    };

    const myAction = action(
      validator,
      async ({ input }) => {
        return 5 * input;
      }
    );

    await expect(myAction(12)).resolves.toStrictEqual({ success: true, data: 60 });
  });
});

describe("Call form server action", () => {
  const action = createServerActionProvider();

  test("Should return success", async () => {
    const myAction = action.formAction(undefined, async () => {
      return 10;
    });

    await expect(myAction(new FormData())).resolves.toStrictEqual({ success: true, data: 10 });
  });

  test("Should return error", async () => {
    const myAction = action.formAction(undefined, async () => {
      throw new ActionError("Oh oh, an error");
    });

    await expect(myAction(new FormData())).resolves.toStrictEqual({
      success: false,
      error: "Oh oh, an error",
    });
  });

  test("Should invoke form action no args", async () => {
    const myAction = action.formAction(undefined, async () => {
      return 10;
    });

    await expect(myAction.action()).resolves.toStrictEqual({ success: true, data: 10 });
  });

  test("Should invoke form action with arguments", async () => {
    const validator: Validator<{ x: number }> = {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      parse(value: any) {
        return { x: Number(value.x) };
      },
    };

    const myAction = action.formAction(
      validator,
      async ({ input }) => {
        return 15 * input.x;
      });

    await expect(myAction.action({ x: 2 })).resolves.toStrictEqual({
      success: true,
      data: 30,
    });
  });
});

describe("Error mapping", () => {
  const OLD_ENV = process.env;

  afterAll(() => {
    process.env = OLD_ENV;
  });

  test("Should map error to object", async () => {
    const action = createServerActionProvider({
      mapError(err) {
        const message = defaultErrorMapper(err);
        return { message };
      },
    });

    const myAction = action(undefined, async () => {
      throw new ActionError("This is an error");
    });

    await expect(myAction()).resolves.toStrictEqual({
      success: false,
      error: { message: "This is an error" },
    });
  });

  test("Should NOT show error on process.env.NODE_ENV === production", async () => {
    process.env = { ...OLD_ENV, NODE_ENV: "production" };

    const action = createServerActionProvider();

    const myAction = action(undefined, async () => {
      throw new Error("This is a internal and private error");
    });

    await expect(myAction()).resolves.toStrictEqual({
      success: false,
      error: "Something went wrong",
    });
  });

  test("Should show error on process.env.NODE_ENV === development", async () => {
    process.env = { ...OLD_ENV, NODE_ENV: "development" };

    const action = createServerActionProvider();

    const myAction = action(undefined, async () => {
      throw new Error("This is a internal and private error");
    });

    await expect(myAction()).resolves.toStrictEqual({
      success: false,
      error: "This is a internal and private error",
    });
  });
});

describe("Action context", () => {
  test("Should return value from context", async () => {
    const action = createServerActionProvider({
      context() {
        return { value: 6 };
      },
    });

    const myAction = action(undefined, async ({ context }) => {
      return 4 * context.value;
    });

    await expect(myAction()).resolves.toStrictEqual({ success: true, data: 24 });
  });

  test("Should return async value from context", async () => {
    const action = createServerActionProvider({
      async context() {
        return { value: 2 };
      },
    });

    const myAction = action(undefined, async ({ context }) => {
      return 10 * context.value;
    });

    await expect(myAction()).resolves.toStrictEqual({ success: true, data: 20 });
  });
});

describe("Server action middlewares", () => {
  test("Should transform context value on `onBeforeExecute`", async () => {
    const action = createServerActionProvider({
      context() {
        return { value: 6 };
      },
      onBeforeExecute({ context }) {
        return { text: `Your number is ${context.value}` };
      },
    });

    const myAction = action(undefined, async ({ context }) => {
      return context.text;
    });

    await expect(myAction()).resolves.toStrictEqual({ success: true, data: "Your number is 6" });
  });

  test("Should get raw input onBeforeExecute", async () => {
    const dummyValidator: Validator<number> = {
      parse(value) {
        return Number(value);
      },
    };

    const action = createServerActionProvider({
      onBeforeExecute({ input }) {
        return { textInput: `This is text now: ${input}` };
      },
    });

    const myAction = action(
      dummyValidator,
      async ({ input, context }) => {
        return `${context.textInput} = ${input}`;
      });

    await expect(myAction(42)).resolves.toStrictEqual({
      success: true,
      data: "This is text now: 42 = 42",
    });
  });

  test("Should get value onAfterExecute", async () => {
    let value = 0;

    const action = createServerActionProvider({
      onAfterExecute() {
        value = 20;
      },
    });

    const myAction = action(undefined, async () => {
      return 10;
    });

    await myAction();
    expect(value).toStrictEqual(20);
  });
});
