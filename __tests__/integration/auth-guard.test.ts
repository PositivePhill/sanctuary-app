import { describe, it, expect } from "vitest";
import { getSessionByToken } from "@/lib/auth";

/**
 * Auth guard behavior: when no session exists, getSessionByToken returns null.
 * The (app) layout uses this and redirects to /login when null.
 * Full redirect behavior requires E2E (Playwright/Cypress).
 */
describe("auth guard", () => {
  it("getSessionByToken returns null when no token - layout would redirect to login", async () => {
    const user = await getSessionByToken(undefined);
    expect(user).toBeNull();
  });

  it("getSessionByToken returns null for invalid/unknown token (hashed lookup)", async () => {
    const user = await getSessionByToken("invalid-token-not-in-db");
    expect(user).toBeNull();
  });
});
