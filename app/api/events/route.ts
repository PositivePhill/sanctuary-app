import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getSessionFromRequest, requireAdmin } from "@/lib/auth";
import { validateCsrf } from "@/lib/csrf";
import { createEventSchema } from "@/lib/validations/event";

export async function GET(request: Request) {
  const user = await getSessionFromRequest(request);

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
    createdAt: e.createdAt,
    hasRsvpd: user && e.rsvps && Array.isArray(e.rsvps) ? e.rsvps.length > 0 : false,
  }));

  return NextResponse.json({ events: items });
}

export async function POST(request: Request) {
  try {
    await requireAdmin(request);
  } catch (e: unknown) {
    const err = e as { status?: number };
    return NextResponse.json(
      { error: err.status === 401 ? "Unauthorized" : "Forbidden" },
      { status: err.status ?? 403 }
    );
  }
  if (!validateCsrf(request)) {
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = createEventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const event = await prisma.event.create({
    data: {
      title: parsed.data.title,
      description: parsed.data.description ?? "",
      eventDate: new Date(parsed.data.eventDate),
      location: parsed.data.location,
    },
  });

  try {
    revalidatePath("/events");
    revalidatePath("/dashboard");
  } catch {
    // revalidatePath may throw outside request context (e.g. tests)
  }

  return NextResponse.json(
    {
      id: event.id,
      title: event.title,
      description: event.description,
      eventDate: event.eventDate,
      location: event.location,
    },
    { status: 201 }
  );
}
