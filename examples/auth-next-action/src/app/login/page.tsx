import { getUser } from "@/lib/actions/auth.queries";
import { redirect } from "next/navigation";
import LoginForm from "./loginForm";
import Link from "next/link";
import { type Metadata } from "next";

export const metadata: Metadata = {
  title: "Login",
};

export default async function LoginPage() {
  const user = await getUser();

  if (user) {
    redirect("/");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full sm:max-w-sm max-w-[95%]">
        <h1 className="text-2xl font-bold mb-4 text-center">Login</h1>
        <LoginForm />
        <p className="text-center mt-4 text-sm">
          {"Don't have an account?"}{" "}
          <Link href="/register" className="text-blue-500 hover:underline">
            Register instead
          </Link>
        </p>
      </div>
    </div>
  );
}
