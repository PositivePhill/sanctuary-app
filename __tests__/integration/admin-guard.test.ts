import { describe, it, expect } from "vitest";
import { GET as getCsrf } from "@/app/api/csrf/route";
import { POST as postDevotional } from "@/app/api/devotionals/route";
import { POST as postLogin } from "@/app/api/auth/login/route";

function getCookie(setCookie: string | null): string {
  if (!setCookie) return "";
  return setCookie.split(";")[0] ?? "";
}

async function loginAsMember() {
  const csrfRes = await getCsrf();
  const { token } = await csrfRes.json();
  const cookie = getCookie(csrfRes.headers.get("set-cookie"));
  const loginRes = await postLogin(
    new Request("http://localhost/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-csrf-token": token,
        Cookie: cookie,
      },
      body: JSON.stringify({ email: "alice@sanctuary.demo", password: "demo123" }),
    })
  );
  const sessionCookie = getCookie(loginRes.headers.get("set-cookie") ?? "");
  return { sessionCookie, token, cookie };
}

describe("admin route guard", () => {
  it("unauthorized admin route blocked - member cannot create devotional", async () => {
    const { sessionCookie } = await loginAsMember();
    const csrfRes = await getCsrf();
    const { token } = await csrfRes.json();
    const cookie = getCookie(csrfRes.headers.get("set-cookie"));
    const res = await postDevotional(
      new Request("http://localhost/api/devotionals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": token,
          Cookie: `${cookie}; ${sessionCookie}`,
        },
        body: JSON.stringify({
          title: "Member Tries Admin",
          scriptureReference: "John 1:1",
          content: "Content",
          publishDate: new Date().toISOString(),
        }),
      })
    );
    expect(res.status).toBe(403);
  });
});
