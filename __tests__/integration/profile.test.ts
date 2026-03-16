import { describe, it, expect } from "vitest";
import { prisma } from "@/lib/db";
import { GET as getCsrf } from "@/app/api/csrf/route";
import { PATCH as patchProfile } from "@/app/api/auth/profile/route";

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

describe("profile settings", () => {
  it("unauthenticated user cannot update profile", async () => {
    const { token, cookie } = await getCsrfHeaders();
    const res = await patchProfile(
      new Request("http://localhost/api/auth/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": token,
          Cookie: cookie,
        },
        body: JSON.stringify({ name: "New Name" }),
      })
    );
    expect(res.status).toBe(401);
  });

  it("authenticated user can update display name", async () => {
    const { sessionCookie, token, cookie } = await loginAs("bob@sanctuary.demo");
    const res = await patchProfile(
      new Request("http://localhost/api/auth/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": token,
          Cookie: `${cookie}; ${sessionCookie}`,
        },
        body: JSON.stringify({ name: "Bob Updated" }),
      })
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.name).toBe("Bob Updated");

    const user = await prisma.user.findUnique({ where: { email: "bob@sanctuary.demo" } });
    expect(user?.name).toBe("Bob Updated");

    await prisma.user.update({
      where: { id: user!.id },
      data: { name: "Bob Member" },
    });
  });

  it("authenticated user can update avatar style", async () => {
    const { sessionCookie, token, cookie } = await loginAs("alice@sanctuary.demo");
    const res = await patchProfile(
      new Request("http://localhost/api/auth/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": token,
          Cookie: `${cookie}; ${sessionCookie}`,
        },
        body: JSON.stringify({ avatarStyle: "emerald" }),
      })
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.avatarStyle).toBe("emerald");

    const user = await prisma.user.findUnique({ where: { email: "alice@sanctuary.demo" } });
    expect(user?.avatarStyle).toBe("emerald");

    await prisma.user.update({
      where: { id: user!.id },
      data: { avatarStyle: null },
    });
  });
});
