/**
 * Rate limiting — in-memory, keyed by IP + user-agent.
 * Fallback: "unknown" if no x-forwarded-for or x-real-ip (never use host).
 * 5 requests per 10 minutes for login/signup.
 *
 * Production: Replace in-memory store with shared backing (e.g. Redis).
 * See ARCHITECTURE.md and README.md deployment section.
 */

const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS = 5;

const store = new Map<string, { count: number; resetAt: number }>();

function getClientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const ip = (forwarded?.split(",")[0]?.trim() || realIp?.trim() || null);
  const userAgent = request.headers.get("user-agent") ?? "";
  const ipPart = ip ?? "unknown";
  return `${ipPart}:${userAgent}`;
}

export function checkRateLimit(request: Request): boolean {
  const key = getClientKey(request);
  const now = Date.now();
  const entry = store.get(key);

  if (!entry) {
    store.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }

  if (now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }

  if (entry.count >= MAX_REQUESTS) return false;
  entry.count++;
  return true;
}
