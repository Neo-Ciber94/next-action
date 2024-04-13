"use client";
import Spinner from "@/components/spinner";
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
          id="username"
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
          id="email"
          name="email"
          type="email"
          defaultValue={user.email}
          readOnly
          className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed"
        />
      </div>

      <div className="mb-4">
        <label htmlFor="secretNumber" className="block text-sm font-medium text-gray-700">
          Secret Number
        </label>
        <input
          id="secretNumber"
          name="secretNumber"
          type="number"
          placeholder="Secret Number"
          defaultValue={user.secretNumer}
          className="w-full px-4 py-2 mb-4 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
          required
        />
      </div>

      <div className="mb-4">
        <label className="flex flex-row items-center gap-2 mb-4">
          <input
            name="likesCoffee"
            type="checkbox"
            className="w-5 h-5 accent-blue-600"
            defaultChecked={user.likesCoffee}
          />
          <span className="text-gray-400 font-medium"> Likes Coffee?</span>
        </label>
      </div>

      {updateAction.error && (
        <small className="block text-red-500 text-sm mb-4">{updateAction.error}</small>
      )}
      <button
        type="submit"
        className="w-full bg-blue-500 flex justify-center flex-row px-2 items-center gap-2 hover:bg-blue-600 text-white font-bold py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        disabled={updateAction.isExecuting}
      >
        {updateAction.isExecuting && <Spinner className="w-5 h-5" />}
        {updateAction.isExecuting ? "Loading..." : "Update"}
      </button>
    </form>
  );
}
