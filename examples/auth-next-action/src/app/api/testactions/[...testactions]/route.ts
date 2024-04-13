import { loginUser, logoutUser, registerUser, updateUser } from "@/lib/actions/auth.mutations";
import { exposeServerActions } from "next-action/testing/server";

const handler = exposeServerActions({
  actions: {
    loginUser,
    registerUser,
    logoutUser,
    updateUser,
  },
});

export type TestActions = typeof handler.actions;

export const POST = handler;
