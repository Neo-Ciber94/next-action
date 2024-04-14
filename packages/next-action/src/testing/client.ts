/* eslint-disable @typescript-eslint/no-explicit-any */
import { type ActionRecord } from "./server";
import { encodeAsync } from "seria/form-data";
import { parseFromStream } from "seria";

/**
 * Options for the client.
 *
 * @internal
 */
export type CreateActionClientOptions = {
  /**
   * Cookies to pass in each request.
   */
  cookies: Record<string, string>;
};

/**
 * Represents a response from a server action.
 */
export type ActionResponse<T> = {
  /**
   * Parse the result of the server action to a JSON.
   *
   * @throws If the server action redirect the client
   * @throws If the server action call failed
   * @throws If the body was already consumed
   */
  json(): Promise<T>;
  /**
   * The headers send from the server action.
   */
  headers: Headers;

  /**
   * Whether if the response body was already consumed.
   */
  bodyUsed: boolean;

  /**
   * Whether if the response was successful (status in the range 200-299).
   */
  ok: boolean;

  /**
   * Whether if the server action redirect the client.
   */
  redirected: boolean;
};

/**
 * @internal
 */
export type ServerActionClient<T extends ActionRecord> = {
  [K in keyof T]: (...args: Parameters<T[K]>) => Promise<ActionResponse<Awaited<ReturnType<T[K]>>>>;
};

/**
 * When a server action response is a redirection.
 */
export class ServerActionRedirectError extends Error {}

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
            redirect: "manual",
            body: formData,
            headers,
          });

          return createServerActionResponse<T>(res);
        };
      },
    },
  ) as ServerActionClient<T>;
}

function createServerActionResponse<T>(res: Response): ActionResponse<T> {
  return {
    get headers() {
      return res.headers;
    },
    get redirected() {
      return isRedirectStatusCode(res.status);
    },
    get ok() {
      return res.ok;
    },
    get bodyUsed() {
      return res.bodyUsed;
    },
    async json() {
      return resolveResponseJson(res);
    },
  };
}

async function resolveResponseJson<T>(res: Response) {
  if (isRedirectStatusCode(res.status)) {
    throw new ServerActionRedirectError("The server action result was a redirect");
  }

  if (res.bodyUsed) {
    throw new Error("The request body was already used");
  }

  if (!res.ok) {
    const isJson = res.headers.get("content-type") === "application/json";
    const isActionError = res.headers.get("x-server-action-error");
    const contents = await res.text();

    if (isJson) {
      const err = JSON.parse(contents);
      const message =
        isActionError && typeof err?.message === "string" ? err.message : "Something went wrong";
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
}

function isRedirectStatusCode(status: number) {
  return status >= 300 && status < 400;
}
