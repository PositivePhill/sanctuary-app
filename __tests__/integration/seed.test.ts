import { describe, it, expect } from "vitest";
import { prisma } from "@/lib/db";

describe("seed integration", () => {
  // Seed runs via npm test script before all tests

  it("creates expected user count (1 admin + 2 members)", async () => {
    const users = await prisma.user.findMany();
    expect(users.length).toBe(3);
    const adminCount = users.filter((u) => u.role === "ADMIN").length;
    expect(adminCount).toBe(1);
  });

  it("creates 3 prayer requests including 1 anonymous", async () => {
    const prayers = await prisma.prayerRequest.findMany();
    expect(prayers.length).toBe(3);
    const anonymousCount = prayers.filter((p) => p.isAnonymous).length;
    expect(anonymousCount).toBe(1);
  });

  it("creates 2 devotionals and 2 events", async () => {
    const devotionals = await prisma.devotional.findMany();
    const events = await prisma.event.findMany();
    expect(devotionals.length).toBe(2);
    expect(events.length).toBe(2);
  });

  it("creates sample RSVPs", async () => {
    const rsvps = await prisma.rSVP.findMany();
    expect(rsvps.length).toBeGreaterThanOrEqual(1);
  });
});
