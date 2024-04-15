import type { ServerFunction, ActionRecord } from "./types";
import { encodeAsync } from "seria/form-data";
import { parseFromStream } from "seria";

/**
 * Options for the server action client.
 */
export type CreateActionClientOptions = {
  /**
   * Cookies to pass in each request.
   */
  cookies?:
    | Record<string, string>
    | (() => Promise<Record<string, string>> | Record<string, string>);

  /**
   * Headers to pass in each request.
   */
  headers?: HeadersInit | (() => HeadersInit | Promise<HeadersInit>);
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
  [K in keyof T]: T[K] extends ActionRecord
    ? ServerActionClient<T[K]>
    : T[K] extends ServerFunction
      ? (...args: Parameters<T[K]>) => Promise<ActionResponse<Awaited<ReturnType<T[K]>>>>
      : never;
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
  const options = opts || {};

  return createRecursiveProxy([], async (paths, args) => {
    if (paths.length === 0) {
      throw new Error("No action to call");
    }

    const path = paths.join("/");

    const headers = await getRequestHeaders(options);
    const formData = await encodeAsync(args);
    const endpoint = `${url}/${path}`;
    const res = await fetch(endpoint, {
      method: "POST",
      redirect: "manual",
      body: formData,
      headers,
    });

    return createServerActionResponse<T>(res);
  }) as ServerActionClient<T>;
}

type Key = string | symbol;

type Callback = (paths: Key[], args: unknown[]) => unknown;

function createRecursiveProxy(paths: Key[], callback: Callback): unknown {
  const proxy = new Proxy(() => {}, {
    get(_target, key) {
      return createRecursiveProxy([...paths, key], callback);
    },
    apply(_target, _this, args) {
      return callback(paths, args);
    },
  });

  return proxy;
}

async function getRequestHeaders(opts: CreateActionClientOptions) {
  const requestHeaders = new Headers();

  if (opts.headers) {
    const getHeaders = typeof opts.headers === "function" ? opts.headers() : opts.headers;
    const headers = new Headers(await Promise.resolve(getHeaders));

    for (const [name, value] of headers.entries()) {
      requestHeaders.append(name, value);
    }
  }

  if (opts.cookies) {
    const getCookies = typeof opts.cookies === "function" ? opts.cookies() : opts.cookies;
    const cookies = await Promise.resolve(getCookies);

    for (const [cookieName, cookieValue] of Object.entries(cookies)) {
      requestHeaders.append(
        "COOKIE",
        `${encodeURIComponent(cookieName)}=${encodeURIComponent(cookieValue)}`,
      );
    }
  }

  return requestHeaders;
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
