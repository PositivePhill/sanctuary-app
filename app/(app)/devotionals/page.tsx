import Link from "next/link";
import { BookOpen } from "lucide-react";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { getSessionByToken } from "@/lib/auth";

export default async function DevotionalsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session_token")?.value;
  const user = await getSessionByToken(token);
  const now = new Date();

  const devotionals = await prisma.devotional.findMany({
    where: user?.role === "ADMIN" ? undefined : { publishDate: { lte: now } },
    orderBy: { publishDate: "desc" },
    include: { author: { select: { name: true } } },
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900 mb-6">Devotionals</h1>

      {devotionals.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
          <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-7 h-7 text-amber-600" aria-hidden />
          </div>
          <h2 className="text-lg font-medium text-slate-900 mb-1">No devotionals yet</h2>
          <p className="text-slate-600 text-sm">Check back soon for inspiring devotionals from your community.</p>
        </div>
      ) : (
        <ul className="space-y-4" role="list">
          {devotionals.map((d) => (
            <li key={d.id}>
              <Link
                href={`/devotionals/${d.id}`}
                className="block bg-white rounded-2xl shadow-md p-6 hover:shadow-lg transition-shadow focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <h2 className="text-lg font-semibold text-slate-900">{d.title}</h2>
                <p className="text-sm text-amber-600 mt-1">{d.scriptureReference}</p>
                <p className="text-sm text-slate-500 mt-2">
                  {d.author.name} · {d.publishDate.toLocaleDateString(undefined, { dateStyle: "medium" })}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
