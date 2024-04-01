import { describe, test, beforeAll, afterAll } from "vitest";
import { spawn, ChildProcess } from "child_process";
import path from "path";

let serverProcess: ChildProcess | undefined = undefined;
beforeAll(async () => {
  serverProcess = await startDevServer();
});

afterAll(() => {
  serverProcess?.kill();
});

describe("MediaWatch List", () => {});

async function startDevServer(): Promise<ChildProcess> {
  const cwdDir = path.join("..");
  var isWin = process.platform === "win32";
  const cmd = isWin ? "npm.cmd" : "npm";
  const childProcess = spawn(cmd, ["run dev"], {
    cwd: cwdDir,
    env: {
      ...process.env,
      BASE_URL: "http://localhost:3230",
    },
  });

  ["SIGINT", "exit", "unhandledRejection"].forEach((event) => {
    process.on(event, () => {
      childProcess.kill();
    });
  });

  return childProcess;
}
