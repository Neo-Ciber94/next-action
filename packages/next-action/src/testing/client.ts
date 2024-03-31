/* eslint-disable @typescript-eslint/no-explicit-any */
import { type ActionRecord } from "./server";
import { encodeToFormData } from "seria/form-data";
import { parse } from "seria";

type CreateActionClientOptions = {
  cookies: Record<string, string>;
};

type ServerActionClient<T extends ActionRecord> = {
  [K in keyof T]: (...args: Parameters<T[K]>) => ReturnType<T[K]>;
};

/*

ActionResponse<T> = {
  json() => Promise<T>,
  headers: () => Headers,
  cookies: () => Record<string, string>
}
*/

export function createServerActionClient<T extends ActionRecord>(
  url: string,
  opts?: CreateActionClientOptions
) {
  const { cookies } = opts || {};
  const headers = new Headers();

  if (cookies) {
    for (const [cookieName, cookieValue] of Object.entries(cookies)) {
      headers.append(
        "COOKIE",
        `${encodeURIComponent(cookieName)}=${encodeURIComponent(cookieValue)}`
      );
    }
  }

  return new Proxy(
    {},
    {
      get(_, path) {
        return async function (...args: any[]) {
          const formData = await encodeToFormData(args);
          const endpoint = `${url}/${String(path)}`;
          const res = await fetch(endpoint, {
            method: "POST",
            body: formData,
            headers,
          });

          if (!res.ok) {
            if (res.headers.get("content-type") === "application/json") {
              const err = await res.json();
              const message =
                typeof err?.message === "string"
                  ? err.message
                  : "Something went wrong";

              throw new Error(message);
            } else {
              const err = await res.text();
              console.error(err);
              throw new Error("Unexpected error");
            }
          }

          const json = await res.json();
          const value = parse(json);
          return value;
        };
      },
    }
  ) as ServerActionClient<T>;
}
