import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getSessionFromRequest, requireAdmin } from "@/lib/auth";
import { validateCsrf } from "@/lib/csrf";
import { createDevotionalSchema } from "@/lib/validations/devotional";

export async function GET(request: Request) {
  const user = await getSessionFromRequest(request);
  const now = new Date();

  const devotionals = await prisma.devotional.findMany({
    where:
      user?.role === "ADMIN"
        ? undefined
        : { publishDate: { lte: now } },
    orderBy: { publishDate: "desc" },
    include: { author: { select: { name: true } } },
  });

  return NextResponse.json({
    devotionals: devotionals.map((d) => ({
      id: d.id,
      title: d.title,
      scriptureReference: d.scriptureReference,
      publishDate: d.publishDate,
      author: d.author.name,
    })),
  });
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
  const parsed = createDevotionalSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const user = await getSessionFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const publishDate = new Date(parsed.data.publishDate);
  const devotional = await prisma.devotional.create({
    data: {
      authorId: user.id,
      title: parsed.data.title,
      scriptureReference: parsed.data.scriptureReference,
      content: parsed.data.content,
      publishDate,
    },
  });

  try {
    revalidatePath("/devotionals");
    revalidatePath("/dashboard");
  } catch {
    // revalidatePath may throw outside request context (e.g. tests)
  }

  return NextResponse.json(
    {
      id: devotional.id,
      title: devotional.title,
      scriptureReference: devotional.scriptureReference,
      publishDate: devotional.publishDate,
    },
    { status: 201 }
  );
}
