import { describe, it, expect } from "vitest";
import { prisma } from "@/lib/db";
import { GET as getCsrf } from "@/app/api/csrf/route";
import { GET as getPrayers, POST as postPrayer } from "@/app/api/prayers/route";
import { PATCH as patchPrayer } from "@/app/api/prayers/[id]/route";

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

describe("prayer wall integration", () => {
  // Seed runs via npm test script before all tests

  it("anonymous prayer hides author name", async () => {
    const res = await getPrayers(new Request("http://localhost/api/prayers?page=1"));
    const data = await res.json();
    const anonymousPrayer = data.prayers.find((p: { isAnonymous: boolean }) => p.isAnonymous);
    expect(anonymousPrayer).toBeDefined();
    expect(anonymousPrayer.author.name).toBe("Anonymous Member");
    expect(anonymousPrayer.author.id).toBeNull();
  });

  it("invalid payload rejected with 400", async () => {
    const { sessionCookie, token, cookie } = await loginAs("alice@sanctuary.demo");
    const res = await postPrayer(
      new Request("http://localhost/api/prayers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": token,
          Cookie: `${cookie}; ${sessionCookie}`,
        },
        body: JSON.stringify({ content: "", isAnonymous: false }),
      })
    );
    expect(res.status).toBe(400);
  });

  it("member cannot modify another member's prayer", async () => {
    const alice = await prisma.user.findUnique({ where: { email: "alice@sanctuary.demo" } });
    if (!alice) throw new Error("Alice not found");
    const prayerByAlice = await prisma.prayerRequest.findFirst({ where: { authorId: alice.id } });
    if (!prayerByAlice) return;
    const { sessionCookie, token, cookie } = await loginAs("bob@sanctuary.demo");
    const res = await patchPrayer(
      new Request("http://localhost/api/prayers/" + prayerByAlice.id, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": token,
          Cookie: `${cookie}; ${sessionCookie}`,
        },
        body: JSON.stringify({ status: "ANSWERED" }),
      }),
      { params: Promise.resolve({ id: prayerByAlice.id }) }
    );
    expect(res.status).toBe(403);
  });

  it("answered status change only allowed by author", async () => {
    const alice = await prisma.user.findUnique({ where: { email: "alice@sanctuary.demo" } });
    if (!alice) throw new Error("Alice not found");
    const prayer = await prisma.prayerRequest.findFirst({ where: { authorId: alice.id, status: "ACTIVE" } });
    if (!prayer) return;
    const { sessionCookie, token, cookie } = await loginAs("alice@sanctuary.demo");
    const res = await patchPrayer(
      new Request("http://localhost/api/prayers/" + prayer.id, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": token,
          Cookie: `${cookie}; ${sessionCookie}`,
        },
        body: JSON.stringify({ status: "ANSWERED" }),
      }),
      { params: Promise.resolve({ id: prayer.id }) }
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.status).toBe("ANSWERED");
  });

  it("pagination returns at most 20 per page", async () => {
    const res = await getPrayers(new Request("http://localhost/api/prayers?page=1"));
    const data = await res.json();
    expect(data.prayers.length).toBeLessThanOrEqual(20);
    expect(data.pageSize).toBe(20);
    expect(data.page).toBe(1);
  });
});
