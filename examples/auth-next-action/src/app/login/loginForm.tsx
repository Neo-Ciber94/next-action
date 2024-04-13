"use client";
import Spinner from "@/components/spinner";
import { loginUser } from "@/lib/actions/auth.mutations";
import { useFormAction } from "next-action/react";

export default function LoginForm() {
  const loginAction = useFormAction(loginUser);

  return (
    <form action={loginAction.action} className="max-w-xs mx-auto mt-8">
      <input
        name="email"
        type="email"
        className="w-full px-4 py-2 mb-4 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
        placeholder="Email"
        autoComplete="email"
        required
      />
      <input
        name="password"
        type="password"
        className="w-full px-4 py-2 mb-4 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
        placeholder="Password"
        autoComplete="current-password"
        required
      />
      {loginAction.error && (
        <small className="block text-red-500 text-sm mb-4">{loginAction.error}</small>
      )}
      <button
        type="submit"
        className="w-full bg-blue-500 flex flex-row justify-center px-2 items-center gap-2 hover:bg-blue-600 text-white font-bold py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        disabled={loginAction.isExecuting}
      >
        {loginAction.isExecuting && <Spinner className="w-5 h-5" />}
        {loginAction.isExecuting ? "Loading..." : "Login"}
      </button>
    </form>
  );
}
