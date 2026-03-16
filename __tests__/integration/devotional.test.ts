import { describe, it, expect } from "vitest";
import { prisma } from "@/lib/db";
import { GET as getCsrf } from "@/app/api/csrf/route";
import { GET as getDevotionals, POST as postDevotional } from "@/app/api/devotionals/route";
import { GET as getDevotionalById } from "@/app/api/devotionals/[id]/route";
import { POST as postLogin } from "@/app/api/auth/login/route";

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
  const { token, cookie } = await getCsrfHeaders();
  const res = await postLogin(
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
  const sessionCookie = getCookie(res.headers.get("set-cookie") ?? "");
  return { sessionCookie, token, cookie };
}

describe("devotionals integration", () => {
  it("admin can create devotional visible on /devotionals", async () => {
    const { sessionCookie } = await loginAs("admin@sanctuary.demo");
    const csrfHeaders = await getCsrfHeaders();
    const res = await postDevotional(
      new Request("http://localhost/api/devotionals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": csrfHeaders.token,
          Cookie: `${csrfHeaders.cookie}; ${sessionCookie}`,
        },
        body: JSON.stringify({
          title: "Admin Created Devotional",
          scriptureReference: "Psalm 23:1",
          content: "The Lord is my shepherd.",
          publishDate: new Date().toISOString(),
        }),
      })
    );
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.title).toBe("Admin Created Devotional");
    const listRes = await getDevotionals(new Request("http://localhost/api/devotionals"));
    const listData = await listRes.json();
    const found = listData.devotionals.find((d: { id: string }) => d.id === data.id);
    expect(found).toBeDefined();
    expect(found.title).toBe("Admin Created Devotional");
  });

  it("member cannot create devotional", async () => {
    const { sessionCookie } = await loginAs("alice@sanctuary.demo");
    const { token, cookie } = await getCsrfHeaders();
    const res = await postDevotional(
      new Request("http://localhost/api/devotionals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": token,
          Cookie: `${cookie}; ${sessionCookie}`,
        },
        body: JSON.stringify({
          title: "Member Devotional",
          scriptureReference: "John 1:1",
          content: "In the beginning.",
          publishDate: new Date().toISOString(),
        }),
      })
    );
    expect(res.status).toBe(403);
  });

  it("devotional appears on /devotionals when publishDate <= now", async () => {
    const devotionals = await prisma.devotional.findMany({
      where: { publishDate: { lte: new Date() } },
    });
    expect(devotionals.length).toBeGreaterThan(0);
    const res = await getDevotionals(new Request("http://localhost/api/devotionals"));
    const data = await res.json();
    const published = data.devotionals.filter(
      (d: { publishDate: string }) => new Date(d.publishDate) <= new Date()
    );
    expect(published.length).toBe(data.devotionals.length);
  });

  it("future-dated devotional is hidden from member/public list", async () => {
    const admin = await prisma.user.findUnique({ where: { email: "admin@sanctuary.demo" } });
    if (!admin) throw new Error("Admin not found");
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    const futureDevotional = await prisma.devotional.create({
      data: {
        authorId: admin.id,
        title: "Future Devotional",
        scriptureReference: "Rev 21:1",
        content: "Future content.",
        publishDate: futureDate,
      },
    });
    const res = await getDevotionals(new Request("http://localhost/api/devotionals"));
    const data = await res.json();
    const found = data.devotionals.find((d: { id: string }) => d.id === futureDevotional.id);
    expect(found).toBeUndefined();
    await prisma.devotional.delete({ where: { id: futureDevotional.id } });
  });

  it("devotional detail page loads correctly for a visible devotional", async () => {
    const devotionals = await prisma.devotional.findMany({
      where: { publishDate: { lte: new Date() } },
    });
    if (devotionals.length === 0) return;
    const res = await getDevotionalById(
      new Request("http://localhost/api/devotionals/" + devotionals[0].id),
      { params: Promise.resolve({ id: devotionals[0].id }) }
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.id).toBe(devotionals[0].id);
    expect(data.title).toBeDefined();
    expect(data.content).toBeDefined();
  });

  it("invalid devotional payload rejected with 400", async () => {
    const { sessionCookie } = await loginAs("admin@sanctuary.demo");
    const { token, cookie } = await getCsrfHeaders();
    const res = await postDevotional(
      new Request("http://localhost/api/devotionals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": token,
          Cookie: `${cookie}; ${sessionCookie}`,
        },
        body: JSON.stringify({
          title: "",
          scriptureReference: "John 1:1",
          content: "Content",
          publishDate: new Date().toISOString(),
        }),
      })
    );
    expect(res.status).toBe(400);
  });
});
