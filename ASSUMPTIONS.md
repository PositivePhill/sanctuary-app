# SANCTUARY — Assumptions

## Approved Phase 0 Amendments

1. **Rate limit client key:** Fallback must never use `host` header. If no `x-forwarded-for` or `x-real-ip` exists, use `"unknown"` as the key.
2. **CSRF:** Double-submit cookie implemented. Token from GET /api/csrf, sent in x-csrf-token header on state-changing requests.
3. **Devotional publish visibility (product assumption):** List page shows only devotionals where `publishDate ≤ now`. Admins may see all (including future-dated). This is an explicit product decision and must remain documented.

## General Assumptions

- Anonymous toggle is per-prayer (each prayer can be anonymous independently).
- Comment author is shown even on anonymous prayers; only prayer author is anonymized.
- Event `location` is free-text.
- Pagination is offset-based (skip/take), 20 per page.
- Dashboard shows summary: recent prayers, upcoming events, recent devotionals.
- RSVP uniqueness enforced via DB unique constraint on (userId, eventId).
- Seed uses upsert/clear-and-seed for idempotency.
- SQLite is dev-only; production migration path documented but not implemented.
- **Session tokens:** Cookie stores raw token; DB stores SHA-256 hash only. On deploy, existing sessions (if any) are invalidated; users re-login.
- **Role and PrayerStatus as String (not Prisma enum):** SQLite does not support Prisma enums natively. Per Prisma docs, enum fields in SQLite are stored as text. We use explicit String fields with documented values (ADMIN|MEMBER, ACTIVE|ANSWERED) for clarity and compatibility.

## Deployment Assumptions

- Production hosting supports Next.js Node runtime (no Edge).
- Production uses PostgreSQL; SQLite is dev-only.
- After auth/security changes, sessions are invalidated; no migration of old sessions.
- Smoke-test checklist in README covers post-deploy verification.
