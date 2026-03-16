import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";
import { validateCsrf } from "@/lib/csrf";
import { updatePrayerSchema } from "@/lib/validations/prayer";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getSessionFromRequest(request);

  const prayer = await prisma.prayerRequest.findUnique({
    where: { id },
    include: {
      author: { select: { id: true, name: true } },
      comments: { include: { author: { select: { id: true, name: true } } }, orderBy: { createdAt: "asc" } },
    },
  });

  if (!prayer) {
    return NextResponse.json({ error: "Prayer not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: prayer.id,
    content: prayer.content,
    isAnonymous: prayer.isAnonymous,
    status: prayer.status,
    createdAt: prayer.createdAt,
    updatedAt: prayer.updatedAt,
    author: prayer.isAnonymous ? { id: null, name: "Anonymous Member" } : { id: prayer.author.id, name: prayer.author.name },
    isAuthor: user ? prayer.authorId === user.id : false,
    comments: prayer.comments.map((c) => ({
      id: c.id,
      content: c.content,
      createdAt: c.createdAt,
      author: { id: c.author.id, name: c.author.name },
    })),
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!validateCsrf(request)) {
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
  }

  const { id } = await params;

  const prayer = await prisma.prayerRequest.findUnique({ where: { id } });
  if (!prayer) {
    return NextResponse.json({ error: "Prayer not found" }, { status: 404 });
  }
  if (prayer.authorId !== user.id) {
    return NextResponse.json({ error: "Forbidden: you can only modify your own prayers" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = updatePrayerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const updated = await prisma.prayerRequest.update({
    where: { id },
    data: parsed.data,
  });

  try {
    revalidatePath("/prayers");
    revalidatePath("/praise");
    revalidatePath("/dashboard");
  } catch {
    // revalidatePath may throw outside request context (e.g. tests)
  }

  return NextResponse.json({
    id: updated.id,
    content: updated.content,
    isAnonymous: updated.isAnonymous,
    status: updated.status,
    updatedAt: updated.updatedAt,
  });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!validateCsrf(request)) {
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
  }

  const { id } = await params;

  const prayer = await prisma.prayerRequest.findUnique({ where: { id } });
  if (!prayer) {
    return NextResponse.json({ error: "Prayer not found" }, { status: 404 });
  }
  if (prayer.authorId !== user.id) {
    return NextResponse.json({ error: "Forbidden: you can only delete your own prayers" }, { status: 403 });
  }

  await prisma.prayerRequest.delete({ where: { id } });

  try {
    revalidatePath("/prayers");
    revalidatePath("/praise");
    revalidatePath("/dashboard");
  } catch {
    // revalidatePath may throw outside request context (e.g. tests)
  }

  return NextResponse.json({ ok: true });
}
