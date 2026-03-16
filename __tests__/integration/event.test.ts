import { describe, it, expect } from "vitest";
import { prisma } from "@/lib/db";
import { GET as getCsrf } from "@/app/api/csrf/route";
import { GET as getEvents, POST as postEvent } from "@/app/api/events/route";
import { POST as postRsvp } from "@/app/api/events/[id]/rsvp/route";
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

describe("events integration", () => {
  it("admin can create event", async () => {
    const { sessionCookie } = await loginAs("admin@sanctuary.demo");
    const { token, cookie } = await getCsrfHeaders();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 14);
    const res = await postEvent(
      new Request("http://localhost/api/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": token,
          Cookie: `${cookie}; ${sessionCookie}`,
        },
        body: JSON.stringify({
          title: "Test Event",
          description: "A test event",
          eventDate: futureDate.toISOString(),
          location: "Test Location",
        }),
      })
    );
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.title).toBe("Test Event");
  });

  it("member cannot create event", async () => {
    const { sessionCookie } = await loginAs("alice@sanctuary.demo");
    const { token, cookie } = await getCsrfHeaders();
    const res = await postEvent(
      new Request("http://localhost/api/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": token,
          Cookie: `${cookie}; ${sessionCookie}`,
        },
        body: JSON.stringify({
          title: "Member Event",
          description: "Nope",
          eventDate: new Date().toISOString(),
          location: "Here",
        }),
      })
    );
    expect(res.status).toBe(403);
  });

  it("events list is sorted by eventDate ascending", async () => {
    const res = await getEvents(new Request("http://localhost/api/events"));
    const data = await res.json();
    if (data.events.length < 2) return;
    for (let i = 1; i < data.events.length; i++) {
      const prev = new Date(data.events[i - 1].eventDate).getTime();
      const curr = new Date(data.events[i].eventDate).getTime();
      expect(prev).toBeLessThanOrEqual(curr);
    }
  });

  it("member can RSVP successfully", async () => {
    const events = await prisma.event.findMany();
    if (events.length === 0) return;
    const { sessionCookie } = await loginAs("alice@sanctuary.demo");
    const { token, cookie } = await getCsrfHeaders();
    const eventId = events[0].id;
    await prisma.rSVP.deleteMany({ where: { userId: (await prisma.user.findUnique({ where: { email: "alice@sanctuary.demo" } }))!.id, eventId } });
    const res = await postRsvp(
      new Request("http://localhost/api/events/" + eventId + "/rsvp", {
        method: "POST",
        headers: {
          "x-csrf-token": token,
          Cookie: `${cookie}; ${sessionCookie}`,
        },
      }),
      { params: Promise.resolve({ id: eventId }) }
    );
    expect(res.status).toBe(201);
  });

  it("duplicate RSVP is prevented", async () => {
    const alice = await prisma.user.findUnique({ where: { email: "alice@sanctuary.demo" } });
    if (!alice) throw new Error("Alice not found");
    const events = await prisma.event.findMany();
    if (events.length === 0) return;
    const eventId = events[0].id;
    await prisma.rSVP.upsert({
      where: { userId_eventId: { userId: alice.id, eventId } },
      create: { userId: alice.id, eventId },
      update: {},
    });
    const { sessionCookie } = await loginAs("alice@sanctuary.demo");
    const { token, cookie } = await getCsrfHeaders();
    const res = await postRsvp(
      new Request("http://localhost/api/events/" + eventId + "/rsvp", {
        method: "POST",
        headers: {
          "x-csrf-token": token,
          Cookie: `${cookie}; ${sessionCookie}`,
        },
      }),
      { params: Promise.resolve({ id: eventId }) }
    );
    expect(res.status).toBe(409);
  });

  it("invalid event payload rejected with 400", async () => {
    const { sessionCookie } = await loginAs("admin@sanctuary.demo");
    const { token, cookie } = await getCsrfHeaders();
    const res = await postEvent(
      new Request("http://localhost/api/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": token,
          Cookie: `${cookie}; ${sessionCookie}`,
        },
        body: JSON.stringify({
          title: "",
          description: "Desc",
          eventDate: new Date().toISOString(),
          location: "Loc",
        }),
      })
    );
    expect(res.status).toBe(400);
  });

  it("unauthorized RSVP blocked if user is not authenticated", async () => {
    const events = await prisma.event.findMany();
    if (events.length === 0) return;
    const { token, cookie } = await getCsrfHeaders();
    const res = await postRsvp(
      new Request("http://localhost/api/events/" + events[0].id + "/rsvp", {
        method: "POST",
        headers: { "x-csrf-token": token, Cookie: cookie },
      }),
      { params: Promise.resolve({ id: events[0].id }) }
    );
    expect(res.status).toBe(401);
  });
});
