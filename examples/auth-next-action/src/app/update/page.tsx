import { getUser } from "@/lib/actions/auth.queries";
import { redirect } from "next/navigation";
import UpdateForm from "./updateForm";
import Link from "next/link";
import { type Metadata } from "next";

export const metadata: Metadata = {
  title: "Update",
};

export default async function UpdatePage() {
  const user = await getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full sm:max-w-sm max-w-[95%]">
        <h1 className="text-2xl font-bold mb-4 text-center">Update</h1>
        <UpdateForm user={user} />
        <Link href="/" className="mt-4 text-blue-500 hover:underline text-center">
          Go to profile
        </Link>
      </div>
    </div>
  );
}
