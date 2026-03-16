import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getSessionByToken } from "@/lib/auth";

export default async function HomePage() {
  const token = (await cookies()).get("session_token")?.value;
  const user = await getSessionByToken(token);
  if (user) redirect("/dashboard");

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <h1 className="text-3xl font-serif font-semibold text-slate-900">SANCTUARY</h1>
      <p className="mt-2 text-slate-600">Church community app</p>
      <nav className="mt-8 flex gap-4">
        <Link
          href="/login"
          className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl focus-visible:outline focus-visible:ring-2 focus-visible:ring-amber-500"
        >
          Login
        </Link>
        <Link
          href="/signup"
          className="px-4 py-2 border border-slate-300 rounded-xl hover:bg-slate-100 focus-visible:outline focus-visible:ring-2 focus-visible:ring-amber-500"
        >
          Sign up
        </Link>
      </nav>
    </main>
  );
}
