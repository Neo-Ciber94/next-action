"use client";

import type { ActionResult } from "./server";
import { useCallback, useMemo, useState } from "react";

type ActionState<TResult, TError> = Awaited<ActionResult<TResult, TError>>;

/**
 * Represents a server action.
 */
type Action<T, TResult, TError> = (input: T) => ActionResult<TResult, TError>;

/**
 * Additional options.
 */
type ActionOptions<TResult, TError> = {
  /**
   * Callback to call when an error occurs.
   */
  onError?: (error: TError) => void;

  /**
   * Callback to call when it success.
   */
  onSuccess?: (result: TResult) => void;

  /**
   * Callback to call when it completes with either an error or success.
   */
  onSettled?: (result: ActionState<TResult, TError>) => void;
};

/**
 * Returns a hook that can call the given action.
 * @param fn The action.
 * @param options Additional options.
 */
export function useAction<T, TResult, TError = unknown>(
  fn: Action<T, TResult, TError>,
  options?: ActionOptions<TResult, TError>,
) {
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
 * Returns a hook that can call the given form action.
 * @param fn The action.
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
  const [isExecuting, setIsExecuting] = useState(false);
  const [status, setStatus] = useState<ActionState<TResult, TError>>();

  const execute = useCallback(
    async (input: TInput) => {
      setIsExecuting(true);

      try {
        const result = await fn(input);

        if (result.success) {
          onSuccess?.(result.data);
        } else {
          onError?.(result.error);
        }

        onSettled?.(result);
        setStatus(result);
        return result;
      } finally {
        setIsExecuting(false);
      }
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
