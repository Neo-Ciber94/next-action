import { loginUser, logoutUser, registerUser, updateUser } from "@/lib/actions/auth.mutations";
import { getUser } from "@/lib/actions/auth.queries";
import { exposeServerActions } from "next-action/testing/server";

const handler = exposeServerActions({
  actions: {
    loginUser,
    registerUser,
    logoutUser,
    updateUser,
    getUser,
  },
});

export type TestActions = typeof handler.actions;

export const POST = handler;
