import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getSessionByToken } from "@/lib/auth";
import { AppNav } from "@/components/AppNav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const token = (await cookies()).get("session_token")?.value;
  const user = await getSessionByToken(token);
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-white shadow-sm">
        <AppNav userName={user.name} userRole={user.role} userAvatarStyle={user.avatarStyle} />
      </header>
      <main className="max-w-4xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
