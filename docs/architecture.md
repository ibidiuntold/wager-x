# Architecture

## Runtime Model

WagerX does **not** use `next start`. It wraps Next.js inside an Express server (`server.ts`):

```
node server.ts (ts-node)
  └── Express app
        ├── cron: checkAndCloseExpiredWagers()  — every minute
        ├── cron: resetWeeklyLeaderboard()       — every Monday 00:00 WAT
        └── catch-all → Next.js handle()
```

This is required for:
- `node-cron` jobs that run in the same process as the server
- Future Socket.io integration for real-time game sessions

## Request Lifecycle

```
Browser
  → Navbar / page component
  → fetch('/api/...')
  → Next.js App Router API route (app/api/...)
      → getToken({ req, secret }) — JWT auth check
      → Service function (services/*)
          → pool.query() / pool.getConnection()
          → MySQL
      → NextResponse.json(...)
  → Component state update
```

## Provider Stack (app/layout.tsx)

From outermost to innermost at runtime:

```
SessionProvider (next-auth)
  └── ReactQueryProvider (TanStack Query)
        └── ToastProvider
              └── ThemeProvider
                    ├── AnimatedTitle
                    └── Suspense
                          └── NotificationProvider
                                └── {children}
                                └── PushNotificationPrompt
                          └── CookieConsentDialog
              └── Toaster
        └── Analytics (Vercel)
```

## Auth Architecture

See [auth.md](./auth.md). Short version:

- NextAuth Credentials provider reads `users` table via `mysql2`
- `bcryptjs` password comparison
- JWT strategy — token carries `id`, `role`, and all profile fields
- `session.user` is typed in `types/next-auth.d.ts` (module augmentation)
- API routes guard with `getToken({ req, secret: process.env.NEXTAUTH_SECRET })`

## Database Connection

`lib/mysql.ts` exports a singleton `mysql2/promise` connection pool. All service files import `pool` from this module. Multi-statement writes use `pool.getConnection()` with explicit `BEGIN`/`COMMIT`/`ROLLBACK`.

## Service Layer

All business logic lives in `services/`. Services are plain async functions — no classes. They receive typed inputs and return typed outputs. They never import Next.js types.

| Service | Responsibility |
|---|---|
| `wagerService.ts` | CRUD, `resolveWagerService` (atomic payout), `checkAndCloseExpiredWagers` |
| `wagerParticipantService.ts` | Join wager (atomic), increase bet, cashout |
| `userService.ts` | CRUD, balance, filtered list |
| `transactionService.ts` | Insert transaction records |
| `settlementService.ts` | Create settlement + settled_users rows |
| `notificationService.ts` | Create/update/delete notifications |
| `friendshipService.ts` | Full friendship CRUD + list queries |
| `paystackService.ts` | Payment initialization and verification |
| `bonusService.ts` | Bonus lifecycle |
| `referralService.ts` | Referral tracking |
| `commentService.ts` / `replyService.ts` / `likeService.ts` | Social layer |
| `adminSettingsService.ts` | Read/write `admin_settings` JSON blob |
| `emailService.ts` | Nodemailer / Resend wrappers |

## State Management

| Concern | Solution |
|---|---|
| Server data (wagers, users) | TanStack Query (`lib/queryClient.tsx`) |
| Auth session | NextAuth `useSession()` |
| Theme | `ThemeContext` (localStorage + class toggle) |
| Notifications | `NotificationContext` |
| Game sessions | Redux Toolkit + Socket.io (game-specific) |
| UI overlays | `UIContext` |
| Wager creation flow | `WagerContext` |

## Directory Map

```
app/
  (user routes)    — page.tsx files, layouts, client/server components
  admin/           — protected by AdminAuthWrapper + RoleGuard
  api/             — all REST endpoints

components/
  admin/           — admin-specific UI components
  auth/            — registration, login, guards
  common/          — shared: wallet, profile widgets, sidebar items
  dashboard/       — layout header/sidebar for admin dash
  friends/         — FriendsView, FriendshipButton
  games/           — game session UI
  leaderboard/     — LeaderboardView, LeaderboardWidget
  layouts/         — MainLayout, DashboardLayout, GameLayout
  main/            — homepage sections
  navbar/          — top navigation bar
  notification/    — bell, dropdown
  ui/              — ShadCN/Radix primitives (34 files)
  wagers/          — wager list, card, details, forms, modals
  Sidebar.tsx      — mobile slide-out nav

services/          — business logic (22 files, pure async functions)
hooks/             — React hooks (29 + 9 admin)
types/             — TypeScript interfaces (11 files)
lib/               — DB pool, cron, utils, config (22 + subdirs)
contexts/          — React Context providers (7)
database/          — schema.sql (20 tables)
.kiro/             — Kiro IDE specs and steering files
docs/              — This documentation
```
