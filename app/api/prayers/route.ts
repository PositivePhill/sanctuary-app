import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";
import { validateCsrf } from "@/lib/csrf";
import { createPrayerSchema } from "@/lib/validations/prayer";

const PAGE_SIZE = 20;

export async function GET(request: NextRequest) {
  const user = await getSessionFromRequest(request);
  const url = new URL(request.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10) || 1);
  const skip = (page - 1) * PAGE_SIZE;

  const [prayers, total] = await Promise.all([
    prisma.prayerRequest.findMany({
      skip,
      take: PAGE_SIZE,
      orderBy: { createdAt: "desc" },
      include: {
        author: { select: { id: true, name: true } },
        comments: { include: { author: { select: { id: true, name: true } } }, orderBy: { createdAt: "asc" } },
      },
    }),
    prisma.prayerRequest.count(),
  ]);

  const items = prayers.map((p) => ({
    id: p.id,
    content: p.content,
    isAnonymous: p.isAnonymous,
    status: p.status,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    author: p.isAnonymous ? { id: null, name: "Anonymous Member" } : { id: p.author.id, name: p.author.name },
    isAuthor: user ? p.authorId === user.id : false,
    comments: p.comments.map((c) => ({
      id: c.id,
      content: c.content,
      createdAt: c.createdAt,
      author: { id: c.author.id, name: c.author.name },
    })),
  }));

  return NextResponse.json({ prayers: items, total, page, pageSize: PAGE_SIZE });
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
  const parsed = createPrayerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const prayer = await prisma.prayerRequest.create({
    data: {
      authorId: user.id,
      content: parsed.data.content,
      isAnonymous: parsed.data.isAnonymous ?? false,
    },
  });

  try {
    revalidatePath("/prayers");
    revalidatePath("/dashboard");
  } catch {
    // revalidatePath may throw outside request context (e.g. tests)
  }

  return NextResponse.json(
    {
      id: prayer.id,
      content: prayer.content,
      isAnonymous: prayer.isAnonymous,
      status: prayer.status,
      createdAt: prayer.createdAt,
      author: prayer.isAnonymous ? { name: "Anonymous Member" } : { id: user.id, name: user.name },
    },
    { status: 201 }
  );
}
