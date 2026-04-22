# LearnNextDoor

> A hyperlocal learning platform connecting students with local academies in Pitampura, Delhi — dance, music, coding, art, yoga, cooking and more.

![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?logo=tailwindcss)
![Prisma](https://img.shields.io/badge/Prisma-5-2D3748?logo=prisma)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-3ECF8E?logo=supabase)
![Claude AI](https://img.shields.io/badge/AI-Claude_Haiku-orange?logo=anthropic)

Students browse and book classes from local providers. Providers get a full dashboard to manage listings, batches, instructors, earnings and support. An admin portal handles KYC approvals, payment settlements, user moderation, and audit logging.

**Looking to deploy?** See [DEPLOY.md](./DEPLOY.md) for a step-by-step Vercel + Supabase walkthrough.

---

## Table of Contents

1. [Features](#features)
2. [Tech Stack](#tech-stack)
3. [Prerequisites](#prerequisites)
4. [Quick Start](#quick-start)
5. [Demo Credentials](#demo-credentials)
6. [Project Structure](#project-structure)
7. [How OTP Works](#how-otp-works)
8. [How Sessions Work](#how-sessions-work)
9. [AI Discovery Assistant — Ask Zoe](#ai-discovery-assistant--ask-zoe)
10. [Payments](#payments)
11. [Data Model](#data-model)
12. [Scripts](#scripts)
13. [Admin Portal](#admin-portal)
14. [Roadmap](#roadmap)
15. [Troubleshooting](#troubleshooting)

---

## Features

**Student side**
- Browse and search classes by category, area, price, and schedule
- View class details, batch times, and free-trial availability
- One-tap booking (enroll or free trial)
- Booking management with cancellation
- AI-powered discovery assistant "Ask Zoe" (Claude Haiku)

**Provider side**
- 4-step onboarding wizard (phone → OTP → institute details → KYC)
- Full class management: create, edit, pause, archive
- Batch management with capacity, pricing, and free-trial toggle
- Instructor CRUD with per-instructor KYC
- Holiday / closure calendar
- Earnings dashboard with settlement tracking
- Support ticket system
- Device management and remote logout

**Admin portal**
- KYC approvals for providers and instructors
- Listing approval workflow with SLA badges
- User management with suspension and blacklisting
- Payment settlements (mark paid / failed with UTR capture)
- Refund queue management
- Provider concern triage (open / resolved / merged)
- Append-only audit log for every admin action

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 3.4 |
| ORM | Prisma 5 |
| Database | PostgreSQL via Supabase |
| Auth | Custom OTP + cookie sessions (no NextAuth) |
| AI | Anthropic Claude Haiku (`@anthropic-ai/sdk`) |
| Validation | Zod |
| Email OTP | Resend |
| SMS/WhatsApp | Twilio (scaffolded) |
| Payments | Razorpay (scaffolded) |
| Deployment | Vercel |

---

## Prerequisites

- Node.js 18.18+ (20.x recommended)
- npm 10+
- A PostgreSQL database — free [Supabase](https://supabase.com) project works for local dev and prod

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Copy env template and fill in DATABASE_URL / DIRECT_URL from Supabase
cp .env.example .env

# 3. Push schema to your database
npx prisma db push

# 4. Seed demo data (8 providers, 8 classes, a sample student)
npm run db:seed

# 5. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Demo Credentials

The seed creates one student and eight providers. OTP runs in dev mode by default — the 6-digit code is **printed to the terminal** and returned in the API response as `devCode`. No real SMS or email needed.

| Role | Phone | Notes |
|---|---|---|
| Student | `+919999999999` | "Aryan Shenoy" — sample bookings pre-loaded |
| Provider P001 | `+919810000001` | Nritya Academy — full dashboard, settlements |
| Provider P002 | `+919810000002` | CodeCraft |
| Provider P003 | `+919810000003` | Clay Studio |
| Provider P004 | `+919810000004` | MindSpark |
| Provider P005 | `+919810000005` | Cucina Kitchen |
| Provider P006 | `+919810000006` | Strings Academy |
| Provider P007 | `+919810000007` | Inner Peace |
| Provider P008 | `+919810000008` | Canvas Corner |

- **Student login:** `/login` → enter phone → terminal shows OTP
- **Provider login:** `/provider/login` → enter phone → terminal shows OTP
- **New provider signup:** `/provider/signup` — 4-step onboarding wizard
- **Admin:** set `ADMIN_SEED_*` env vars, then visit `/admin/login`

---

## Project Structure

```
src/
  app/
    layout.tsx                Root layout (Inter + Poppins fonts)
    page.tsx                  Landing page (hero, trending, categories)
    globals.css               Tailwind layers + component utility classes
    login/                    Student OTP login
    browse/                   Browse/search + "Ask Zoe" assistant
    class/[id]/               Class detail + booking form
    my-bookings/              Student's bookings + cancel
    provider/
      ProviderShell.tsx       Sidebar + topbar (auth-gated wrapper)
      layout.tsx              Delegates to ProviderShell
      login/, signup/         Provider onboarding
      dashboard/              KPIs, recent bookings
      classes/                List, 4-step create wizard, edit
      instructors/            CRUD for instructors
      earnings/               Settlements + payouts
      holidays/               Holiday & cancellation calendar
      account/                Profile, UPI, KYC, devices, logout-all
      notifications/          In-app inbox
      support/                Tickets (create + list)
    admin/
      login/                  Admin login (bcrypt + separate session)
      (protected)/
        page.tsx              Dashboard with alert badges
        kyc/                  KYC approvals (provider + instructor)
        listings/             Listing approval + live management
        payments/             Settlements + refunds
        users/                Search + suspend
        concerns/             Support ticket triage
    api/
      auth/                   send-otp, verify-otp, logout, logout-all
      provider/               profile (POST/PATCH), kyc
      classes/                POST + [id] GET/PATCH/DELETE
      instructors/            POST + [id] PATCH/DELETE
      bookings/               POST (enroll/trial) + [id] DELETE
      holidays/               POST + [id] DELETE
      notifications/          PATCH (mark read)
      support/                POST (create ticket)
      chat/                   POST (Zoe AI assistant)
      admin/                  Separate auth + all admin route handlers
  components/
    Logo.tsx                  Gradient logo + wordmark
    StudentHeader.tsx         Sticky search header with booking badge
    StudentFooter.tsx
    ProviderSidebar.tsx       9-item navigation (client component)
    ProviderTopbar.tsx        Welcome, notifications bell, support link
    ClassCard.tsx             Reusable class tile
    Pills.tsx                 Tag/category chips
    LogoutButton.tsx
    AssistantDrawer.tsx       "Ask Zoe" floating button + chat drawer
  lib/
    prisma.ts                 Prisma singleton
    auth.ts                   Session management (getCurrentUser, requireUser, requireProvider)
    admin-auth.ts             Admin bcrypt + session (60-min idle timeout)
    otp.ts                    Pluggable OTP delivery (dev / Twilio / Resend)
    cancellation.ts           Cancellation policy logic
    utils.ts                  cn helper + formatters
prisma/
  schema.prisma               Full data model (19 tables)
  seed.ts                     Comprehensive seed data
```

---

## How OTP Works

`src/lib/otp.ts` exports `deliverOtp({ identifier, code, channel, role })`.

**Dev mode** (`OTP_DEV_MODE=true`, default):
1. Prints the 6-digit code to the server console
2. The `/api/auth/send-otp` route echoes it back as `devCode` in the JSON response
3. The UI shows a yellow "Dev mode" banner with the code pre-filled

**Production — Email (Resend):**

```env
OTP_DEV_MODE=false
RESEND_API_KEY=re_xxxxxxxxxxxxxxxx
EMAIL_FROM="LearnNextDoor <noreply@yourdomain.com>"
```

**Production — WhatsApp / SMS (Twilio):**

```env
OTP_DEV_MODE=false
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
```

Uncomment the Twilio stub in `src/lib/otp.ts` and run `npm install twilio`.

Codes expire after 10 minutes; 5 attempts are allowed per code.

---

## How Sessions Work

This project does not use NextAuth. `src/lib/auth.ts` implements a minimal cookie-based session:

- On successful OTP verification the server creates an `AuthSession` row and sets an `lnd_session` cookie (httpOnly, SameSite=Lax, 7-day expiry)
- `requireUser()` reads the cookie, looks up the session, and returns the `User` — redirects if missing
- `requireProvider()` additionally loads the `Provider` row and promotes the role to `PROVIDER` on first onboarding
- The account page lists all active devices and exposes "log out of all devices" (wipes every session for the user)
- Session token is a random 32-byte hex string — not a JWT; revoked by deleting the DB row

Admin sessions use a separate `lnd_admin_session` cookie with a 60-minute idle timeout.

---

## AI Discovery Assistant — Ask Zoe

A floating **"Ask Zoe"** button appears on `/` and `/browse`. Students describe what they need — *"weekend yoga for my 55-year-old mum"*, *"coding for a shy 12-year-old under ₹3000/month"* — and Zoe recommends live classes from the database with markdown links.

**How grounding works:**
- Every request fetches the current active catalog: `prisma.class.findMany({ where: { status: "ACTIVE" } })` (capped at 100 classes)
- The catalog is condensed to a compact JSON blob (id, title, category, provider, area, batches with days/times/prices/seats/trial) and injected into the system prompt
- Zoe is constrained to only recommend from the catalog and must cite each recommendation with a `[Class title](/class/<id>)` link
- Conversation state lives in React state only — nothing is persisted

**Enable it:**

```env
ANTHROPIC_API_KEY=sk-ant-...
```

Default model: `claude-haiku-4-5-20251001` — fast and cheap for always-on discovery.

**Files:** `src/app/api/chat/route.ts` (server) · `src/components/AssistantDrawer.tsx` (client)

**Production hardening needed:**
- Rate limit per user (e.g. 20 messages/day) to cap API spend
- Gate `/api/chat` behind `requireUser()` so anonymous visitors can't drain the budget
- Cache the catalog with `unstable_cache` (60s TTL) to avoid a DB call per message
- Swap `messages.create` for `messages.stream` for a typewriter UX

---

## Payments

Payments are scaffolded but not wired end-to-end. The booking API records `amount` and marks status `CONFIRMED` directly. To integrate Razorpay:

```env
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxx
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxx
```

Integration steps:
1. Before creating the booking row, call Razorpay `orders.create` and return `orderId` to the client
2. Open Razorpay Checkout on the client with that order
3. On `payment.success`, POST to `/api/bookings` with `paymentId` and verify the signature server-side before calling `prisma.booking.create`

---

## Data Model

19 Prisma models. Key relationships:

| Model | Purpose |
|---|---|
| `User` | Student / Provider / Admin base (phone, email, role, suspended flag) |
| `Provider` | Provider profile, UPI, KYC state machine |
| `Instructor` | Teacher records with separate KYC workflow |
| `Class` | Learning offering (type: REGULAR / COURSE / WORKSHOP; liveStatus: PENDING_APPROVAL / APPROVED / REJECTED / BLOCKED) |
| `Batch` | Cohort within a class (days, times, capacity, pricing, free-trial toggle) |
| `Booking` | Enrollment (mode: ENROLL / TRIAL; status: CONFIRMED / CANCELLED / REFUNDED …) |
| `AuthSession` | Student/Provider sessions (token, device, lastActive, expiresAt) |
| `AdminUser` / `AdminSession` | Separate admin auth tier (bcrypt, 60-min idle) |
| `Settlement` | Provider payouts (PROCESSING / PENDING / PAID / FAILED / FUTURE) |
| `Refund` | Refund records with UTR tracking |
| `SupportTicket` | Support tickets with merge and 7-day auto-delete on resolve |
| `AuditLog` | Append-only admin action log (module, action, before/after JSON, reason, IP) |
| `OtpCode` | OTP tracking (identifier, code, expiresAt, attempts) |
| `PhoneBlacklist` / `EmailBlacklist` | Re-signup prevention after suspension |

**State machines:**
- KYC: `NOT_UPLOADED → PENDING → VERIFIED | REJECTED`
- Provider code: auto-assigned `P001`, `P002`, ... by row count
- Seat capacity: `Batch.enrolled` increments on booking, decrements on cancel; 400 returned when full

---

## Scripts

```bash
npm run dev          # Start Next.js dev server
npm run build        # prisma generate + next build
npm run start        # Run production build
npm run lint         # Next.js ESLint

npm run db:push      # Sync schema.prisma to database (no migration history)
npm run db:seed      # Populate with demo data
npm run db:reset     # Drop everything and re-seed
npm run db:studio    # Open Prisma Studio at localhost:5555
```

---

## Admin Portal

The admin portal lives at **`/admin`** — excluded from `robots.txt`, no public link.

**First-time access:** set the four `ADMIN_SEED_*` env vars (see `.env.example`), then visit `/admin/login`. The first successful login seeds the Super Admin account and forces a password reset.

| Module | What it does |
|---|---|
| Dashboard | Quick-link grid with urgent-count badges; Critical Alerts banner |
| KYC Approvals | Provider + instructor document viewer; approve / reject / revoke with mandatory reason |
| Listing Approvals | New listing review; approve blocked if provider KYC unverified; SLA countdown badge |
| Listing Management | Global search by title / ID / provider; block / unblock live listings |
| User Management | Search-only (privacy-first); suspend → kills sessions + optional blacklist |
| Payments | Settlements (mark paid + UTR / mark failed + reason) and Refunds queue |
| Provider Concerns | Open / Resolved / Merged tabs; 7-day auto-delete countdown on resolve; merge duplicates |

Every action writes an `AuditLog` row (module, action, actorId, entityType, entityId, before/after JSON, reason, IP).

**Relevant files:**
- `src/lib/admin-auth.ts` — bcrypt, session, idle-timeout, audit logger, Super Admin bootstrap
- `src/app/admin/(protected)/` — all authenticated admin pages
- `src/app/api/admin/` — Zod-validated, audit-logged route handlers

---

## Roadmap

This is a functional MVP. Areas planned for production hardening:

- **Payments** — wire Razorpay for learner checkout (scaffolding in place)
- **OTP rate limiting** — per-phone + per-IP throttling via Upstash Redis
- **Image uploads** — swap comma-separated URLs for S3 / UploadThing / Cloudinary
- **Admin Phase 2** — Daily Live Tracking, Stats, Audit Log viewer UI, admin invite flow
- **Resolved-ticket auto-purge** — `deleteAfter` is set; needs a daily Vercel Cron job
- **Reviews** — `Review` model exists and renders; needs a post-session submission form
- **Email receipts** — booking confirmation emails via the existing Resend adapter
- **Real-time notifications** — WebSocket or SSE layer for the bell badge
- **Zoe hardening** — rate limiting, login gate, catalog caching, streaming, moderation

---

## Troubleshooting

**`next: command not found` after `npm install`**
Delete `node_modules` and `package-lock.json`, then `npm install` again.

**`PrismaClientInitializationError: Environment variable not found: DATABASE_URL`**
You missed `cp .env.example .env`. Fill in `DATABASE_URL` and `DIRECT_URL`.

**Login never lands on the dashboard**
The `lnd_session` cookie must be allowed. Safari blocks some localhost cookies in Private mode — try Chrome or a normal window.

**Seed fails with unique constraint errors**
Run `npm run db:reset` to drop and re-seed from a clean slate.

**"Ask Zoe" returns an error**
`ANTHROPIC_API_KEY` is missing or invalid. Check the terminal for the exact error.

**OTP code never appears**
Check the server terminal — it prints `[DEV] OTP for <identifier>: <code>` when `OTP_DEV_MODE=true`. The `/api/auth/send-otp` response also includes it as `devCode`.
