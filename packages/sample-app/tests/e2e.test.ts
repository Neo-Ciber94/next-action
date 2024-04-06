import { describe, beforeAll, afterAll, expect, test } from "vitest";
import { spawn, type ChildProcess } from "child_process";
import path from "path";
import fs from "fs/promises";
import { createServerActionClient } from "next-action/testing/client";
import { type TestActions } from "@/app/api/[...testactions]/route";

const PORT = 3456;
const BASE_URL = `http://localhost:${PORT}`;

if (!globalThis.File) {
  globalThis.File = require("buffer").File;
}

let serverProcess: ChildProcess | undefined = undefined;
beforeAll(async () => {
  serverProcess = await startDevServer();
}, 120_000);

afterAll(() => {
  serverProcess?.kill();
});

describe("MediaWatch List", () => {
  test("Should call test action", async () => {
    const client = createServerActionClient<TestActions>(`${BASE_URL}/testactions`);

    await expect(client.getWatchMediaList()).resolves.toStrictEqual([]);

    await client.createWatchMedia({
      title: "Title 1",
      watched: true,
      releaseDate: new Date(2024, 3, 6),
      genres: new Set(["genre1", "genre2"]),
      type: "movie",
      notes: "Notes",
      image: await (async () => {
        const file = await readArtifact("image.jpg");
        const formData = new FormData();
        formData.set("image", file);
        return formData;
      })(),
    });

    await client.createWatchMedia({
      title: "Title 2",
      watched: false,
      releaseDate: new Date(2024, 3, 1),
      genres: new Set(["genre1", "genre3"]),
      type: "series",
      notes: "Notes 2",
      image: await (async () => {
        const file = await readArtifact("image.jpg");
        const formData = new FormData();
        formData.set("image", file);
        return formData;
      })(),
    });
  });
});

function startDevServer(): Promise<ChildProcess> {
  const cwdDir = path.join("..");
  const isWin = process.platform === "win32";
  const cmd = isWin ? "npm.cmd" : "npm";
  const childProcess = spawn(cmd, ["run", "dev", `--port ${PORT}`], {
    cwd: cwdDir,
    env: {
      ...process.env,
      BASE_URL,
    },
  });

  ["SIGINT", "exit", "unhandledRejection"].forEach((event) => {
    process.on(event, () => {
      childProcess.kill();
    });
  });

  return new Promise((resolve) => {
    childProcess.stdout.on("data", (data: Buffer) => {
      const s = data.toString("utf-8");
      console.log(s);
      if (s.includes("Listening")) {
        resolve(childProcess);
      }
    });
  });
}

async function readArtifact(fileName: string) {
  const dir = path.join(__dirname, "..", "artifacts");
  const filePath = path.join(dir, fileName);
  const buffer = await fs.readFile(filePath);
  const file = new File([buffer], fileName);
  return file;
}
