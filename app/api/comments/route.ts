import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";
import { validateCsrf } from "@/lib/csrf";
import { createCommentSchema } from "@/lib/validations/prayer";

export async function GET(request: NextRequest) {
  const prayerRequestId = request.nextUrl.searchParams.get("prayerRequestId");
  if (!prayerRequestId) {
    return NextResponse.json({ error: "prayerRequestId required" }, { status: 400 });
  }

  const comments = await prisma.comment.findMany({
    where: { prayerRequestId },
    orderBy: { createdAt: "asc" },
    include: { author: { select: { id: true, name: true } } },
  });

  return NextResponse.json({
    comments: comments.map((c) => ({
      id: c.id,
      content: c.content,
      createdAt: c.createdAt,
      author: { id: c.author.id, name: c.author.name },
    })),
  });
}

export async function POST(request: Request) {
  const user = await getSessionFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!validateCsrf(request)) {
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = createCommentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const prayer = await prisma.prayerRequest.findUnique({
    where: { id: parsed.data.prayerRequestId },
  });
  if (!prayer) {
    return NextResponse.json({ error: "Prayer not found" }, { status: 404 });
  }

  const comment = await prisma.comment.create({
    data: {
      prayerRequestId: parsed.data.prayerRequestId,
      authorId: user.id,
      content: parsed.data.content,
    },
    include: { author: { select: { id: true, name: true } } },
  });

  try {
    revalidatePath("/prayers");
    revalidatePath("/dashboard");
  } catch {
    // revalidatePath may throw outside request context (e.g. tests)
  }

  return NextResponse.json(
    {
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt,
      author: { id: comment.author.id, name: comment.author.name },
    },
    { status: 201 }
  );
}
