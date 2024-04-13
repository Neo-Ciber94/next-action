import { createServerActionProvider } from "next-action/server";
import { redirect } from "next/navigation";
import { getSession } from "./actions/auth.queries";
import { defaultErrorMapper } from "next-action/utils";
import { ZodError } from "zod";

export const publicAction = createServerActionProvider({ mapError });

export const authAction = createServerActionProvider({
  mapError,
  async onBeforeExecute() {
    const session = await getSession();

    if (!session) {
      redirect("/login");
    }

    return { session };
  },
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapError(error: any) {
  if (error instanceof ZodError) {
    return error.issues.map((issue) => `${issue.path}: ${issue.message}`).join("\n");
  }

  return defaultErrorMapper(error);
}
