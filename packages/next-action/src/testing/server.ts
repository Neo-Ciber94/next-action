/* eslint-disable @typescript-eslint/no-explicit-any */
import { decode } from "seria/form-data";
import { stringifyAsync } from "seria";

export type ActionRecord = {
  [key: string]: (...args: any[]) => Promise<unknown>;
};

export function exposeServerActions<T extends ActionRecord>(actions: T) {
  const handler = async function (req: Request) {
    if (!process.env.EXPOSE_SERVER_ACTIONS) {
      throw new Error(
        "Set `EXPOSE_SERVER_ACTIONS` environment variable to allow call server actions from an endpoint",
      );
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
      const jsonString = await stringifyAsync(ret);
      return json(jsonString);
    } catch (err) {
      console.error(err);
      return json({ message: "Server action call failed" }, { status: 400 });
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
