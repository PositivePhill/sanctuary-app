import { describe, it, expect } from "vitest";
import { prisma } from "@/lib/db";

describe("Prisma client", () => {
  it("connects and can query users", async () => {
    const users = await prisma.user.findMany();
    expect(Array.isArray(users)).toBe(true);
  });
});
