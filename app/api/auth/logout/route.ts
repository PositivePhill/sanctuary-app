import { NextResponse } from "next/server";
import { deleteSession, clearSessionCookie } from "@/lib/auth";
import { validateCsrf } from "@/lib/csrf";

function parseCookie(header: string | null, name: string): string | null {
  if (!header) return null;
  const parts = header.split(";").map((p) => p.trim());
  for (const part of parts) {
    const [key, val] = part.split("=");
    if (key === name && val) return val;
  }
  return null;
}

export async function POST(request: Request) {
  if (!validateCsrf(request)) {
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
  }

  const cookieHeader = request.headers.get("cookie");
  const token = parseCookie(cookieHeader, "session_token");
  if (token) {
    await deleteSession(token);
  }

  const res = NextResponse.json({ ok: true });
  res.headers.set("Set-Cookie", clearSessionCookie());
  return res;
}
