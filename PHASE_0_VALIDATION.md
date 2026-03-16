# SANCTUARY — Phase 0: Validate Spec (Approved)

## Approved Amendments (Post-Review)

1. **Rate limit client key fallback:** Must never use `host` header. Fallback to `"unknown"` if no `x-forwarded-for` or `x-real-ip` exists.
2. **CSRF implementation:** Tentatively double-submit cookie; to be finalized in Phase 1.
3. **Devotional publish visibility:** Explicit product assumption—list page shows only devotionals where `publishDate ≤ now` (unless admin). Must be logged in ASSUMPTIONS.md.

## Spec Summary (10 Bullets)

1. Next.js App Router + TypeScript (strict) + Prisma + SQLite + Tailwind + Zod + bcryptjs; Node.js runtime only.
2. Server-stored sessions, httpOnly cookies, CSRF on state-changing routes, rate limiting (5/10min login/signup).
3. User, Session, PrayerRequest, Comment, Devotional, Event, RSVP models.
4. Route groups: (marketing), (auth), (app), (admin). URLs: /, /login, /signup, /dashboard, /devotionals, /events, /admin.
5. Auth: signup/login/logout, role-based (ADMIN | MEMBER).
6. Prayer Wall: post, anonymous toggle, comment, mark answered, paginated 20/page.
7. Devotionals: admin create, member read, serif typography.
8. Events: admin create, RSVP, no duplicates.
9. Seed: 1 admin, 2 members, 3 prayers, 2 devotionals, 2 events, sample RSVPs.
10. Design: peaceful, stone/slate palette, amber primary, Inter + serif fonts.
