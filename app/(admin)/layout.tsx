import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getSessionByToken } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const token = (await cookies()).get("session_token")?.value;
  const user = await getSessionByToken(token);
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/dashboard");

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-white shadow-sm">
        <nav className="max-w-4xl mx-auto px-4 py-4 flex gap-4">
          <Link href="/admin" className="text-slate-900 hover:text-amber-600 font-medium">
            Admin
          </Link>
          <Link href="/dashboard" className="text-slate-600 hover:text-slate-900">
            Back to app
          </Link>
        </nav>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
