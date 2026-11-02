# Changelog

All notable changes made during the active development session are recorded here. Entries are grouped by area.

---

## Database

- **v1.2** — `wagerType ENUM('p2p','event')` added to `wagers` (default `'p2p'`)
- **v1.3** — `totalWinnings`, `wagersPlayed`, `weeklyWinnings`, `weeklyWagerCount` added to `users`
- **v1.4** — `oddsAtBet DECIMAL(5,2)` added to `wager_participants` (default `1.00`)
- **v1.5** — `friendships` table created with UNIQUE constraint on `(requesterId, addresseeId)`

---

## Services

- `wagerParticipantService.ts` — `createWagerParticipant` fully rewritten as atomic transaction. Added `oddsAtBet` capture from wager options at join time.
- `wagerService.ts` — `resolveWagerService` fully rewritten as atomic transaction. Added leaderboard counter increments (`totalWinnings`, `weeklyWinnings`, `wagersPlayed`, `weeklyWagerCount`). Added event payout path (`amount × oddsAtBet × (1 - feeRate)`). Added `wagersPlayed` / `weeklyWagerCount` batch UPDATE.
- `wagerService.ts` — `createWager` now persists `wagerType`.
- `wagerService.ts` — `getFilteredWagers` includes `w.wagerType` in SELECT.
- `notificationService.ts` — `createNotification` now accepts caller-supplied `buttonLink` and `buttonText`.
- `userService.ts` — `getUserBalance` now SELECTs `walletBonus` alongside `balance`.
- `friendshipService.ts` — **NEW** — full friendship CRUD service.

---

## API Routes

- `app/api/wagers/route.ts` — Added JWT guards to POST, PUT, DELETE. `creatorId` always set from `token.sub`.
- `app/api/wager-participants/route.ts` — Added JWT guard. `userId` always set from `token.sub`.
- `app/api/leaderboard/route.ts` — **NEW** — global/weekly/friends leaderboard.
- `app/api/friends/route.ts` — **NEW** — send/list friend requests.
- `app/api/friends/[id]/route.ts` — **NEW** — accept/reject/delete friendship.
- `app/api/users/balance/route.ts` — Now returns `walletBonus` and `totalBalance` alongside `walletBalance`.

---

## Components

### New
- `components/leaderboard/LeaderboardView.tsx` — Full leaderboard page with tabs, tier badges, ranked rows, pinned self-row
- `components/leaderboard/LeaderboardWidget.tsx` — Homepage top-5 widget (client component, `useEffect` fetch)
- `components/friends/FriendsView.tsx` — 3-tab friends management UI
- `components/friends/FriendshipButton.tsx` — 3-state profile button
- `app/about/AboutPage.tsx` — Dedicated About page component (Hero, stats, story, mission, values, team, CTA)
- `app/leaderboard/page.tsx`
- `app/friends/page.tsx`

### Modified
- `components/wagers/BettingOptions.tsx` — New props (`wagerType`, `userStake`, `totalStakePerOption`). P2P shows "Est. Return", event shows `<odds>x`.
- `components/wagers/WagerDetails.tsx` — Wires new BettingOptions props. Fetches `platformFeeRate`. Derives `oddsAtBet`. Passes all to `BetConfirmationModal`. CTA button contrast fixed (`bg-purple-400` → `bg-purple-600`).
- `components/wagers/modals/BetConfirmationModal.tsx` — New optional props (`wagerType`, `oddsAtBet`, `platformFeeRate`). Event layout with odds line, calculated return, fee disclaimer.
- `components/wagers/UserWagerActions.tsx` — Cashout button hidden for event wagers.
- `components/wagers/WagerCard.tsx` — EVENT amber badge, per-option odds pills.
- `components/admin/AddWagerModal.tsx` — `wagerType` selector. Conditional odds input.
- `components/admin/Header.tsx` — Replaced Firebase/site-data.json with live `useSession()`.
- `components/navbar/Navbar.tsx` — "Admin Panel" link in dropdown for admin users.
- `components/Sidebar.tsx` — "Admin Panel" link for admin users. Removed dead Firebase role check.
- `components/dashboard/Sidebar.tsx` — Replaced Firebase Firestore admin check with `useSession()`.
- `components/common/ProfileSettings.tsx` — Balance formatted as `₦X,XXX.XX`. Nickname shown. Heading color fixed. `FriendshipButton` on `?userId=` param.
- `components/common/DepositModal.tsx` — Light/dark theme fixes.
- `components/common/NotificationModal.tsx` — Light/dark theme fixes.
- `components/common/Level.tsx` — Gradient fade fixed (`to-white` → `to-gray-100`). Expanded panel bg fixed.
- `components/common/SideWagers.tsx` — Gradient typo fixed (`reds-700` → `red-700`). List item bg fixed.
- `components/common/SideTask.tsx` — List item bg fixed.
- `components/common/SideProfile.tsx` — Copy button color inverted issue fixed.
- `components/wagers/PopularWagersLeaderboard.tsx` — Skeleton bg, hover state, meta text all fixed.
- `components/main/HowItWorks.tsx` — MobileStep `bg-black` → `bg-white dark:bg-gray-900`. Description text color fixed (3 instances).
- `components/main/CtaSection.tsx` — "Create Account" replaced with "View Profile" for authenticated users.
- `components/leaderboard/LeaderboardWidget.tsx` — Converted from async server component to client component with `useEffect` (required because parent is a client component).

