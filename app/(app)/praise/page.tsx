import Link from "next/link";
import { Sparkles } from "lucide-react";
import { PrayerCard } from "@/components/PrayerWall/PrayerCard";
import { prisma } from "@/lib/db";
import { getSessionByToken } from "@/lib/auth";
import { cookies } from "next/headers";

async function getAnsweredPrayers(page: number) {
  const cookieStore = await cookies();
  const token = cookieStore.get("session_token")?.value;
  const user = await getSessionByToken(token);

  const PAGE_SIZE = 20;
  const skip = (page - 1) * PAGE_SIZE;

  const [prayers, total] = await Promise.all([
    prisma.prayerRequest.findMany({
      where: { status: "ANSWERED" },
      skip,
      take: PAGE_SIZE,
      orderBy: { updatedAt: "desc" },
      include: {
        author: { select: { id: true, name: true } },
        comments: { include: { author: { select: { id: true, name: true } } }, orderBy: { createdAt: "asc" } },
        reactions: true,
      },
    }),
    prisma.prayerRequest.count({ where: { status: "ANSWERED" } }),
  ]);

  const items = prayers.map((p) => {
    const counts = { PRAYING: 0, AMEN: 0, PRAISE: 0 };
    const mine: { PRAYING: boolean; AMEN: boolean; PRAISE: boolean } = { PRAYING: false, AMEN: false, PRAISE: false };
    for (const r of p.reactions) {
      counts[r.type as keyof typeof counts]++;
      if (user && r.userId === user.id) mine[r.type as keyof typeof mine] = true;
    }
    return {
      id: p.id,
      content: p.content,
      isAnonymous: p.isAnonymous,
      status: p.status,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
      author: p.isAnonymous ? { id: null, name: "Anonymous Member" } : { id: p.author.id, name: p.author.name },
      isAuthor: user ? p.authorId === user.id : false,
      reactionCounts: counts,
      myReactions: mine,
      comments: p.comments.map((c) => ({
        id: c.id,
        content: c.content,
        createdAt: c.createdAt.toISOString(),
        author: { id: c.author.id, name: c.author.name },
      })),
    };
  });

  return { prayers: items, total, page, pageSize: PAGE_SIZE, user };
}

export default async function PraisePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const { prayers, total, pageSize, user } = await getAnsweredPrayers(page);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div>
      <div className="flex items-start gap-4 mb-6 p-4 rounded-2xl bg-amber-50/50 border border-amber-100 shadow-sm">
        <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-6 h-6 text-amber-600" aria-hidden />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 mb-1">Praise Wall</h1>
          <p className="text-slate-600 text-sm">
            Celebrating answered prayers and praise reports. Rejoice with your community as prayers are answered.
          </p>
        </div>
      </div>

      <section aria-label="Praise reports">
        {prayers.length === 0 ? (
          <div className="bg-amber-50/50 rounded-2xl shadow-sm p-12 text-center border border-amber-100">
            <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-7 h-7 text-amber-600" aria-hidden />
            </div>
            <h2 className="text-lg font-medium text-slate-900 mb-1">No praise reports yet</h2>
            <p className="text-slate-600 text-sm mb-2">
              When prayers are marked as answered on the Prayer Wall, they will appear here.
            </p>
            <Link
              href="/prayers"
              className="text-amber-600 hover:text-amber-700 font-medium text-sm"
            >
              View Prayer Wall →
            </Link>
          </div>
        ) : (
          <>
            {prayers.map((prayer) => (
              <PrayerCard key={prayer.id} prayer={prayer} variant="praise" canReact={!!user} />
            ))}

            {totalPages > 1 && (
              <nav className="flex justify-center gap-2 mt-8" aria-label="Pagination">
                {page > 1 && (
                  <Link
                    href={`/praise?page=${page - 1}`}
                    className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700"
                  >
                    Previous
                  </Link>
                )}
                <span className="px-4 py-2 text-slate-600">
                  Page {page} of {totalPages}
                </span>
                {page < totalPages && (
                  <Link
                    href={`/praise?page=${page + 1}`}
                    className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700"
                  >
                    Next
                  </Link>
                )}
              </nav>
            )}
          </>
        )}
      </section>
    </div>
  );
}
