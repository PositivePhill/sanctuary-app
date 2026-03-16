# SANCTUARY — Architecture

## 1. Overview

SANCTUARY is a church community app with prayer wall, devotionals, and events. Built on Next.js App Router, Prisma, SQLite (dev), with server-stored sessions and CSRF protection.

## 2. Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14+ (App Router) |
| Language | TypeScript (strict) |
| ORM | Prisma |
| Database | SQLite (prisma/dev.db, dev only) |
| Styling | Tailwind CSS |
| Icons | Lucide React |
| Validation | Zod |
| Hashing | bcryptjs (12 rounds) |
| Testing | Vitest |

**Runtime:** Node.js only. No Edge runtime.

## 3. Data Model

### Entities

| Entity | Purpose |
|--------|---------|
| User | Auth identity, role (ADMIN | MEMBER, stored as String) |
| Session | Server-stored session tokens (token column stores SHA-256 hash) |
| PrayerRequest | Prayer wall posts |
| Comment | Comments on prayers |
| Devotional | Admin-authored devotionals |
| Event | Admin-created events |
| RSVP | User RSVPs to events |

### Fields & Relationships

```
User
├── id (cuid)
├── name
├── email (unique)
├── passwordHash
├── role (ADMIN | MEMBER)
└── createdAt

Session
├── id
├── userId → User
├── token (SHA-256 hash of raw token; cookie holds raw token)
├── expiresAt
└── createdAt

PrayerRequest
├── id
├── authorId → User
├── content
├── isAnonymous (boolean)
├── status (ACTIVE | ANSWERED, stored as String)
├── createdAt
└── updatedAt

Comment
├── id
├── prayerRequestId → PrayerRequest
├── authorId → User
├── content
└── createdAt

Devotional
├── id
├── authorId → User
├── title
├── scriptureReference
├── content
├── publishDate
├── createdAt
└── (no updatedAt per spec)

Event
├── id
├── title
├── description
├── eventDate
├── location
└── createdAt

RSVP
├── id
├── userId → User
├── eventId → Event
└── createdAt

Unique: (userId, eventId) for RSVP
```

## 4. Auth & Security

- **Passwords:** bcryptjs, 12 rounds, Node only
- **Sessions:** DB stores SHA-256 hash of token only; cookie holds raw token; httpOnly, sameSite: lax, secure in prod, 7-day expiry
- **CSRF:** Double-submit cookie
- **Rate limiting:** In-memory (dev); production requires shared store (see below)
- **Roles:** Server-side checks only; never trust client role

### Security Hardening Notes

- **Session tokens:** Stored as SHA-256 hash in DB. Raw token only in cookie. On lookup/delete, incoming token is hashed before DB query.
- **Rate limiting:** In-memory store is suitable for single-instance dev only. **Production deployments (multi-instance, serverless) require a shared backing store (e.g. Redis)** for effective rate limiting across instances. See README deployment section.

### Key Constraints

- Session: one token per session; rotate on login
- PrayerRequest: author can mark ANSWERED; members cannot modify others' prayers
- Devotional: list shows only where publishDate ≤ now (members); admins see all
- RSVP: one per user per event

## 5. Route Map

### Pages

| URL | Route Group | Purpose |
|-----|-------------|---------|
| / | (marketing) | Landing |
| /login | (auth) | Login form |
| /signup | (auth) | Signup form |
| /dashboard | (app) | Post-login landing |
| /prayers | (app) | Prayer Wall |
| /devotionals | (app) | Devotional list |
| /devotionals/[id] | (app) | Devotional read view |
| /events | (app) | Event list |
| /admin | (admin) | Admin dashboard |

### API Routes

