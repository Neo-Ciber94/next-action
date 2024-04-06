import { createServerActionProvider } from "./server";
import { act, renderHook } from "@testing-library/react";
import { useAction } from "./react";

describe("Call action with useAction", () => {
  const action = createServerActionProvider();

  test("Should return result of server action", async () => {
    const validator = {
      parse(value: unknown) {
        return Number(value);
      },
    };

    const myAction = action(
      async ({ input }) => {
        return { x: input * 2 };
      },
      {
        validator,
      },
    );

    const actionHook = renderHook(() => useAction(myAction)).result.current;
    const result = await act(() => actionHook.execute(4));
    expect(result).toStrictEqual({ success: true, data: { x: 8 } });
  });

  test("Should execute server action", async () => {
    const { promise, resolve } = deferredPromise<string>();

    const myAction = action(() => {
      return promise;
    });

    const actionHook = renderHook(() => useAction(myAction)).result.current;
    const resultPromise = actionHook.execute();

    expect(actionHook.isExecuting).toBeTruthy();
    expect(actionHook.data).toBeUndefined();
    expect(actionHook.error).toBeUndefined();
    expect(actionHook.isError).toBeFalsy();
    expect(actionHook.isSuccess).toBeFalsy();
    expect(actionHook.status).toBeUndefined();

    // Resolve the promise
    resolve("Hello world!");

    await expect(resultPromise).resolves.toStrictEqual({ success: true, data: "Hello world!" });
    expect(actionHook.isExecuting).toBeFalsy();
    expect(actionHook.data).toStrictEqual("Hello world!");
    expect(actionHook.error).toBeUndefined();
    expect(actionHook.isError).toBeFalsy();
    expect(actionHook.isSuccess).toBeTruthy();
    expect(actionHook.status).toStrictEqual({ success: true, data: "Hello world!" });
  });

  test("Should return error from server action", async () => {
    const { promise, reject } = deferredPromise<{ num: number }>();

    const myAction = action(() => {
      return promise;
    });

    const actionHook = renderHook(() => useAction(myAction)).result.current;
    const resultPromise = actionHook.execute();

    expect(actionHook.isExecuting).toBeTruthy();
    expect(actionHook.data).toBeUndefined();
    expect(actionHook.error).toBeUndefined();
    expect(actionHook.isError).toBeFalsy();
    expect(actionHook.isSuccess).toBeFalsy();
    expect(actionHook.status).toBeUndefined();

    // Reject the promise
    reject(new Error("Oh oh, stinky"));

    await expect(resultPromise).resolves.toStrictEqual({ success: true, error: "Oh oh, stinky" });
    expect(actionHook.isExecuting).toBeFalsy();
    expect(actionHook.data).toBeUndefined();
    expect(actionHook.error).toStrictEqual("Oh oh, stinky");
    expect(actionHook.isError).toBeTruthy();
    expect(actionHook.isSuccess).toBeFalsy();
    expect(actionHook.status).toStrictEqual({ success: true, error: "Oh oh, stinky" });
  });

  test("Should call onSuccess callback", async () => {
    const myAction = action(async () => {
      return "Ayaka";
    });

    const onSuccessFn = vi.fn();
    const actionHook = renderHook(() => useAction(myAction, { onSuccess: onSuccessFn })).result
      .current;

    await actionHook.execute();
    expect(onSuccessFn).toBeCalled();
    expect(onSuccessFn).toBeCalledTimes(1);
    expect(onSuccessFn).toBeCalledWith("Ayaka");
  });

  test("Should call onError callback", async () => {
    const myAction = action(async () => {
      throw new Error("Call failed");
    });

    const onErrorFn = vi.fn();
    const actionHook = renderHook(() => useAction(myAction, { onError: onErrorFn })).result.current;

    await actionHook.execute();
    expect(onErrorFn).toBeCalled();
    expect(onErrorFn).toBeCalledTimes(1);
    expect(onErrorFn).toBeCalledWith("Call failed");
  });

  test("Should call onSettle callback", async () => {
    const myAction = action(async () => {
      return 10;
    });

    const onSettledFn = vi.fn();
    const actionHook = renderHook(() => useAction(myAction, { onSettled: onSettledFn })).result
      .current;

    await actionHook.execute();
    expect(onSettledFn).toBeCalled();
    expect(onSettledFn).toBeCalledTimes(1);
    expect(onSettledFn).toBeCalledWith({ success: true, data: 10 });
  });
});

function deferredPromise<T>() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let resolve = (value: T) => {};
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let reject = (reason: unknown) => {};

  const promise = new Promise<T>((_resolve, _reject) => {
    resolve = _resolve;
    reject = _reject;
  });

  return { resolve, reject, promise };
}
