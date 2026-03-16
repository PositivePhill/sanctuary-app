import { describe, it, expect } from "vitest";
import { GET as getCsrf } from "@/app/api/csrf/route";
import { GET as getMe } from "@/app/api/auth/me/route";
import { POST as postLogin } from "@/app/api/auth/login/route";
import { POST as postLogout } from "@/app/api/auth/logout/route";

function parseSessionCookie(setCookie: string | null): string | null {
  if (!setCookie) return null;
  const match = setCookie.match(/session_token=([^;]+)/);
  return match ? match[1] : null;
}

describe("auth integration", () => {
  // Seed runs via npm test script before all tests

  it("login with valid credentials returns user", async () => {
    const csrfRes = await getCsrf();
    const { token } = await csrfRes.json();
    const setCookie = csrfRes.headers.get("set-cookie") ?? "";
    const cookiePart = setCookie.split(";")[0] ?? `csrf_token=${token}`;

    const loginRes = await postLogin(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": token,
          Cookie: cookiePart,
        },
        body: JSON.stringify({
          email: "admin@sanctuary.demo",
          password: "demo123",
        }),
      })
    );

    expect(loginRes.status).toBe(200);
    const data = await loginRes.json();
    expect(data.user).toBeDefined();
    expect(data.user.email).toBe("admin@sanctuary.demo");
    expect(data.user.role).toBe("ADMIN");
    expect(loginRes.headers.get("set-cookie")).toContain("session_token");
  });

  it("login with invalid password returns 400", async () => {
    const csrfRes = await getCsrf();
    const { token } = await csrfRes.json();
    const setCookie = csrfRes.headers.get("set-cookie") ?? "";
    const cookiePart = setCookie.split(";")[0] ?? `csrf_token=${token}`;

    const loginRes = await postLogin(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": token,
          Cookie: cookiePart,
        },
        body: JSON.stringify({
          email: "admin@sanctuary.demo",
          password: "wrongpassword",
        }),
      })
    );

    expect(loginRes.status).toBe(400);
    const data = await loginRes.json();
    expect(data.error).toBeDefined();
    expect(data.error).toBe("Invalid email or password");
  });

  it("hashed session flow: login -> me -> logout -> me returns null", async () => {
    const csrfRes = await getCsrf();
    const { token: csrfToken } = await csrfRes.json();
    const csrfCookie = csrfRes.headers.get("set-cookie") ?? "";
    const csrfCookiePart = csrfCookie.split(";")[0] ?? `csrf_token=${csrfToken}`;

    const loginRes = await postLogin(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": csrfToken,
          Cookie: csrfCookiePart,
        },
        body: JSON.stringify({
          email: "alice@sanctuary.demo",
          password: "demo123",
        }),
      })
    );
    expect(loginRes.status).toBe(200);

    const sessionToken = parseSessionCookie(loginRes.headers.get("set-cookie"));
    expect(sessionToken).toBeTruthy();

    const meRes = await getMe(
      new Request("http://localhost/api/auth/me", {
        headers: { Cookie: `session_token=${sessionToken}` },
      })
    );
    expect(meRes.status).toBe(200);
    const meData = await meRes.json();
    expect(meData.user).toBeDefined();
    expect(meData.user.email).toBe("alice@sanctuary.demo");

    const logoutRes = await postLogout(
      new Request("http://localhost/api/auth/logout", {
        method: "POST",
        headers: {
          "x-csrf-token": csrfToken,
          Cookie: `${csrfCookiePart}; session_token=${sessionToken}`,
        },
      })
    );
    expect(logoutRes.status).toBe(200);

    const meAfterRes = await getMe(
      new Request("http://localhost/api/auth/me", {
        headers: { Cookie: `session_token=${sessionToken}` },
      })
    );
    const meAfterData = await meAfterRes.json();
    expect(meAfterData.user).toBeNull();
  });
});
