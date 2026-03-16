import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getSessionFromRequest, requireAdmin } from "@/lib/auth";
import { validateCsrf } from "@/lib/csrf";
import { updateEventSchema } from "@/lib/validations/event";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getSessionFromRequest(request);

  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      rsvps: user ? { where: { userId: user.id } } : false,
    },
  });

  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: event.id,
    title: event.title,
    description: event.description,
    eventDate: event.eventDate,
    location: event.location,
    createdAt: event.createdAt,
    hasRsvpd: user && event.rsvps && Array.isArray(event.rsvps) ? event.rsvps.length > 0 : false,
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

  const { id } = await params;

  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const body = await request.json();
  const parsed = updateEventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const data: { title?: string; description?: string; eventDate?: Date; location?: string } = {};
  if (parsed.data.title != null) data.title = parsed.data.title;
  if (parsed.data.description != null) data.description = parsed.data.description;
  if (parsed.data.eventDate != null) data.eventDate = new Date(parsed.data.eventDate);
  if (parsed.data.location != null) data.location = parsed.data.location;

  await prisma.event.update({ where: { id }, data });

  try {
    revalidatePath("/events");
    revalidatePath("/dashboard");
  } catch {
    // revalidatePath may throw outside request context (e.g. tests)
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

  const { id } = await params;

  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  await prisma.event.delete({ where: { id } });

  try {
    revalidatePath("/events");
    revalidatePath("/dashboard");
  } catch {
    // revalidatePath may throw outside request context (e.g. tests)
  }

  return NextResponse.json({ ok: true });
}
