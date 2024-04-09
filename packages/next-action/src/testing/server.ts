/* eslint-disable @typescript-eslint/no-explicit-any */
import { decode } from "seria/form-data";
import { stringifyToStream } from "seria";
import { ActionError } from "..";

const EXPOSE_SERVER_ACTIONS_ERROR =
  "Set `EXPOSE_SERVER_ACTIONS` environment variable to allow call server actions from an endpoint";

export type ActionRecord = {
  [key: string]: (...args: any[]) => Promise<unknown>;
};

export function exposeServerActions<T extends ActionRecord>(actions: T) {
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

    const action = actions[name as keyof T];

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

  handler.actions = actions as Readonly<T>;
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
