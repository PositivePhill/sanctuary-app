import { NextResponse } from "next/server";
import { createCsrfToken } from "@/lib/csrf";

export async function GET() {
  const { token, cookie } = createCsrfToken();
  const res = NextResponse.json({ token });
  res.headers.set("Set-Cookie", cookie);
  return res;
}
