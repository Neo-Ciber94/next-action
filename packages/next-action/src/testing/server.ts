/* eslint-disable @typescript-eslint/no-explicit-any */
import { decode } from "seria/form-data";
import { stringifyToStream } from "seria";
import { ActionError } from "..";
import { isRedirectError, type RedirectError } from "next/dist/client/components/redirect";
import { isNotFoundError } from "next/dist/client/components/not-found";
import { cookies } from "next/headers";

const EXPOSE_SERVER_ACTIONS_ERROR =
  "Set `EXPOSE_SERVER_ACTIONS` environment variable to allow call server actions from an endpoint";

export type ActionRecord = {
  [key: string]: (...args: any[]) => Promise<unknown>;
};

type ExposeActionsOptions<TActions extends ActionRecord> = {
  actions: TActions;
};

export function exposeServerActions<TActions extends ActionRecord>(
  options: ExposeActionsOptions<TActions>,
) {
  const { actions } = options;
  const handler = async function (req: Request) {
    if (!process.env.EXPOSE_SERVER_ACTIONS) {
      console.error(EXPOSE_SERVER_ACTIONS_ERROR);

      if (process.env.NODE_ENV !== "production") {
        return json({ message: EXPOSE_SERVER_ACTIONS_ERROR });
      }

      return new Response(null, { status: 500 });
    }

    const url = new URL(req.url);
    const pathname = url.pathname;
    const name = pathname.slice(pathname.lastIndexOf("/") + 1);

    if (!name) {
      return json({ message: "No action to call" }, { status: 404 });
    }

    const action = actions[name as keyof TActions];

    if (!action) {
      return json({ message: `Server action '${name}' was not found` }, { status: 404 });
    }

    try {
      const formData = await req.formData();
      const input = decode(formData);

      if (!Array.isArray(input)) {
        return json({ message: "Server action input should be an array" }, { status: 400 });
      }

      const ret = await action(...input);
      const stream = stringifyToStream(ret);
      return new Response(stream, {
        headers: {
          Connection: "Keep-Alive",
          "cache-control": "no-store",
        },
      });
    } catch (err) {
      if (isRedirectError(err)) {
        return getRedirectResponse(err);
      }

      if (isNotFoundError(err)) {
        return new Response(null, { status: 404 });
      }

      console.error(err);

      if (err instanceof ActionError) {
        return json(
          { message: err.message },
          {
            status: 400,
            headers: {
              "x-server-action-error": "1",
            },
          },
        );
      }

      return json({ message: "Server action call failed" }, { status: 500 });
    }
  };

  handler.actions = actions as Readonly<TActions>;
  return handler;
}

type JsonValue = string | number | boolean | null | Array<JsonValue> | { [key: string]: JsonValue };

function json<T extends JsonValue>(value: T, init?: ResponseInit) {
  return new Response(JSON.stringify(value), {
    ...init,
    headers: {
      ...init?.headers,
      "content-type": "application/json",
    },
  });
}

function getRedirectResponse(err: RedirectError<string>) {
  const matches = /^NEXT_REDIRECT;(push|replace);([^;]+);(\d+);$/.exec(err.digest);

  try {
    if (!matches) {
      // We don't know where to redirect the user
      return redirectFailedResponse();
    }

    const location = matches[2];
    const status = parseInt(matches[3]);
    return new Response(null, {
      status,
      headers: {
        location,
      },
    });
  } catch (err) {
    console.error(matches, err);
    return redirectFailedResponse();
  }
}

function redirectFailedResponse() {
  return json(
    { message: "Failed to redirect user" },
    {
      status: 500,
      headers: {
        "x-server-action-error": "1",
      },
    },
  );
}

function getResponseCookies() {
  return Array.from(cookies()).map(([_, cookie]) => cookie);
}
