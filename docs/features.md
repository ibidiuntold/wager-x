# Features

## Wagering

### P2P Wagers
Users wager against each other. The pool grows as more participants join. On resolution, winners receive a proportional share of the total pool minus the platform fee.

- **Create:** `/wagers/create` — multi-step form (title, category, options, expiry, minimum entry)
- **Browse:** `/wagers` — filterable by category, status, search term; sorted by pool size
- **Join:** `POST /api/wager-participants` — atomic transaction: balance check → insert participant → update pool → debit user balance → insert WagerDebit transaction record
- **Resolve:** Admin or creator selects winning option. `resolveWagerService` runs an atomic ResolutionTransaction: lock wager → validate → credit winners → award game points → insert WagerCredit records → create settlement → mark complete.
- **Cashout:** Participant can exit an open P2P wager (20% fee). Not available on event wagers.
- **Increase Bet:** Participant can increase their stake on an open wager.

### Event Wagers
Created by admins with fixed odds per option. Each option has an explicit `odds` multiplier stored in the `wagers.options` JSON column.

- `wagerType = 'event'` in the database
- `oddsAtBet` captured per participant at join time (stored in `wager_participants.oddsAtBet`)
- Payout: `stake × oddsAtBet × (1 - platformFeeRate)` per winner
- Platform fee: `SUM(winner gross payouts) × feeRate`
- Cashout button is hidden for event wagers

### Wager Cards & Detail
- `WagerCard` — shows pool, status badge, EVENT badge for event wagers, per-option odds pills for event wagers
- `WagerDetails` — full wager page with `BettingOptions` component, bet amount input, pool info sidebar, recent participants, comment section
- `BettingOptions` — P2P mode shows "Est. Return" (live implied return from pool ratios); event mode shows `<odds>x`

---

## Wallet & Payments

See [payments.md](./payments.md) for Paystack integration details.

- **Balance fields:** `users.balance` (withdrawable) + `users.walletBonus` (non-withdrawable bonus)
- **Deposit:** Paystack popup → webhook verification → credit `users.balance`
- **Withdrawal:** User submits bank details → admin reviews → admin approves → balance debited
- **Transaction types:** `deposit`, `withdrawal`, `bonus`, `refund`, `wager_debit`, `wager_credit`
- **Wallet Modal:** Tabs for Deposit / Withdraw / History. Available from navbar balance button and mobile sidebar.
- **Navbar balance:** Shows `balance + walletBonus` from `/api/users/balance`. Refresh button.

---

## Leaderboard

- **Global tab:** All-time `totalWinnings` DESC, top 50
- **Weekly tab:** `weeklyWinnings` DESC, resets every Monday 00:00 WAT via cron job. Shows `isEmpty` state when no wager has resolved since last reset.
- **Friends tab:** Accepts friends + current user, sorted by `totalWinnings`. Requires JWT auth.
- **Pinned row:** If authenticated user's rank > 50, their row is pinned at the bottom of the list.
- **Tier badges:** Bronze (0–99 pts) · Silver (100–499) · Gold (500–999) · Platinum (1000–4999) · Diamond (5000+)
- **Counters updated on resolution:** `totalWinnings`, `weeklyWinnings` (winners only); `wagersPlayed`, `weeklyWagerCount` (all participants)

Page: `/leaderboard`. Widget: `LeaderboardWidget` on homepage (client component, fetches `/api/leaderboard?type=global&limit=5`).

---

## Friend Management

- **Send request:** `POST /api/friends` — checks for self-request and duplicate. Sends notification to addressee.
- **Accept / Reject:** `PUT /api/friends/[id]` — addressee only
- **Unfriend / Cancel:** `DELETE /api/friends/[id]` — either party
- **List:** `GET /api/friends` (accepted), `?type=requests` (incoming), `?type=sent` (outgoing)
- **FriendsView:** `/friends` — three tabs: My Friends, Requests (with badge count), Sent
- **FriendshipButton:** Shown on profile pages when viewing another user (`/profile?userId=<id>`). Three states: Add Friend → Cancel Request → Unfriend.
- **InviteFriendsModal:** Wager invite modal calls `GET /api/friends` and maps `friendNickname` / `friendAvatarUrl`.

---

## Profile & Settings

- **View:** Name, nickname, email, phone, wallet balance (formatted as `₦X,XXX.XX` with bonus breakdown)
- **Edit:** `ProfileEditForm` — first name, last name, nickname (with availability check), phone number
- **Change Password:** `PasswordChangeForm`
- **Admin link:** Visible in profile header and navbar dropdown when `role === 'admin'`
- **Other user profile:** `/profile?userId=<id>` shows FriendshipButton instead of Edit button

---

## Notifications

- **Bell icon** in navbar — shows unread count badge
- **Dropdown** — list of recent notifications with title, message, optional action button
- **Types:** System messages, friend requests, wager events, broadcasts
- **Friend request notifications** include `buttonLink: /profile?userId=<requesterId>` and `buttonText: View Request`
- **Admin broadcast:** From `/admin/notifications` — can target all users or specific roles

---

## Comments & Social

- Comment on any wager (`CommentSection`)
- Reply to comments (`ReplySection`)
- Like comments and replies (`LikeButton`)
- Comment count shown on wager pages

---

## Game Points & Tiers

- Earned on every wager resolution
- **Formula:** `basePoints = Math.floor(participantAmount / 100)`; losers get `basePoints`; winners get `basePoints × 3`
- Even `basePoints === 0` results in an UPDATE (idempotent)
- Tier badge computed client-side by `computeTier(gamePoints)` in `LeaderboardView.tsx`

---

## Referrals

- Each user gets a unique `referralCode` at registration
- Referral landing: `/ref/[code]`
- Bonus credited on successful sign-up via referral
- Admin can view full referral chains at `/admin/referrals`

---

## About Page

Dedicated component at `app/about/AboutPage.tsx` (Option A — not using generic renderer). Sections:

- Hero with gradient + dot-grid pattern
- Stats bar (50K+ users, ₦2B+ wagered, 99.9% uptime, 24/7 support)
- Our Story — two-column with visual cards
- Mission + three pillars (Fair Play, Instant Payouts, Community First)
- What Sets Us Apart — checklist
- Our Values — 2×2 grid (Integrity, Inclusion, Innovation, Responsibility)
- Our Team — three member cards with gradient avatars
- Community Engagement + Regulatory Compliance
- Looking Ahead — roadmap grid
- CTA banner — auth-aware (Create Account for guests, Browse Wagers for logged-in users)
