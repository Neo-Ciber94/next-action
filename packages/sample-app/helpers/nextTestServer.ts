import { spawn, type ChildProcess } from "child_process";
import net from "net";

export interface NextTestServer {
  readonly childProcess: ChildProcess;
  stop(): void;
}

type NextTestServerOptions = {
  host?: string;
  port?: number;
  envVars?: Record<string, string>;
  isProd?: boolean;
  onReady?: () => Promise<void> | void;
  onStdout?: (data: string) => void;
  onStderr?: (data: string) => void;
};

export function startNextTestServer(opts?: NextTestServerOptions) {
  const isWin = process.platform === "win32";
  const cmd = isWin ? "npm.cmd" : "npm";

  const {
    port = 3000,
    host = "localhost",
    envVars = {},
    onStdout = console.log,
    onStderr = console.error,
    onReady,
    isProd = false,
  } = opts || {};
  const childProcess = spawn(cmd, ["run", isProd ? "prod" : "dev"], {
    env: {
      ...process.env,
      ...envVars,
      PORT: String(port),
      HOST: host,
    },
  });

  ["SIGINT", "exit", "SIGTERM", "SIGHUP", "unhandledRejection"].forEach((event) => {
    process.on(event, () => {
      childProcess.kill();
    });
  });

  childProcess.stdout.setEncoding("utf8");
  childProcess.stderr.setEncoding("utf8");

  let init = false;
  let isSettled = false;

  return new Promise<NextTestServer>((resolve, reject) => {
    childProcess.stderr.on("data", (data) => {
      if (!isSettled) {
        isSettled = true;
        reject(new Error(`Failed to start test server: ${data}`));
      }

      onStderr?.(data);
    });

    childProcess.stdout.on("data", (data) => {
      onStdout?.(data);

      if (!init) {
        init = true;

        waitForConnection({ host, port })
          .then(async (isConnected) => {
            if (isSettled) {
              return;
            }

            if (isConnected) {
              const nextServer: NextTestServer = {
                get childProcess() {
                  return childProcess;
                },
                stop() {
                  childProcess.kill();
                },
              };

              isSettled = true;

              await Promise.all([
                Promise.resolve(onReady?.()),
                Promise.resolve(resolve(nextServer)),
              ]);
            } else {
              childProcess.kill();
              reject(new Error("Failed to start next dev server"));
            }
          })
          .catch((err) => {
            childProcess.kill();
            reject(err);
          });
      }
    });
  });
}

type WaitForConnectionOptions = {
  host: string;
  port: number;
  timeout?: number;
};

async function waitForConnection({ host, port, timeout = 10_000 }: WaitForConnectionOptions) {
  function checkIsConnected() {
    return new Promise((resolve) => {
      const socket = net.createConnection({ host, port, timeout: 3000 }, () => {
        socket.end();
        resolve(true);
      });

      socket.on("error", () => {
        resolve(false);
      });
    });
  }

  let isResolved = false;

  return new Promise<boolean>((resolve) => {
    const timeoutId = setTimeout(() => {
      if (!isResolved) {
        isResolved = true;
        resolve(false);
      }
    }, timeout);

    async function checkIsConnectionReady() {
      for (;;) {
        if (isResolved) {
          return;
        }

        const isReady = await checkIsConnected();

        if (isReady && !isResolved) {
          isResolved = true;
          resolve(true);
          clearTimeout(timeoutId);
        }
      }
    }

    void checkIsConnectionReady();
  });
}
