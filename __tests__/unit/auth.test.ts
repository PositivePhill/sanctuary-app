import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword, createSession, getSessionByToken, deleteSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

describe("auth utilities", () => {
  it("hashes and verifies password", async () => {
    const password = "testpassword123";
    const hash = await hashPassword(password);
    expect(hash).not.toBe(password);
    expect(await verifyPassword(password, hash)).toBe(true);
    expect(await verifyPassword("wrong", hash)).toBe(false);
  });

  it("hashed session: createSession stores hash, getSessionByToken finds by raw token", async () => {
    const user = await prisma.user.findFirst({ where: { role: "MEMBER" } });
    if (!user) throw new Error("No member in seed");
    const token = await createSession(user.id);
    expect(token).toBeTruthy();
    expect(token.length).toBeGreaterThan(10);
    const sessionUser = await getSessionByToken(token);
    expect(sessionUser).toBeDefined();
    expect(sessionUser?.email).toBe(user.email);
    await deleteSession(token);
    const afterDelete = await getSessionByToken(token);
    expect(afterDelete).toBeNull();
  });
});
