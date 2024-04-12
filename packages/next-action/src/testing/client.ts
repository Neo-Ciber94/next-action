/* eslint-disable @typescript-eslint/no-explicit-any */
import { type ActionRecord } from "./server";
import { encodeAsync } from "seria/form-data";
import { parseFromStream } from "seria";

/**
 * Options for the client.
 */
type CreateActionClientOptions = {
  /**
   * Cookies to pass in each request.
   */
  cookies: Record<string, string>;
};

type ServerActionClient<T extends ActionRecord> = {
  [K in keyof T]: (...args: Parameters<T[K]>) => ReturnType<T[K]>;
};

/**
 * Create a client to call your server actions.
 * @param url The base URL to call your server actions.
 * @param opts Options for your client.
 * @returns The client.
 */
export function createServerActionClient<T extends ActionRecord = never>(
  url: string,
  opts?: CreateActionClientOptions,
) {
  const { cookies } = opts || {};
  const headers = new Headers();

  if (cookies) {
    for (const [cookieName, cookieValue] of Object.entries(cookies)) {
      headers.append(
        "COOKIE",
        `${encodeURIComponent(cookieName)}=${encodeURIComponent(cookieValue)}`,
      );
    }
  }

  return new Proxy(
    {},
    {
      get(_, path) {
        return async function (...args: any[]) {
          const formData = await encodeAsync(args);
          const endpoint = `${url}/${String(path)}`;
          const res = await fetch(endpoint, {
            method: "POST",
            body: formData,
            headers,
          });

          if (!res.ok) {
            const isJson = res.headers.get("content-type") === "application/json";
            const isActionError = res.headers.get("x-server-action-error");
            const contents = await res.text();

            if (isJson) {
              const err = JSON.parse(contents);
              const message =
                isActionError && typeof err?.message === "string"
                  ? err.message
                  : "Something went wrong";
              throw new Error(message);
            } else {
              console.error(contents);
              throw new Error("Unexpected error");
            }
          }

          const stream = res.body?.pipeThrough(new TextDecoderStream());

          if (!stream) {
            throw new Error("Response body is empty");
          }

          const value = await parseFromStream(stream);
          return value as T;
        };
      },
    },
  ) as ServerActionClient<T>;
}
