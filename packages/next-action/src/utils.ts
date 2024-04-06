/* eslint-disable @typescript-eslint/no-explicit-any */
import { ActionError } from ".";

/**
 * Maps an error to string.
 * @param err The error.
 */
export function defaultErrorMapper(err: any): string {
  if (err instanceof ActionError) {
    return err.message;
  }

  // We only display error messages from 'Error' instances on development mode
  if (process.env.NODE_ENV === "production") {
    return "Something went wrong";
  }

  if (err instanceof Error) {
    return err.message;
  }

  if (typeof err?.toString === "function") {
    return err.toString();
  }

  try {
    return JSON.stringify(err);
  } catch {
    return "Unexpected error";
  }
}
