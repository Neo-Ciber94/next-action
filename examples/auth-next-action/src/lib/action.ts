import { createServerActionProvider } from "next-action/server";
import { redirect } from "next/navigation";
import { getSession } from "./actions/auth.queries";

export const publicAction = createServerActionProvider();

export const authAction = createServerActionProvider({
  async onBeforeExecute() {
    const session = await getSession();

    if (!session) {
      redirect("/login");
    }

    return { session };
  },
});
