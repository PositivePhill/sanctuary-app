import Link from "next/link";
import { Heart, Calendar, BookOpen, User, BookMarked } from "lucide-react";
import { prisma } from "@/lib/db";
import { getSessionByToken } from "@/lib/auth";
import { cookies } from "next/headers";
import scripturesData from "@/data/scriptures.json";

function getScriptureOfTheDay() {
  const scriptures = scripturesData as Array<{ verse: string; reference: string; theme?: string }>;
  if (scriptures.length === 0) return null;
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((now.getTime() - startOfYear.getTime()) / 86400000);
  return scriptures[dayOfYear % scriptures.length];
}

export default async function DashboardPage() {
  const now = new Date();
  const cookieStore = await cookies();
  const token = cookieStore.get("session_token")?.value;
  const user = await getSessionByToken(token);

  const scripture = getScriptureOfTheDay();

  const [recentPrayers, upcomingEvents, recentDevotionals, activePrayersCount, upcomingEventsCount, publishedDevotionalsCount] = await Promise.all([
    prisma.prayerRequest.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { author: { select: { name: true } } },
    }),
    prisma.event.findMany({
      where: { eventDate: { gte: now } },
      take: 3,
      orderBy: { eventDate: "asc" },
    }),
    prisma.devotional.findMany({
      where: { publishDate: { lte: now } },
      take: 3,
      orderBy: { publishDate: "desc" },
      include: { author: { select: { name: true } } },
    }),
    prisma.prayerRequest.count({ where: { status: "ACTIVE" } }),
    prisma.event.count({ where: { eventDate: { gte: now } } }),
    prisma.devotional.count({ where: { publishDate: { lte: now } } }),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900 mb-6">Dashboard</h1>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
            <Heart className="w-5 h-5 text-amber-600" aria-hidden />
          </div>
          <div>
            <p className="text-2xl font-semibold text-slate-900">{activePrayersCount}</p>
            <p className="text-xs text-slate-500">Active Prayers</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-amber-600" aria-hidden />
          </div>
          <div>
            <p className="text-2xl font-semibold text-slate-900">{upcomingEventsCount}</p>
            <p className="text-xs text-slate-500">Upcoming Events</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-amber-600" aria-hidden />
          </div>
          <div>
            <p className="text-2xl font-semibold text-slate-900">{publishedDevotionalsCount}</p>
            <p className="text-xs text-slate-500">Published Devotionals</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
            <User className="w-5 h-5 text-amber-600" aria-hidden />
          </div>
          <div>
            <p className="text-lg font-semibold text-slate-900">{user?.role ?? "—"}</p>
            <p className="text-xs text-slate-500">Your Role</p>
          </div>
        </div>
      </div>

      {scripture && (
        <div className="mb-8 bg-gradient-to-b from-amber-50/80 to-white rounded-2xl shadow-sm p-6 border border-amber-100/80">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
              <BookMarked className="w-5 h-5 text-amber-700" aria-hidden />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold text-slate-900">Scripture of the Day</h2>
              <p className="text-xs text-slate-500 mt-0.5">A moment of encouragement for today</p>
              <blockquote className="mt-4 text-slate-700 text-base leading-relaxed">
                &ldquo;{scripture.verse}&rdquo;
              </blockquote>
              <cite className="mt-3 block text-sm text-amber-700 not-italic font-medium">
                — {scripture.reference}
              </cite>
              {scripture.theme && (
                <span
                  className="mt-3 inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800"
                  aria-label={`Theme: ${scripture.theme}`}
                >
                  {scripture.theme}
                </span>
              )}
            </div>
          </div>
          <p className="mt-4 text-xs text-slate-500">Refresh the page for a new day&apos;s scripture.</p>
        </div>
      )}

      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-slate-800">Recent Prayers</h2>
          <Link
            href="/prayers"
            className="text-amber-600 hover:text-amber-700 font-medium text-sm"
          >
            View all →
          </Link>
        </div>
        {recentPrayers.length === 0 ? (
          <p className="text-slate-600 text-sm">No prayers yet.</p>
        ) : (
          <ul className="space-y-3">
            {recentPrayers.map((p) => (
              <li key={p.id} className="bg-white rounded-xl shadow-sm p-4">
                <p className="text-slate-700 text-sm line-clamp-2">{p.content}</p>
                <p className="text-xs text-slate-500 mt-2">
                  {p.isAnonymous ? "Anonymous Member" : p.author.name} · {p.status}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-slate-800">Upcoming Events</h2>
          <Link
            href="/events"
            className="text-amber-600 hover:text-amber-700 font-medium text-sm"
          >
            View all →
          </Link>
        </div>
        {upcomingEvents.length === 0 ? (
          <p className="text-slate-600 text-sm">No upcoming events.</p>
        ) : (
          <ul className="space-y-3">
            {upcomingEvents.map((e) => (
              <li key={e.id}>
                <Link
                  href="/events"
                  className="block bg-white rounded-xl shadow-sm p-4 hover:shadow-md"
                >
                  <p className="text-slate-800 font-medium text-sm">{e.title}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {e.eventDate.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })} · {e.location}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-slate-800">Recent Devotionals</h2>
          <Link
            href="/devotionals"
            className="text-amber-600 hover:text-amber-700 font-medium text-sm"
          >
            View all →
          </Link>
        </div>
        {recentDevotionals.length === 0 ? (
          <p className="text-slate-600 text-sm">No devotionals yet.</p>
        ) : (
          <ul className="space-y-3">
            {recentDevotionals.map((d) => (
              <li key={d.id}>
                <Link
                  href={`/devotionals/${d.id}`}
                  className="block bg-white rounded-xl shadow-sm p-4 hover:shadow-md"
                >
                  <p className="text-slate-800 font-medium text-sm">{d.title}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {d.author.name} · {d.publishDate.toLocaleDateString(undefined, { dateStyle: "medium" })}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
