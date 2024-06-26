"use client";

import type { ActionResult } from "./server";
import { useCallback, useMemo, useState, useTransition } from "react";

/**
 * @internal
 */
export type ActionState<TResult, TError> = Awaited<ActionResult<TResult, TError>>;

/**
 * Represent a server action.
 *
 * @internal
 */
export type Action<T, TResult, TError> = (input: T) => ActionResult<TResult, TError>;

/**
 * Additional options.
 *
 * @internal
 */
export type ActionOptions<TResult, TError> = {
  /**
   * Called when an error ocurrs.
   */
  onError?: (error: TError) => void;

  /**
   * Called when the action successfuly completes.
   */
  onSuccess?: (result: TResult) => void;

  /**
   * Called when the action completes.
   */
  onSettled?: (result: ActionState<TResult, TError>) => void;
};

/**
 * Returns a hook that to the given server action.
 * @param fn The server action.
 * @param options Additional options.
 */
export function useAction<T, TResult, TError = unknown>(
  fn: Action<T, TResult, TError>,
  options?: ActionOptions<TResult, TError>,
) {
  /**
   * Input arguments.
   */
  type TArgs = [undefined] extends Parameters<typeof fn> ? [input?: T | undefined] : [input: T];

  const { execute: callAction, ...rest } = useCallAction(fn, options);
  const execute = useCallback((...args: TArgs) => callAction(args[0] as T), [callAction]);
  return { execute, ...rest } as const;
}

/**
 * Represents a server action that takes a form.
 */
export type FormAction<TResult, TError> = (formData: FormData) => ActionResult<TResult, TError>;

/**
 * Returns a hook to call the given server form action.
 * @param fn The server action.
 * @param options Additional options.
 */
export function useFormAction<TResult, TError>(
  fn: FormAction<TResult, TError>,
  options?: ActionOptions<TResult, TError>,
) {
  const { execute, ...rest } = useCallAction((formData: FormData) => fn(formData), options);
  return { action: execute, ...rest } as const;
}

function useCallAction<TInput, TResult, TError = unknown>(
  fn: (input: TInput) => ActionResult<TResult, TError>,
  options?: ActionOptions<TResult, TError>,
) {
  const { onError, onSuccess, onSettled } = options || {};
  const [isExecuting, startTransition] = useTransition();
  const [status, setStatus] = useState<ActionState<TResult, TError>>();

  const execute = useCallback(
    async (input: TInput) => {
      return new Promise<ActionState<TResult, TError>>((resolve, reject) => {
        // @ts-expect-error server actions can be called in an async transition: https://react.dev/reference/react/use-server#calling-a-server-action-outside-of-form
        startTransition(async () => {
          try {
            const result = await fn(input);

            if (result.success) {
              onSuccess?.(result.data);
            } else {
              onError?.(result.error);
            }

            onSettled?.(result);
            setStatus(result);
            resolve(result);
          } catch (err) {
            // This should never happen, errors should be returned in the server action result.
            reject(err);
          }
        });
      });
    },
    [fn, onError, onSuccess],
  );

  const error = useMemo(() => {
    return status?.success === false ? status.error : undefined;
  }, [status]);

  const data = useMemo(() => {
    return status?.success === true ? status.data : undefined;
  }, [status]);

  const isError = useMemo(() => status && status.success === false, [status]);
  const isSuccess = useMemo(() => status && status.success === true, [status]);

  return {
    execute,
    status,
    data,
    error,
    isExecuting,
    isSuccess,
    isError,
  } as const;
}
