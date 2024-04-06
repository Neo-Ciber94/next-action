/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { isNotFoundError } from "next/dist/client/components/not-found";
import { isRedirectError } from "next/dist/client/components/redirect";
import { defaultErrorMapper } from "./utils";

/**
 * Validate the input of a server action.
 */
type Validator<T> = {
  parse: (value: unknown) => T;
};

/**
 * Options for a server action.
 */
export type ActionOptions<T> = {
  validator: Validator<T>;
};

export type ActionFunction<T, TResult, TCtx> = undefined extends T
  ? (opts: { input?: T; context: TCtx }) => Promise<TResult>
  : (opts: { input: T; context: TCtx }) => Promise<TResult>;

type CreateProviderContext<TContext> = { context?: void } | { context: TContext };

/**
 * Options to create the server action provider.
 */
export type CreateProviderOptions<TError, TContext, TCtx> = CreateProviderContext<TContext> & {
  /**
   * When an error occured, map the error to a value. By default we map the value to a `string`.
   * @param err The error
   */
  mapError?: (err: any) => TError;

  /**
   * Run before executing a server action.
   */
  onBeforeExecute?: (opts: {
    input: unknown;
    context: TContext;
  }) => TCtx | void | Promise<TCtx | void>;

  /**
   * Run after executing a server action.
   */
  onAfterExecute?: (opts: { result: unknown; context: TCtx }) => void | Promise<void>;
};

/**
 * Represents the output of a server action, this can be either a success or failure.
 */
export type ActionResult<TResult, TError> = Promise<
  { success: true; data: TResult } | { success: false; error: TError }
>;

/**
 * Create a function to create other server actions.
 * @param options The options for the provider.
 */
export function createServerActionProvider<TError = string, TContext = {}, TCtx = TContext>(
  options?: CreateProviderOptions<TError, TContext, TCtx>,
) {
  type TNextContext = void extends TCtx ? TContext : TCtx;

  const {
    mapError = defaultErrorMapper,
    context: initialContext = {},
    onBeforeExecute,
    onAfterExecute,
  } = options || {};

  let context = initialContext as any;

  /**
   * Create a server action that takes a value.
   * @param fn The function.
   * @param actionOptions Additional options, like a validator.
   */
  function action<T = void, TResult = any>(
    fn: ActionFunction<T, TResult, TNextContext>,
    actionOptions?: ActionOptions<T>,
  ) {
    return async function (input: T): ActionResult<TResult, TError> {
      const { validator = { parse: identity } } = actionOptions || {};

      try {
        if (onBeforeExecute) {
          const nextContext = await onBeforeExecute({ input, context });

          if (nextContext) {
            context = nextContext;
          }
        }

        const safeInput = validator.parse(input);
        const result = await fn({ input: safeInput, context });

        if (onAfterExecute) {
          await onAfterExecute({ result, context });
        }

        return {
          success: true,
          data: result,
        };
      } catch (err) {
        if (isRedirectError(err)) {
          throw err;
        }

        // FIXME: Not sure if we should return this
        if (isNotFoundError(err)) {
          throw err;
        }

        const error = mapError(err) as TError;

        return {
          success: false,
          error,
        };
      }
    };
  }

  /**
   * Create a server action that takes a `FormData`.
   * @param fn The function.
   * @param actionOptions Additional options, like a validator.
   */
  function formAction<T = void, TResult = void>(
    fn: (opts: { input: T; context: TCtx }) => Promise<TResult>,
    actionOptions?: ActionOptions<T>,
  ) {
    const baseAction = action<T, TResult>(
      fn as ActionFunction<T, TResult, TNextContext>,
      actionOptions,
    );

    async function innerFormAction(formData: FormData) {
      const input = Object.fromEntries(formData);
      return baseAction(input as unknown as T);
    }

    // A way to invoke a formAction in a typed manner
    innerFormAction.action = baseAction;
    return innerFormAction;
  }

  action.formAction = formAction;

  return action;
}

const identity = <T>(value: T) => value;
