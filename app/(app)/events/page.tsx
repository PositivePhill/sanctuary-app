import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { getSessionByToken } from "@/lib/auth";
import { RsvpButton } from "@/components/RsvpButton";
import { Calendar, MapPin } from "lucide-react";

export default async function EventsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session_token")?.value;
  const user = await getSessionByToken(token);

  const events = await prisma.event.findMany({
    orderBy: { eventDate: "asc" },
    include: {
      rsvps: user ? { where: { userId: user.id } } : false,
    },
  });

  const items = events.map((e) => ({
    id: e.id,
    title: e.title,
    description: e.description,
    eventDate: e.eventDate,
    location: e.location,
    hasRsvpd: user && e.rsvps && Array.isArray(e.rsvps) ? e.rsvps.length > 0 : false,
  }));

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900 mb-6">Events</h1>

      {items.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
          <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-7 h-7 text-amber-600" aria-hidden />
          </div>
          <h2 className="text-lg font-medium text-slate-900 mb-1">No events yet</h2>
          <p className="text-slate-600 text-sm">Check back soon for upcoming events.</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2" role="list">
          {items.map((event) => (
            <article
              key={event.id}
              className="bg-white rounded-2xl shadow-md p-6 flex flex-col"
              role="listitem"
            >
              <h2 className="text-lg font-semibold text-slate-900">{event.title}</h2>
              {event.description && (
                <p className="text-slate-600 text-sm mt-2 line-clamp-3">{event.description}</p>
              )}
              <div className="mt-4 flex items-center gap-4 text-sm text-slate-500">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" aria-hidden />
                  {new Date(event.eventDate).toLocaleString(undefined, {
                    dateStyle: "long",
                    timeStyle: "short",
                  })}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" aria-hidden />
                  {event.location}
                </span>
              </div>
              {user && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <RsvpButton eventId={event.id} hasRsvpd={event.hasRsvpd} />
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
