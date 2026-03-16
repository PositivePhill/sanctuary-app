import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getSessionFromRequest, requireAdmin } from "@/lib/auth";
import { validateCsrf } from "@/lib/csrf";
import { updateDevotionalSchema } from "@/lib/validations/devotional";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getSessionFromRequest(request);

  const devotional = await prisma.devotional.findUnique({
    where: { id },
    include: { author: { select: { name: true } } },
  });

  if (!devotional) {
    return NextResponse.json({ error: "Devotional not found" }, { status: 404 });
  }

  const now = new Date();
  const isPublished = devotional.publishDate <= now;
  const isAdmin = user?.role === "ADMIN";

  if (!isPublished && !isAdmin) {
    return NextResponse.json({ error: "Devotional not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: devotional.id,
    title: devotional.title,
    scriptureReference: devotional.scriptureReference,
    content: devotional.content,
    publishDate: devotional.publishDate,
    author: devotional.author.name,
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

  const devotional = await prisma.devotional.findUnique({ where: { id } });
  if (!devotional) {
    return NextResponse.json({ error: "Devotional not found" }, { status: 404 });
  }

  const body = await request.json();
  const parsed = updateDevotionalSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const data: { title?: string; scriptureReference?: string; content?: string; publishDate?: Date } = {};
  if (parsed.data.title != null) data.title = parsed.data.title;
  if (parsed.data.scriptureReference != null) data.scriptureReference = parsed.data.scriptureReference;
  if (parsed.data.content != null) data.content = parsed.data.content;
  if (parsed.data.publishDate != null) data.publishDate = new Date(parsed.data.publishDate);

  await prisma.devotional.update({ where: { id }, data });

  try {
    revalidatePath("/devotionals");
    revalidatePath(`/devotionals/${id}`);
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

  const devotional = await prisma.devotional.findUnique({ where: { id } });
  if (!devotional) {
    return NextResponse.json({ error: "Devotional not found" }, { status: 404 });
  }

  await prisma.devotional.delete({ where: { id } });

  try {
    revalidatePath("/devotionals");
    revalidatePath("/dashboard");
  } catch {
    // revalidatePath may throw outside request context (e.g. tests)
  }

  return NextResponse.json({ ok: true });
}