---

## Hooks

- `hooks/useUserData.ts` — Fixed fetch URL from `/api/users?id=` to `/api/users/user?id=`. Added `status === 'loading'` guard to prevent premature bail-out.
- `hooks/useBalances.ts` — Fixed fetch URL from `/api/users?id=` to `/api/users/balance?userId=`. Now sums `walletBalance + walletBonus`.
- `hooks/useWalletData.ts` — No change required (already called correct endpoint).

---

## Types

- `types/next-auth.d.ts` — **NEW** — Module augmentation for `Session["user"]`, `User`, and `JWT` interfaces. Adds `id`, `role`, and all profile fields.
- `types/game.types.ts` — `Wager` interface extended with `wagerType`, `isResolved`, `creatorId`. `options.odds` made optional. `status` union includes `'closed'`. Date fields accept `string | { toDate() }`.

---

## Library / Config

- `lib/cron.ts` — Weekly leaderboard reset job added (`0 0 * * 1` WAT timezone).

---

## Steering Files

- `.kiro/steering/theme-light-dark.md` — **NEW** — Full light/dark mode pattern reference with anti-pattern table.
- `.kiro/steering/investigation-rules.md` — **NEW** — API route investigation rules. Framer Motion `Variants` type rule. Dynamic icon component rule added.

---

## Documentation

- `README.md` — Full rewrite with project overview, stack, getting started, structure summary, and links to `/docs/`.
- `docs/architecture.md` — Runtime model, provider stack, service layer, state management.
- `docs/features.md` — All user-facing and admin features.
- `docs/database.md` — All 20 tables with column details and migration history.
- `docs/api.md` — All API endpoints with auth requirements.
- `docs/auth.md` — NextAuth setup, session shape, guards, admin access.
- `docs/admin.md` — Admin panel structure, settings, security.
- `docs/payments.md` — Paystack integration, webhook, transaction records, fee model.
- `docs/specs.md` — Full implementation history for both specs.
- `docs/changelog.md` — This file.

---

## Notification Dropdown Viewport Fix

### Components
- `components/notification/NotificationDropdown.tsx` — Fixed dropdown overflow beyond viewport edges. Position calculation now checks whether right-aligning the 320px panel would clip past the left edge; if so, switches to `left` alignment. Both `left` and `right` values are clamped to a minimum of `8px` from the viewport boundary so the panel never bleeds outside on any screen size or bell position (navbar, admin header, mobile sidebar).

---

## Mobile Responsiveness Fixes

