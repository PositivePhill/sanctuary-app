/**
 * Auth utilities — session, role checks, password hashing.
 * All auth logic runs in Node.js runtime only.
 * Session tokens: cookie stores raw token; DB stores SHA-256 hash only.
 */

import * as bcrypt from "bcryptjs";
import { createHash } from "crypto";
import { prisma } from "./db";

const SALT_ROUNDS = 12;
const SESSION_COOKIE = "session_token";
const SESSION_DAYS = 7;

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarStyle?: string | null;
};

function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

function generateToken(): string {
  const bytes = new Uint8Array(32);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    require("crypto").randomFillSync(bytes);
  }
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function createSession(userId: string): Promise<string> {
  const token = generateToken();
  const tokenHash = hashSessionToken(token);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_DAYS);

  await prisma.session.deleteMany({ where: { userId } });
  await prisma.session.create({
    data: { userId, token: tokenHash, expiresAt },
  });
  return token;
}

export async function getSession(
  cookieHeader: string | null
): Promise<SessionUser | null> {
  if (!cookieHeader) return null;
  const token = parseCookie(cookieHeader, SESSION_COOKIE);
  return getSessionByToken(token);
}

export async function getSessionByToken(
  token: string | null | undefined
): Promise<SessionUser | null> {
  if (!token || token.length === 0) return null;

  const tokenHash = hashSessionToken(token);
  const session = await prisma.session.findUnique({
    where: { token: tokenHash },
    include: { user: true },
  });
  if (!session || session.expiresAt < new Date()) return null;

  return {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    role: session.user.role,
    avatarStyle: session.user.avatarStyle ?? null,
  };
}

export async function deleteSession(token: string): Promise<void> {
  const tokenHash = hashSessionToken(token);
  await prisma.session.deleteMany({ where: { token: tokenHash } });
}

export function setSessionCookie(token: string): string {
  const expires = new Date();
  expires.setDate(expires.getDate() + SESSION_DAYS);
  const secure = process.env.NODE_ENV === "production";
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_DAYS * 86400}${secure ? "; Secure" : ""}`;
}

export function clearSessionCookie(): string {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

function parseCookie(header: string, name: string): string | null {
  const parts = header.split(";").map((p) => p.trim());
  for (const part of parts) {
    const [key, val] = part.split("=");
    if (key === name && val) return val;
  }
  return null;
}

export async function getSessionFromRequest(request: Request): Promise<SessionUser | null> {
  const cookieHeader = request.headers.get("cookie");
  return getSession(cookieHeader);
}

export async function requireAuth(request: Request): Promise<SessionUser> {
  const user = await getSessionFromRequest(request);
  if (!user) {
    throw new AuthError("Unauthorized", 401);
  }
  return user;
}

export async function requireAdmin(request: Request): Promise<SessionUser> {
  const user = await requireAuth(request);
  if (user.role !== "ADMIN") {
    throw new AuthError("Forbidden", 403);
  }
  return user;
}

export class AuthError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
    this.name = "AuthError";
  }
}
