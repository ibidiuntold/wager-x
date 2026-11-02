# WagerX — Social Wagering Platform

> Nigeria's peer-to-peer wagering platform. Users predict outcomes, stake funds against each other, and winners split the pool. No house edge.

---

## Table of Contents

1. [Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [Getting Started](#getting-started)
4. [Project Structure](#project-structure)
5. [Features](#features)
6. [Database](#database)
7. [Authentication](#authentication)
8. [API Reference](#api-reference)
9. [Admin Panel](#admin-panel)
10. [Specs & Implementation History](#specs--implementation-history)
11. [Environment Variables](#environment-variables)
12. [Deployment](#deployment)

---

## Overview

WagerX is a **Next.js 15 App Router** application backed by **MySQL** and **NextAuth.js**. It allows users to:

- Create and join peer-to-peer wagers on any topic
- Participate in admin-created event wagers with fixed odds
- Manage a wallet with Paystack-powered deposits and withdrawals
- Build a social graph (friends, leaderboards, comments)
- Earn game points and tier badges based on wagering activity

Detailed feature documentation lives in [`docs/`](./docs/):

| Document | Covers |
|---|---|
| [Architecture](./docs/architecture.md) | Layers, data flow, server setup |
| [Features](./docs/features.md) | All user-facing features |
| [Database Schema](./docs/database.md) | All 20 tables with column details |
| [API Routes](./docs/api.md) | Every `/api/` endpoint |
| [Admin Panel](./docs/admin.md) | Admin dashboard, guards, settings |
| [Authentication](./docs/auth.md) | NextAuth config, session shape, guards |
| [Payments](./docs/payments.md) | Paystack integration, webhooks |
| [Specs History](./docs/specs.md) | wagerx-foundations & wagerx-features implementation records |
| [Changelog](./docs/changelog.md) | Running change log added during this session |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript 5 |
| Database | MySQL 8 via `mysql2` |
| Auth | NextAuth.js v4 (Credentials provider, JWT strategy) |
| Payments | Paystack (NGN deposits/withdrawals) |
| Styling | Tailwind CSS 3 + `class-variance-authority` + `clsx` |
| UI Components | Radix UI primitives + ShadCN wrappers |
| Animations | Framer Motion 14 |
| State (server) | TanStack Query v5 |
| State (client) | React Context + Redux Toolkit (game sessions) |
| Forms | React Hook Form + Zod |
| Charts | Recharts |
| Email | Nodemailer + Resend |
| Realtime | Socket.io (game sessions) |
| Cron | `node-cron` (wager expiry + weekly leaderboard reset) |
| Testing | Vitest |
| Legacy (partial) | Firebase (game session realtime; being phased out) |

---

## Getting Started

### Prerequisites

- Node.js 18+
- MySQL 8 running locally or remotely
- A Paystack account (test keys work for development)

### Installation

```bash
git clone <repo>
cd wager-games-pro
npm install
```

### Database Setup

Run the schema against your MySQL database:

```bash
mysql -u <user> -p <database> < database/schema.sql
```

The schema file is idempotent — it uses `CREATE TABLE IF NOT EXISTS` and `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`, so it is safe to re-run on an existing database.

### Environment Variables

Copy `.env.local.example` to `.env.local` and fill in all values. See [Environment Variables](#environment-variables) below for the full list.

### Development Server

```bash
npm run dev
```

Opens at [http://localhost:3000](http://localhost:3000).

### Production Server

WagerX uses a **custom Express wrapper** (`server.ts`) rather than plain `next start`. This is required for the cron jobs and Socket.io support.

```bash
npm run build
npm run start        # runs: NODE_ENV=production ts-node server.ts
```

---

## Project Structure

```
wager-games-pro/
├── app/                        # Next.js App Router
│   ├── (user pages)            # about, auth, friends, leaderboard, profile, wagers…
│   ├── admin/                  # Admin dashboard pages
│   ├── api/                    # API route handlers
│   ├── layout.tsx              # Root layout + provider stack
│   ├── page.tsx                # Homepage
│   └── globals.css
├── components/
│   ├── admin/                  # Admin-specific UI
│   ├── auth/                   # Login, register, guards
│   ├── common/                 # Shared UI (wallet, profile, sidebar widgets)
│   ├── dashboard/              # Dashboard layout header/sidebar
│   ├── friends/                # FriendsView, FriendshipButton
│   ├── leaderboard/            # LeaderboardView, LeaderboardWidget
│   ├── main/                   # Homepage sections (Hero, HowItWorks, CtaSection…)
│   ├── navbar/                 # Top navigation
│   ├── notification/           # Notification bell + dropdown
│   ├── ui/                     # ShadCN primitives (34 components)
│   ├── wagers/                 # Wager cards, details, modals, forms
│   └── Sidebar.tsx             # Mobile slide-out navigation
├── services/                   # Business logic (22 service files)
├── hooks/                      # React hooks (29 root + 9 admin)
├── types/                      # TypeScript interfaces (11 files)
├── lib/                        # Utilities, DB pool, cron, config
├── contexts/                   # React Context providers (7)
├── database/
│   └── schema.sql              # Full MySQL schema (20 tables)
├── server.ts                   # Custom Express/Node server
├── .kiro/
│   ├── specs/                  # Feature specs (requirements → design → tasks)
│   └── steering/               # Persistent AI coding rules
└── docs/                       # Extended documentation (this session)
```

Full directory details: [Architecture doc](./docs/architecture.md).

---

## Features

See [docs/features.md](./docs/features.md) for full details. Summary:

### User Features
- **Wagers** — Browse, create, join P2P and event wagers. Bet amount tracked per participant. Winners receive proportional pool share minus platform fee.
- **Wallet** — Paystack-powered deposits. Admin-reviewed withdrawals. Separate `balance` and `walletBonus` columns. Full transaction history.
- **Leaderboard** — Global (all-time), Weekly (resets every Monday WAT), Friends tab. Tier badges: Bronze → Silver → Gold → Platinum → Diamond.
- **Friends** — Send/accept/reject/cancel friend requests. Incoming request badge count. Friend list used in leaderboard and wager invites.
- **Profile** — Edit name, nickname, phone, avatar. Change password. View wallet balance. Admin link visible for admin accounts.
- **Notifications** — Bell icon with unread count. Dropdown list. Push notification prompt.
- **Comments & Likes** — Comment on wagers, reply to comments, like comments/replies.
- **Referrals** — Unique referral code per user. Bonus credited on successful referral.
- **Game Points** — Earned on every wager resolution (win = 3× base, loss = 1× base). Drives tier badge.

### Admin Features
- **Dashboard** — Stats overview (users, wagers, transactions).
- **User Management** — View, filter, update status, suspend/ban.
- **Wager Management** — Create event wagers with fixed odds, manage P2P wagers.
- **Transactions** — View all deposits and withdrawals. Approve withdrawal requests.
- **Settlements** — Track wager resolution payouts.
- **Bonuses** — Create and assign bonus rules.
- **Referrals** — View referral chains and payouts.
- **Notifications** — Broadcast to all users or specific groups.
- **Newsletter** — Manage subscriber list, send campaigns.
- **Site Settings** — Platform fee rate, fee account, payment gateways, SMTP, SEO, social links.

---

## Database

See [docs/database.md](./docs/database.md) for full column-level documentation.

**Tables (20):**
`users` · `games` · `wagers` · `wager_participants` · `game_sessions` · `transactions` · `settlements` · `settled_users` · `bonuses` · `bonus_users` · `referrals` · `notifications` · `comments` · `replies` · `likes` · `subscribers` · `mailing_settings` · `bank_details` · `admin_settings` · `friendships`

Schema is at `database/schema.sql`. Migrations are appended at the bottom of that file under a `-- MIGRATIONS` comment block using `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`.

---

## Authentication

See [docs/auth.md](./docs/auth.md).

- **Provider:** NextAuth.js v4, Credentials strategy, JWT session
- **Token fields:** `id`, `role`, `firstName`, `lastName`, `dob`, `nickname`, `phoneNumber`, `avatarUrl`, `referralCode`, `status`
- **Session shape** declared in `types/next-auth.d.ts`
- **Admin access:** Navigate to `/admin/login` or use the Admin Panel link in the navbar dropdown (visible when `session.user.role === 'admin'`)
- **Role guard:** `components/auth/RoleGuard.tsx` + `components/admin/AdminAuthWrapper.tsx`

---

## API Reference

See [docs/api.md](./docs/api.md) for the full endpoint listing.

Key route groups:

| Group | Base Path | Auth Required |
|---|---|---|
| Auth | `/api/auth/[...nextauth]` | — |
| Users | `/api/users/*` | JWT |
| Wagers | `/api/wagers` | JWT (mutating) |
| Wager Participants | `/api/wager-participants` | JWT |
| Friends | `/api/friends`, `/api/friends/[id]` | JWT |
| Leaderboard | `/api/leaderboard` | JWT (friends tab only) |
| Payments | `/api/payment/*` | JWT |
| Notifications | `/api/notifications` | JWT |
| Admin Settings | `/api/admin/settings` | Admin JWT |
| Webhooks | `/api/webhooks/paystack` | Paystack signature |

---

## Admin Panel

See [docs/admin.md](./docs/admin.md).

**Entry points:**
- Direct URL: `/admin/login` (dedicated admin login form)
- Navbar dropdown: "Admin Panel" link (shown when `role === 'admin'`)
- Mobile sidebar: "Admin Panel" link (purple, shown when `role === 'admin'`)

**Sidebar nav items** (from `lib/admin/config.ts`):
Dashboard · Users · Wagers · Notifications · Newsletter · Payments · Bonuses · Referrals · **Site Settings**

Site Settings (`/admin/settings`) configures: platform fee rate, fee account, Paystack keys, Flutterwave keys, SMTP, SEO, social links, and system toggles.

---

## Specs & Implementation History

See [docs/specs.md](./docs/specs.md).

Two feature specs live in `.kiro/specs/`:

| Spec | Summary |
|---|---|
| `wagerx-foundations` | Atomic DB transactions, transaction records, API auth guards, gamePoints on resolution, BettingOptions wager-type split |
| `wagerx-features` | Leaderboard, admin event wagers with odds, friend management, event wager UI |

All non-optional tasks in both specs are complete. Optional property-based tests are deferred.

---

## Environment Variables

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` or `DB_*` | ✅ | MySQL connection |
| `NEXTAUTH_SECRET` | ✅ | JWT signing key |
| `NEXTAUTH_URL` | ✅ | Canonical app URL |
| `NEXT_PUBLIC_APP_URL` | ✅ | Client-accessible base URL |
| `PAYSTACK_SECRET_KEY` | ✅ | Paystack server-side key |
| `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` | ✅ | Paystack client-side key |
| `FLUTTERWAVE_SECRET_KEY` | ⚠️ Optional | Flutterwave payments |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` | ⚠️ Optional | Email via Nodemailer |
| `RESEND_API_KEY` | ⚠️ Optional | Email via Resend |
| `FIREBASE_*` | ⚠️ Legacy | Game session realtime (being phased out) |

---

## Deployment

1. Ensure MySQL is accessible from the deployment environment
2. Run the schema: `mysql ... < database/schema.sql`
3. Set all required environment variables
4. `npm run build`
5. `npm run start` (uses `ts-node server.ts` — Express wrapper, not plain `next start`)

The custom server is mandatory because it hosts the Socket.io instance and registers cron jobs (wager expiry every minute, weekly leaderboard reset every Monday 00:00 WAT).

---

*Documentation generated during active development session. For changes made after this session, see [docs/changelog.md](./docs/changelog.md).*
