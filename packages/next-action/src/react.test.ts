import { createServerActionProvider } from "./server";
import { act, renderHook } from "@testing-library/react";
import { useAction } from "./react";

describe("Call action with useAction", () => {
  const action = createServerActionProvider();

  test("Should return result from server action", async () => {
    const myAction = action(async () => {
      return "Hello world!";
    });

    const { result } = renderHook(() => useAction(myAction));
    const ret = await act(() => result.current.execute());

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