### Components
- `app/admin/transactions/page.tsx` — Stats grid `grid-cols-4` → `grid-cols-2 md:grid-cols-4`. Filter bar `flex items-center` → `flex flex-col sm:flex-row` with `w-full sm:w-[250px]` search input. Broken `grid-cols-9` table replaced with `overflow-x-auto` scrollable container using explicit `grid-cols` template, truncated IDs, `min-w-[700px]` inner wrapper. Pagination stacks vertically on mobile.
- `app/admin/dashboard/page.tsx` — Both recent wagers and transactions tables wrapped in `overflow-x-auto` with `min-w-[420px]` / `min-w-[380px]` inner constraints. UUID cells truncated to 8 chars with `title` tooltip. CardContent padding responsive (`p-0 sm:p-6`).
- `components/admin/AdminNav.tsx` — Removed `ml-[240px]` margin push on the main content area when mobile sidebar drawer is open. The sidebar is `position: fixed`, so shifting content caused horizontal scroll.
- `components/admin/WagerManagement.tsx` — Progressive column hiding: Players/Active hidden below `sm`, Created hidden below `md`, Visibility hidden below `lg`. Table `min-w-full` → `min-w-[640px]`. Details button hidden below `sm`.
- `components/dashboard/Header.tsx` — Search input `flex-grow max-w-md` → `hidden sm:block` (was being crushed to zero width on mobile competing with 4 icons). Right-side icon group gets `shrink-0`. Padding `px-6 sm:px-10` → `px-3 sm:px-6`.
- `app/wagers/page.tsx` — Leaderboard sidebar `lg:col-span-4 lg:order-last` → `order-last lg:col-span-4 lg:order-last` so it renders below the wager list on mobile instead of above it.
- `components/wagers/WagerDetails.tsx` — Mobile comment section `md:hidden` → `lg:hidden` to fix the invisible gap on tablet screens (768–1024px) where neither desktop nor mobile comment section rendered.
- `components/wagers/WagerCard.tsx` — Category and EVENT badges wrapped in `pr-16` container to clear the absolute-positioned status badge in the top-right corner.
- `components/common/ProfileSettings.tsx` — User data section `ps-5` → `md:ps-5` so the left indent only applies when the layout is side-by-side, not when stacked vertically on mobile.

---

## Notification Broadcast Route

### API Routes
- `app/api/notifications/broadcast/route.ts` — **NEW** — Admin-only `POST` handler for broadcasting notifications. Calls `createNotification` with `userId: null` (global broadcast). Guards: JWT required, `role === 'admin'` required. Was missing entirely, causing `Unexpected token '<'` HTML 404 error when admin tried to send notifications.

---

## Insufficient Balance Error Clarity

### API Routes
- `app/api/wager-participants/route.ts` — Catch block now propagates the real error message instead of hardcoded `'Failed to create wager'`. Returns HTTP 402 specifically for `'Insufficient balance'` errors.

### Hooks
- `hooks/useWagerHooks.ts` — `placeBet` toast now shows "Insufficient Balance" title with actionable description ("You don't have enough funds to place this bet. Please top up your wallet and try again.") instead of generic "Error".

---

## Notification Dropdown Viewport Overflow

### Components
- `components/notification/NotificationDropdown.tsx` — Dropdown position calculation now checks whether right-aligning the 320px panel would clip past the left viewport edge; if so, switches to left alignment. Both `left` and `right` values clamped to minimum `8px` from viewport boundary.

---

## Notification Date Handling Fix

### Components
- `components/notification/NotificationDropdown.tsx` — `notification.createdAt.toDate()` (Firestore Timestamp method) replaced with defensive expression handling all three shapes: native JS `Date`, ISO string, and Firestore `{ toDate() }`.

### Contexts
- `contexts/NotificationContext.tsx` — `Notification.createdAt` type broadened from `Date` to `Date | string | { toDate: () => Date }`.

### Steering
- `.kiro/steering/investigation-rules.md` — Added "Date Handling: MySQL vs Firebase" section documenting the safe date normalisation pattern and type declaration rule.

---

## About Page — Framer Motion Variants Fix

### Components
- `app/about/AboutPage.tsx` — `fadeUp` variant typed as `Variants` from framer-motion (was untyped object). Dynamic icon components in `.map()` calls extracted to local `const Icon = item.icon` before JSX use. Fixed `<item.icon />`, `<p.icon />`, `<v.icon />` patterns that React treats as DOM elements.

### Steering
- `.kiro/steering/investigation-rules.md` — Added "Framer Motion Variants" section and "Dynamic icon components in maps" section documenting both rules.
