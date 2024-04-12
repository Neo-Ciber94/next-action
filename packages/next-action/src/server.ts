/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { isNotFoundError } from "next/dist/client/components/not-found";
import { isRedirectError } from "next/dist/client/components/redirect";
import { defaultErrorMapper } from "./utils";

/**
 * Validate the input of a server action.
 * 
 * @typeParam T type of the value to parse.
 */
export type Validator<T> = {
  /**
   * Convert the value to `T`.
   * @param value The value to parse.
   * @returns The parsed value.
   * @throws If the value cannot be converted to `T`.
   */
  parse: (value: unknown) => T;
};

/**
 * Options for a server action.
 */
export type ActionOptions<T> = {
  /**
   * A validator for the type `T`.
   */
  validator: Validator<T>;
};

/**
 * Represents a server action.
 */
export type ActionFunction<T, TResult, TCtx> = undefined extends T
  ? (params: { input?: T; context: TCtx }) => Promise<TResult>
  : (params: { input: T; context: TCtx }) => Promise<TResult>;

/**
 * A context to pass to the actions.
 * 
 * @internal
 */
export type CreateProviderContext<TContext> =
  | { context?: void }
  | { context: () => TContext | Promise<TContext> };

/**
 * Options to create the server action provider.
 * 
 * @typeParam TError type used for the errors.
 * @typeParam TContext type of the context passed to the server actions.
 * @typeParam TCtx type of the action if converted by a middleware. 
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
  onBeforeExecute?: (params: {
    input: unknown;
    context: TContext;
  }) => TCtx | void | Promise<TCtx | void>;

  /**
   * Run after executing a server action.
   */
  onAfterExecute?: (params: { result: unknown; context: TCtx }) => void | Promise<void>;
};

/**
 * Represents the output of a server action, this can be either a success or failure.
 * 
 * @typeParam TResult type of the server action return type.
 * @typeParam TError type of the error.
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
  /**
   * The server action context.
   */
  type TNextContext = void extends TCtx ? TContext : TCtx;

  const {
    mapError = defaultErrorMapper,
    context: getContext = undefined,
    onBeforeExecute,
    onAfterExecute,
  } = options || {};

  /**
   * Create a server action that takes a value.
   * @param fn The action.
   * @param actionOptions Additional options, like a validator.
   */
  function action<T = void, TResult = any>(
    fn: ActionFunction<T, TResult, TNextContext>,
    actionOptions?: ActionOptions<T>,
  ) {
    return async function (input: T): ActionResult<TResult, TError> {
      const { validator = { parse: identity } } = actionOptions || {};

      try {
        let context: any =
          getContext === undefined ? undefined : await Promise.resolve(getContext());

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
   * @param fn The action.
   * @param actionOptions Additional options, like a validator.
   */
  function formAction<T = void, TResult = void>(
    fn: (params: { input: T; context: TCtx }) => Promise<TResult>,
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
