<p align="center">
  <img src="./public/sanctuary.png" alt="SANCTUARY preview" width="320" />
</p>

<h1 align="center">SANCTUARY</h1>

<p align="center">
  A full-stack church community platform for prayer, devotionals, praise reports, and events.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-14-black?logo=next.js" />
  <img src="https://img.shields.io/badge/TypeScript-Strict-blue?logo=typescript" />
  <img src="https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma" />
  <img src="https://img.shields.io/badge/Tests-31%20passing-brightgreen" />
  <img src="https://img.shields.io/badge/License-MIT-yellow" />
</p>

<p align="center">
  <a href="https://sanctuary-app.vercel.app">
    <img src="https://img.shields.io/badge/Live%20Demo-Visit%20SANCTUARY-22c55e?style=for-the-badge&logo=vercel" />
  </a>
</p>

---

# Why SANCTUARY?

- 🔐 Secure custom authentication with hashed session tokens
- 🙏 Prayer Wall with optional anonymity
- ✨ Praise Wall for answered prayers
- 📖 Devotionals with admin publishing controls
- 📅 Events and RSVP flows
- 🛡️ CSRF protection, role-based access control, and test coverage

---

# Overview

SANCTUARY is a full-stack church community application designed to help congregations stay connected through prayer, devotionals, and events.

Members can:

- Share prayer requests (optionally anonymously)
- Celebrate answered prayers on the **Praise Wall**
- Read devotionals
- RSVP to community events

Administrators can publish devotionals and manage events through a role-protected admin dashboard.

The project focuses on **security, accessibility, and production-ready architecture**.

---

# Demo

Live demo:

https://sanctuary-app.vercel.app

Demo credentials:

| Role | Email | Password |
|-----|------|------|
| Admin | admin@sanctuary.demo | demo123 |
| Member | alice@sanctuary.demo | demo123 |
| Member | bob@sanctuary.demo | demo123 |

---

# Features

## Authentication & Security

- Custom authentication system (no third-party auth)
- bcrypt password hashing
- SHA-256 hashed session tokens
- httpOnly session cookies
- CSRF protection using double-submit cookies
- Rate limiting for login and signup
- Role-based access control

---

## Prayer Wall

- Post prayer requests
- Optional anonymous posting
- Comment on prayers
- Mark prayers as answered
- Pagination (20 per page)

---

## Praise Wall

- Dedicated page showing answered prayers
- “Praise Report” card styling
- Celebratory UI for answered prayers

---

## Devotionals

- Admin-created devotionals
- Publish date scheduling
- Member read-only view
- Clean reading layout

---

## Events

- Community event listing
- Event RSVP system
- Duplicate RSVP prevention
- Admin event management

---

## Dashboard

Displays:

- Active prayer count
- Upcoming events
- Published devotionals
- User role indicator
- Scripture of the Day

---

# Technology Stack

| Layer | Technology |
|------|------------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript (strict mode) |
| ORM | Prisma |
| Database | SQLite (dev) / PostgreSQL (production) |
| Styling | Tailwind CSS |
| Validation | Zod |
| Icons | Lucide React |
| Testing | Vitest |

---

# Architecture

SANCTUARY uses a **server-first architecture** with Next.js App Router.


Client
↓
Server Components
↓
API Route Handlers
↓
Prisma ORM
↓
Database


Security layers include:

- bcrypt password hashing
- CSRF double-submit cookie protection
- secure httpOnly session cookies
- role-based authorization
- login rate limiting

---

# Local Development Setup

### Install dependencies


npm install


Copy environment file:


cp .env.example .env


Windows:


copy .env.example .env


Initialize database:


npm run db:push
npm run db:seed


Start development server:


npm run dev


App runs at:


http://localhost:3000


---

# Scripts

| Script | Description |
|------|-------------|
| npm run dev | Start development server |
| npm run build | Create production build |
| npm run start | Run production server |
| npm run db:push | Sync Prisma schema |
| npm run db:seed | Seed demo data |
| npm test | Run test suite |

---

# Testing

Run tests:


npm test


Test coverage includes:

- authentication flow
- session handling
- Prayer Wall functionality
- Devotional permissions
- event RSVP logic
- admin route protection

Total tests: **31 passing**

---

# Deployment

## Requirements

- Node.js 18+
- PostgreSQL database for production
- Node-compatible hosting platform

Recommended platforms:

- Vercel
- Railway
- Render
- Fly.io

---

# Production Environment Variables

| Variable | Description |
|------|-------------|
| DATABASE_URL | PostgreSQL connection string |
| SESSION_SECRET | crypto-random session secret |
| CSRF_SECRET | CSRF token secret |

Example:


DATABASE_URL="postgresql://user:password@host:5432/sanctuary"


---

# Project Structure


app/
(app)/
dashboard
prayers
praise
devotionals
events

(admin)/
admin

(auth)/
login
signup

api/
auth
prayers
devotionals
events
comments

components/
lib/
prisma/
tests/


---

# Screenshots

## Dashboard
![Dashboard](./public/img_1.png)

## Prayer Wall
![Prayer Wall](./public/img_4.png)

## Praise Wall
![Praise Wall](./public/img_5.png)

## Devotionals
![Devotionals](./public/img_6.png)

## Events
![Events](./public/img_7.png)

---

# Author

**Phillip Mattern**  
Founder — Possum Mattern Studios  
Mesa, Arizona

Portfolio  
https://positivephill.github.io/portfolio/

GitHub  
https://github.com/PositivePhill

---

# Key Engineering Decisions

- Custom authentication instead of third-party auth
- Session tokens stored hashed in the database
- CSRF protection on state-changing routes
- Role-based access control enforced server-side
- Server-first architecture using Next.js App Router
- Production caveats documented clearly

---

# License

MIT License