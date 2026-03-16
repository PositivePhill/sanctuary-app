/**
 * CSRF — double-submit cookie.
 * Required for POST, PUT, PATCH, DELETE routes.
 */

function generateToken(): string {
  const bytes = new Uint8Array(32);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    require("crypto").randomFillSync(bytes);
  }
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

const CSRF_COOKIE = "csrf_token";

function parseCookie(header: string | null, name: string): string | null {
  if (!header) return null;
  const parts = header.split(";").map((p) => p.trim());
  for (const part of parts) {
    const [key, val] = part.split("=");
    if (key === name && val) return val;
  }
  return null;
}

export function createCsrfToken(): { token: string; cookie: string } {
  const token = generateToken();
  const cookie = `${CSRF_COOKIE}=${token}; Path=/; SameSite=Lax; Max-Age=3600`;
  return { token, cookie };
}

export function validateCsrf(request: Request): boolean {
  const cookieToken = parseCookie(request.headers.get("cookie"), CSRF_COOKIE);
  const headerToken = request.headers.get("x-csrf-token");
  if (!cookieToken || !headerToken) return false;
  return cookieToken === headerToken && cookieToken.length > 0;
}
