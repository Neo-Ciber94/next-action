"use client";

import type { ActionResult } from "./server";
import { useCallback, useMemo, useState } from "react";

/**
 * Represents a server action.
 */
type Action<T, TResult, TError> = undefined extends T
  ? (input?: T) => ActionResult<TResult, TError>
  : (input: T) => ActionResult<TResult, TError>;

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
  type TArgs = undefined extends Parameters<typeof fn>[0] ? [input?: T | undefined] : [input: T];

  const { onError, onSuccess, onSettled } = options || {};
  const [isExecuting, setIsExecuting] = useState(false);
  const [status, setStatus] = useState<ActionState<TResult, TError>>();

  const execute = useCallback(
    async (...args: TArgs) => {
      setIsExecuting(true);

      try {
        const input = args[0];
        const result = await fn(input as T);

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

  return { execute, status, data, error, isExecuting, isSuccess, isError } as const;
}

type ActionState<TResult, TError> = Awaited<ActionResult<TResult, TError>>;

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
  const { onError, onSuccess, onSettled } = options || {};
  const [status, setStatus] = useState<ActionState<TResult, TError>>();
  const [isExecuting, setIsExecuting] = useState(false);

  const action = useCallback(
    async (formData: FormData) => {
      setIsExecuting(true);

      try {
        const result = await fn(formData);

        if (result.success) {
          onSuccess?.(result.data);
        } else {
          onError?.(result.error);
        }

        onSettled?.(result);
        setStatus(result);
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

  return { action, status, data, error, isExecuting, isSuccess, isError } as const;
}
