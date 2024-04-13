"use client";
import { registerUser } from "@/lib/actions/auth.mutations";
import { useFormAction } from "next-action/react";

export default function RegisterForm() {
  const registerAction = useFormAction(registerUser);

  return (
    <form action={registerAction.action} className="max-w-xs mx-auto mt-8">
      <input
        name="username"
        type="text"
        placeholder="Username"
        className="w-full px-4 py-2 mb-4 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
        autoComplete="username"
        required
      />
      <input
        name="email"
        type="email"
        placeholder="Email"
        className="w-full px-4 py-2 mb-4 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
        autoComplete="email"
        required
      />
      <input
        name="secretNumber"
        type="number"
        min={-100}
        max={100}
        placeholder="Secret Number"
        className="w-full px-4 py-2 mb-4 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
        required
      />

      <label className="flex flex-row items-center gap-2 mb-4">
        <input name="likesCoffee" type="checkbox" className="w-5 h-5 accent-blue-600" />
        <span className="text-gray-400 font-medium"> Likes Coffee?</span>
      </label>

      <input
        name="password"
        type="password"
        placeholder="Password"
        className="w-full px-4 py-2 mb-4 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
        autoComplete="new-password"
        required
      />
      {registerAction.error && (
        <small className="block text-red-500 text-sm mb-4">{registerAction.error}</small>
      )}
      <button
        type="submit"
        className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        disabled={registerAction.isExecuting}
      >
        {registerAction.isExecuting ? "Loading..." : "Register"}
      </button>
    </form>
  );
}