| Method | Path | Purpose |
|--------|------|---------|
| POST | /api/auth/signup | Register |
| POST | /api/auth/login | Login |
| POST | /api/auth/logout | Logout |
| GET | /api/auth/me | Current user |
| GET | /api/prayers | List prayers (paginated 20/page) |
| POST | /api/prayers | Create prayer |
| GET | /api/prayers/[id] | Get prayer |
| PATCH | /api/prayers/[id] | Update prayer (author only, e.g. mark answered) |
| DELETE | /api/prayers/[id] | Delete prayer (author only) |
| GET | /api/comments | List comments (by prayerId) |
| POST | /api/comments | Create comment |
| GET | /api/devotionals | List devotionals |
| POST | /api/devotionals | Create devotional (admin) |
| GET | /api/devotionals/[id] | Get devotional |
| PATCH | /api/devotionals/[id] | Update devotional (admin) |
| DELETE | /api/devotionals/[id] | Delete devotional (admin) |
| GET | /api/events | List events |
| POST | /api/events | Create event (admin) |
| GET | /api/events/[id] | Get event |
| PATCH | /api/events/[id] | Update event (admin) |
| DELETE | /api/events/[id] | Delete event (admin) |
| POST | /api/events/[id]/rsvp | RSVP (no duplicates) |


## 6. Layout Strategy

- (marketing): minimal layout
- (auth): centered form layout
- (app): main app shell (nav, user menu)
- (admin): admin shell (admin nav)

## 7. Deployment Readiness

### Runtime Expectations

- **Node.js:** 18+ (LTS recommended). All server logic runs in Node runtime.
- **Edge runtime:** Not used. Do not enable Edge for any route.
- **Hosting:** Standard Node-compatible platforms (Vercel, Railway, Render, Fly.io, etc.) with Next.js Node runtime support.

### Database Expectations

| Environment | Database | Notes |
|-------------|----------|-------|
| Local/dev | SQLite (`file:./dev.db`) | `prisma db push` + `db:seed` |
| Production | PostgreSQL | `prisma migrate deploy` or `db push`; no seed with demo data |

Prisma schema uses standard types (cuid, DateTime, String) compatible with Postgres. To migrate: set `provider = "postgresql"` in schema.prisma, set `DATABASE_URL`, run `prisma migrate deploy` or `prisma db push`.

### Session / Cookie Behavior in Production

- **Cookie:** `session_token`; httpOnly, SameSite=Lax, Secure when `NODE_ENV=production`, 7-day Max-Age.
- **Session storage:** DB stores SHA-256 hash of token only; cookie holds raw token.
- **Invalidation:** After auth/security changes, existing sessions are invalid; users re-login.

### Rate Limiting Limitation

- **Current form:** In-memory store, keyed by IP (x-forwarded-for / x-real-ip) + user-agent.
- **Limitation:** Single-instance only. Multi-instance or serverless deployments require a shared backing store (e.g. Redis) for effective rate limiting across instances.
- **Mitigation:** Until Redis (or equivalent) is added, production may run with per-instance limits or accept the limitation for small deployments.

### Deployment Topology Assumptions

- One or more Node processes serving the Next.js app.
- Database accessible from app (Postgres in production).
- Reverse proxy (if any) forwards `x-forwarded-for` or `x-real-ip` for rate limiting.
- HTTPS in production for Secure cookies.

### Summary

| Area | Dev | Production |
|------|-----|------------|
| Database | SQLite (file:./dev.db) | Postgres; see README |
| Rate limiting | In-memory | Shared store (e.g. Redis) required for multi-instance |
| Session tokens | Hashed in DB | Same |
| Env vars | .env from .env.example | All required vars set; secrets rotated |

## 8. Definition of Done

- [x] Runs locally (npm run dev)
- [x] DB initializes cleanly (db:push)
- [x] Seed works (db:seed)
- [x] Tests pass (npm test)
- [x] Auth secure (hash, session hashed in DB, CSRF)
- [x] Role checks enforced server-side
- [x] Anonymous prayer logic correct
- [x] Pagination working (20/page)
- [x] No runtime errors
- [x] Accessibility basics (focus, aria, semantic HTML)
- [x] No dependency creep
- [x] Code organized and clean
