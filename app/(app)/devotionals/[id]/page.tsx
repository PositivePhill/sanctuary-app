import Link from "next/link";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { getSessionByToken } from "@/lib/auth";

export default async function DevotionalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get("session_token")?.value;
  const user = await getSessionByToken(token);

  const devotional = await prisma.devotional.findUnique({
    where: { id },
    include: { author: { select: { name: true } } },
  });

  if (!devotional) notFound();

  const now = new Date();
  const isPublished = devotional.publishDate <= now;
  const isAdmin = user?.role === "ADMIN";

  if (!isPublished && !isAdmin) notFound();

  return (
    <article className="max-w-2xl mx-auto font-serif">
      <Link
        href="/devotionals"
        className="inline-block text-sm text-slate-600 hover:text-amber-600 mb-8 focus:outline-none focus:ring-2 focus:ring-amber-500 rounded"
      >
        ← Back to devotionals
      </Link>

      <header className="mb-8">
        <p className="text-amber-600 font-medium text-sm uppercase tracking-wide">
          {devotional.scriptureReference}
        </p>
        <h1 className="text-3xl font-semibold text-slate-900 mt-2">
          {devotional.title}
        </h1>
        <p className="text-slate-500 text-sm mt-4">
          {devotional.author.name} · {devotional.publishDate.toLocaleDateString(undefined, { dateStyle: "long" })}
        </p>
      </header>

      <div className="text-slate-700 text-lg leading-relaxed">
        {devotional.content.split("\n").map((para, i) => (
          <p key={i} className="mb-4">
            {para || "\u00A0"}
          </p>
        ))}
      </div>
    </article>
  );
}
