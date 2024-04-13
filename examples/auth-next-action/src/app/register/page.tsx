import Link from "next/link";
import RegisterForm from "./registerForm";
import { getUser } from "@/lib/actions/auth.queries";
import { redirect } from "next/navigation";
import { type Metadata } from "next";

export const metadata: Metadata = {
  title: "Register",
};

export default async function RegisterPage() {
  const user = await getUser();

  if (user) {
    redirect("/");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full sm:max-w-sm max-w-[95%]">
        <h1 className="text-2xl font-bold mb-4 text-center">Register User</h1>
        <RegisterForm />
        <p className="text-center mt-4 text-sm">
          {"Already have an account?"}{" "}
          <Link href="/login" className="text-blue-500 hover:underline">
            Login instead
          </Link>
        </p>
      </div>
    </div>
  );
}
