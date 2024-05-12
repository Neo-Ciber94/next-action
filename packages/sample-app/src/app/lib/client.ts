import { createServerActionProvider } from "next-action/server";
import { defaultErrorMapper } from "next-action/utils";
import { ValiError } from "valibot";

export const action = createServerActionProvider({
  mapError(err) {
    if (err instanceof ValiError) {
      return err.message;
    }

    return defaultErrorMapper(err);
  },
});
