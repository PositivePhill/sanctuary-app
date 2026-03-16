import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";
import { validateCsrf } from "@/lib/csrf";
import { toggleReactionSchema } from "@/lib/validations/reaction";

export async function POST(
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

  const { id: prayerRequestId } = await params;
  const body = await request.json();
  const parsed = toggleReactionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid reaction type" },
      { status: 400 }
    );
  }

  const prayer = await prisma.prayerRequest.findUnique({
    where: { id: prayerRequestId },
  });
  if (!prayer) {
    return NextResponse.json({ error: "Prayer not found" }, { status: 404 });
  }

  const { type } = parsed.data;
  const existing = await prisma.prayerReaction.findUnique({
    where: {
      prayerRequestId_userId_type: {
        prayerRequestId,
        userId: user.id,
        type,
      },
    },
  });

  if (existing) {
    await prisma.prayerReaction.delete({
      where: { id: existing.id },
    });
  } else {
    await prisma.prayerReaction.create({
      data: {
        prayerRequestId,
        userId: user.id,
        type,
      },
    });
  }

  try {
    revalidatePath("/prayers");
    revalidatePath("/praise");
    revalidatePath("/dashboard");
  } catch {}

  return NextResponse.json({ ok: true });
}
