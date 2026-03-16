import { describe, it, expect } from "vitest";
import { prisma } from "@/lib/db";
import { GET as getCsrf } from "@/app/api/csrf/route";
import { POST as toggleReaction } from "@/app/api/prayers/[id]/reactions/route";

function getCookie(setCookie: string | null): string {
  if (!setCookie) return "";
  return setCookie.split(";")[0] ?? "";
}

async function getCsrfHeaders() {
  const csrfRes = await getCsrf();
  const { token } = await csrfRes.json();
  const cookie = getCookie(csrfRes.headers.get("set-cookie"));
  return { token, cookie };
}

async function loginAs(email: string) {
  const { POST } = await import("@/app/api/auth/login/route");
  const { token, cookie } = await getCsrfHeaders();
  const res = await POST(
    new Request("http://localhost/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-csrf-token": token,
        Cookie: cookie,
      },
      body: JSON.stringify({ email, password: "demo123" }),
    })
  );
  const sessionCookie = res.headers.get("set-cookie") ?? "";
  return { sessionCookie: getCookie(sessionCookie), token, cookie };
}

describe("prayer reactions", () => {
  it("unauthenticated user cannot react", async () => {
    const prayer = await prisma.prayerRequest.findFirst();
    if (!prayer) return;
    const { token, cookie } = await getCsrfHeaders();
    const res = await toggleReaction(
      new Request("http://localhost/api/prayers/" + prayer.id + "/reactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": token,
          Cookie: cookie,
        },
        body: JSON.stringify({ type: "PRAYING" }),
      }),
      { params: Promise.resolve({ id: prayer.id }) }
    );
    expect(res.status).toBe(401);
  });

  it("authenticated user can add and remove reaction", async () => {
    const prayer = await prisma.prayerRequest.findFirst();
    if (!prayer) return;
    const { sessionCookie, token, cookie } = await loginAs("alice@sanctuary.demo");
    const headers = {
      "Content-Type": "application/json",
      "x-csrf-token": token,
      Cookie: `${cookie}; ${sessionCookie}`,
    };

    const addRes = await toggleReaction(
      new Request("http://localhost/api/prayers/" + prayer.id + "/reactions", {
        method: "POST",
        headers,
        body: JSON.stringify({ type: "AMEN" }),
      }),
      { params: Promise.resolve({ id: prayer.id }) }
    );
    expect(addRes.status).toBe(200);
    const afterAdd = await prisma.prayerReaction.findFirst({
      where: { prayerRequestId: prayer.id, type: "AMEN" },
    });
    expect(afterAdd).toBeDefined();

    const removeRes = await toggleReaction(
      new Request("http://localhost/api/prayers/" + prayer.id + "/reactions", {
        method: "POST",
        headers,
        body: JSON.stringify({ type: "AMEN" }),
      }),
      { params: Promise.resolve({ id: prayer.id }) }
    );
    expect(removeRes.status).toBe(200);
    const afterRemove = await prisma.prayerReaction.findFirst({
      where: { prayerRequestId: prayer.id, type: "AMEN" },
    });
    expect(afterRemove).toBeNull();
  });

  it("invalid reaction type rejected", async () => {
    const prayer = await prisma.prayerRequest.findFirst();
    if (!prayer) return;
    const { sessionCookie, token, cookie } = await loginAs("alice@sanctuary.demo");
    const res = await toggleReaction(
      new Request("http://localhost/api/prayers/" + prayer.id + "/reactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": token,
          Cookie: `${cookie}; ${sessionCookie}`,
        },
        body: JSON.stringify({ type: "INVALID" }),
      }),
      { params: Promise.resolve({ id: prayer.id }) }
    );
    expect(res.status).toBe(400);
  });
});
