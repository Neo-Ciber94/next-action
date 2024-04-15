// @vitest-environment node
import { describe, test, expect } from "vitest";
import { exposeServerActions } from "./server";
import { encode } from "seria/form-data";
import { parseFromStream } from "seria";

const ENDPOINT = "/api/testactions";

beforeAll(() => {
  process.env.EXPOSE_SERVER_ACTIONS = "1";
});

describe("Call exposed server actions", () => {
  test("Should call server actions", async () => {
    const handler = exposeServerActions({
      endpoint: ENDPOINT,
      actions: {
        timesTen: async (n: number) => n * 10,
        hello: async () => "Hello World",
        sum: async (a: number, b: number, c: number) => a + b + c,
        objectKeys: async ({ obj }: { obj: Record<string, unknown> }) => {
          return Object.keys(obj);
        },
      },
    });

    const timesTenResponse = await handler(createRequest("/timesTen", 4));
    expect(timesTenResponse.ok).toBeTruthy();
    expect(timesTenResponse.status).toStrictEqual(200);

    const timesTen = await decodeResponse(timesTenResponse);
    expect(timesTen).toStrictEqual(40);

    const helloResponse = await handler(createRequest("/hello"));
    const hello = await decodeResponse(helloResponse);
    expect(hello).toStrictEqual("Hello World");

    const sumResponse = await handler(createRequest("/sum", 2, 4, 6));
    const sum = await decodeResponse(sumResponse);
    expect(sum).toStrictEqual(12);

    const objectKeysResponse = await handler(
      createRequest("/objectKeys", { obj: { x: 1, b: "hello", c: false } }),
    );
    const objectKeys = await decodeResponse(objectKeysResponse);
    expect(objectKeys).toStrictEqual(["x", "b", "c"]);
  });

  test("Should call nested server actions", async () => {
    const handler = exposeServerActions({
      endpoint: ENDPOINT,
      actions: {
        id: async () => "f7cabebe-0b7e-43ce-a68a-8f68473af914",
        num: {
          multiply: async (a: number, b: number) => a * b,
        },
        text: {
          concat: async (...strings: string[]) => strings.join(""),
        },
      },
    });

    const idResponse = await handler(createRequest("/id"));
    const id = await decodeResponse(idResponse);
    expect(id).toStrictEqual("f7cabebe-0b7e-43ce-a68a-8f68473af914");

    const num_multiplyResponse = await handler(createRequest("/num/multiply", 5, 6));
    const num_multiply = await decodeResponse(num_multiplyResponse);
    expect(num_multiply).toStrictEqual(30);

    const text_concatResponse = await handler(
      createRequest("/text/concat", "yuu", "touko", "kiss"),
    );
    const text_concat = await decodeResponse(text_concatResponse);
    expect(text_concat).toStrictEqual("yuutoukokiss");
  });

  test("Should throw 404 on server action not found", async () => {
    const handler = exposeServerActions({
      endpoint: ENDPOINT,
      actions: {
        auth: {
          getSession: async () => 1,
        },
      },
    });

    const notFoundRes = await handler(createRequest("/auth"));
    expect(notFoundRes.status).toStrictEqual(404);

    const getSessionResponse = await handler(createRequest("/auth/getSession"));
    const auth_getSession = await decodeResponse(getSessionResponse);
    expect(auth_getSession).toStrictEqual(1);
  });
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function createRequest(path: string, ...args: any[]) {
  const formData = encode(args);
  return new Request(`http://localhost:1111/${ENDPOINT}/${path}`, {
    method: "POST",
    body: formData,
  });
}

async function decodeResponse(res: Response) {
  const stream = res.body?.pipeThrough(
    new TransformStream<Uint8Array, string>({
      transform(chunk, controller) {
        // TexrDecoderStream should work but I got: Serialized Error: { code: 'ERR_INVALID_ARG_TYPE' }
        const jsonChunk = Buffer.from(chunk).toString();
        controller.enqueue(jsonChunk);
      },
    }),
  );

  if (!stream) {
    throw new Error("No stream to decode");
  }

  return await parseFromStream(stream);
}
