/* eslint-disable @typescript-eslint/no-explicit-any */
import { createServerActionProvider, type Validator } from "./server";
import { act, renderHook } from "@testing-library/react";
import { useAction, useFormAction } from "./react";

describe("Call action with useAction", () => {
  const action = createServerActionProvider();

  test("Should return result from server action", async () => {
    const myAction = action(
      async ({ input }) => {
        return "Hello " + input;
      },
      {
        validator: {
          parse(value: any) {
            return value;
          },
        } satisfies Validator<string>,
      },
    );

    const { result } = renderHook(() => useAction(myAction));
    const ret = await act(() => result.current.execute("world!"));

    expect(ret).toStrictEqual({ success: true, data: "Hello world!" });
    expect(result.current.isExecuting).toBeFalsy();
    expect(result.current.data).toStrictEqual("Hello world!");
    expect(result.current.error).toBeUndefined();
    expect(result.current.isError).toBeFalsy();
    expect(result.current.isSuccess).toBeTruthy();
    expect(result.current.status).toStrictEqual({ success: true, data: "Hello world!" });
  });

  test("Should return error from server action", async () => {
    const myAction = action(() => {
      throw new Error("Oh oh, stinky");
    });

    const { result } = renderHook(() => useAction(myAction));
    const ret = await act(() => result.current.execute());

    expect(ret).toStrictEqual({ success: false, error: "Oh oh, stinky" });
    expect(result.current.isExecuting).toBeFalsy();
    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toStrictEqual("Oh oh, stinky");
    expect(result.current.isError).toBeTruthy();
    expect(result.current.isSuccess).toBeFalsy();
    expect(result.current.status).toStrictEqual({ success: false, error: "Oh oh, stinky" });
  });

  test("Should call onSuccess callback", async () => {
    const myAction = action(async () => {
      return "Ayaka";
    });

    const onSuccessFn = vi.fn();
    const { result } = renderHook(() => useAction(myAction, { onSuccess: onSuccessFn }));

    await act(() => result.current.execute());
    expect(onSuccessFn).toBeCalled();
    expect(onSuccessFn).toBeCalledTimes(1);
    expect(onSuccessFn).toBeCalledWith("Ayaka");
  });

  test("Should call onError callback", async () => {
    const myAction = action(async () => {
      throw new Error("Call failed");
    });

    const onErrorFn = vi.fn();
    const { result } = renderHook(() => useAction(myAction, { onError: onErrorFn }));

    await act(() => result.current.execute());
    expect(onErrorFn).toBeCalled();
    expect(onErrorFn).toBeCalledTimes(1);
    expect(onErrorFn).toBeCalledWith("Call failed");
  });

  test("Should call onSettle callback", async () => {
    const myAction = action(async () => {
      return 10;
    });

    const onSettledFn = vi.fn();
    const { result } = renderHook(() => useAction(myAction, { onSettled: onSettledFn }));

    await act(() => result.current.execute());
    expect(onSettledFn).toBeCalled();
    expect(onSettledFn).toBeCalledTimes(1);
    expect(onSettledFn).toBeCalledWith({ success: true, data: 10 });
  });
});

describe("Call action with useFormAction", () => {
  const action = createServerActionProvider();

  test("Should return result from form server action", async () => {
    const myAction = action.formAction(
      async ({ input }) => {
        return "Hello " + input;
      },
      {
        validator: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          parse(value: any) {
            return String(value.data);
          },
        } satisfies Validator<string>,
      },
    );

    const { result } = renderHook(() => useFormAction(myAction));
    const formData = new FormData();
    formData.set("data", "world!");
    const ret = await act(() => result.current.action(formData));

    expect(ret).toStrictEqual({ success: true, data: "Hello world!" });
    expect(result.current.isExecuting).toBeFalsy();
    expect(result.current.data).toStrictEqual("Hello world!");
    expect(result.current.error).toBeUndefined();
    expect(result.current.isError).toBeFalsy();
    expect(result.current.isSuccess).toBeTruthy();
    expect(result.current.status).toStrictEqual({ success: true, data: "Hello world!" });
  });

  test("Should return error from server action", async () => {
    const myAction = action.formAction(() => {
      throw new Error("Oh oh, stinky");
    });

    const { result } = renderHook(() => useFormAction(myAction));
    const ret = await act(() => result.current.action(new FormData()));

    expect(ret).toStrictEqual({ success: false, error: "Oh oh, stinky" });
    expect(result.current.isExecuting).toBeFalsy();
    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toStrictEqual("Oh oh, stinky");
    expect(result.current.isError).toBeTruthy();
    expect(result.current.isSuccess).toBeFalsy();
    expect(result.current.status).toStrictEqual({ success: false, error: "Oh oh, stinky" });
  });

  test("Should call onSuccess callback", async () => {
    const myAction = action.formAction(async () => {
      return "Ayaka";
    });

    const onSuccessFn = vi.fn();
    const { result } = renderHook(() => useFormAction(myAction, { onSuccess: onSuccessFn }));

    await act(() => result.current.action(new FormData()));
    expect(onSuccessFn).toBeCalled();
    expect(onSuccessFn).toBeCalledTimes(1);
    expect(onSuccessFn).toBeCalledWith("Ayaka");
  });

  test("Should call onError callback", async () => {
    const myAction = action.formAction(async () => {
      throw new Error("Call failed");
    });

    const onErrorFn = vi.fn();
    const { result } = renderHook(() => useFormAction(myAction, { onError: onErrorFn }));

    await act(() => result.current.action(new FormData()));
    expect(onErrorFn).toBeCalled();
    expect(onErrorFn).toBeCalledTimes(1);
    expect(onErrorFn).toBeCalledWith("Call failed");
  });

  test("Should call onSettle callback", async () => {
    const myAction = action.formAction(async () => {
      return 10;
    });

    const onSettledFn = vi.fn();
    const { result } = renderHook(() => useFormAction(myAction, { onSettled: onSettledFn }));

    await act(() => result.current.action(new FormData()));
    expect(onSettledFn).toBeCalled();
    expect(onSettledFn).toBeCalledTimes(1);
    expect(onSettledFn).toBeCalledWith({ success: true, data: 10 });
  });
});
