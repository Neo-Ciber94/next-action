import { logoutUser } from "@/lib/actions/auth.mutations";
import { getUser } from "@/lib/actions/auth.queries";
import { type Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Me",
};

export default async function MePage() {
  const user = await getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="bg-gray-100 min-h-screen flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md w-full sm:max-w-sm max-w-[95%]">
        <h1 className="text-2xl font-bold mb-4">Profile</h1>
        <p className="mb-2">
          <span className="font-bold">Username:</span> {user.username}
        </p>
        <p className="mb-4">
          <span className="font-bold">Email:</span> {user.email}
        </p>

        <Link href="/update" className="text-blue-500 hover:underline mb-4 block">
          Update Profile
        </Link>

        <form>
          <button
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            formAction={async () => {
              "use server";
              await logoutUser();
            }}
          >
            Logout
          </button>
        </form>
      </div>
    </div>
  );
}
