"use client";
import { updateUser } from "@/lib/actions/auth.mutations";
import { type User } from "@/lib/actions/auth.queries";
import { useFormAction } from "next-action/react";

export default function UpdateForm({ user }: { user: User }) {
  const updateAction = useFormAction(updateUser);

  return (
    <form action={updateAction.action} className="max-w-md mx-auto mt-8">
      <input name="id" type="hidden" value={user.id} readOnly className="hidden" />
      <div className="mb-4">
        <label htmlFor="username" className="block text-sm font-medium text-gray-700">
          Username
        </label>
        <input
          name="username"
          type="text"
          defaultValue={user.username}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
          required
        />
      </div>
      <div className="mb-4">
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          name="email"
          type="email"
          defaultValue={user.email}
          readOnly
          className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed"
        />
      </div>
      {updateAction.error && (
        <small className="block text-red-500 text-sm mb-4">{updateAction.error}</small>
      )}
      <button
        type="submit"
        className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        disabled={updateAction.isExecuting}
      >
        {updateAction.isExecuting ? "Loading..." : "Update"}
      </button>
    </form>
  );
}
