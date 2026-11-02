# Specs & Implementation History

Two feature specs were designed and implemented using Kiro's structured spec workflow (requirements → design → tasks).

Spec files live in `.kiro/specs/`.

---

## wagerx-foundations

**Summary:** Five targeted hardening changes to make the core platform production-safe.

### Areas

| # | Area | Files |
|---|---|---|
| 1 | Atomic DB transactions | `services/wagerParticipantService.ts`, `services/wagerService.ts` |
| 2 | Transaction record completeness | Same as above |
| 3 | API authentication guards | `app/api/wagers/route.ts`, `app/api/wager-participants/route.ts` |
| 4 | gamePoints on resolution | `services/wagerService.ts` |
| 5 | BettingOptions wager-type split | `database/schema.sql`, `services/wagerService.ts`, `components/wagers/BettingOptions.tsx`, `components/wagers/WagerDetails.tsx` |

### Key Changes Made

**Atomic participant join (`createWagerParticipant`):**
- Replaced sequential `pool.query` calls with a dedicated connection (`pool.getConnection()`)
- `BEGIN` → balance check (`FOR UPDATE`) → insert participant → update pool → debit balance → insert WagerDebit transaction → `COMMIT`
- Rollback on any failure. `conn.release()` in `finally` block always executes.

**Atomic wager resolution (`resolveWagerService`):**
- Full `AtomicResolutionTransaction` on a dedicated connection
- Locks wager and participant rows with `FOR UPDATE`
- Reads `admin_settings` for `platformFeeRate` and `platformFeeAccountId`
- Credits winners (proportional for P2P, `amount × oddsAtBet × (1-feeRate)` for event)
- Awards `gamePoints`: losers get `Math.floor(amount/100)`, winners get `× 3`
- Increments `totalWinnings`, `weeklyWinnings`, `wagersPlayed`, `weeklyWagerCount`
- Inserts WagerCredit and optional PlatformFee transactions
- Creates settlement and settled_users rows atomically

**API authentication:**
- `POST /api/wagers`, `PUT /api/wagers`, `DELETE /api/wagers`, `POST /api/wager-participants` all now require JWT
- `creatorId` and `userId` are always set from `token.sub`, never from request body

**wagerType column:**
- `ALTER TABLE wagers ADD COLUMN IF NOT EXISTS wagerType ENUM('p2p','event') NOT NULL DEFAULT 'p2p'`
- `getFilteredWagers` includes `w.wagerType` in SELECT
- `createWager` persists `wagerType` (defaults to `'p2p'`)

**BettingOptions component:**
- New props: `wagerType`, `userStake`, `totalStakePerOption`
- P2P mode: shows "Est. Return" = `(userStake / totalStakeOnOption) × totalPool`
- Event mode: shows `{odds}x` under "Odds" label
- `WagerDetails` derives `totalStakePerOption` via `useMemo` and passes it down

### Status
All non-optional tasks complete. Optional property-based tests deferred.

---

## wagerx-features

**Summary:** Four new platform features built on top of the foundations.

### Feature A — Leaderboard

**Schema additions (`users` table):**
- `totalWinnings DECIMAL(15,2)` — all-time leaderboard
- `wagersPlayed INT` — total wagers resolved
- `weeklyWinnings DECIMAL(15,2)` — weekly leaderboard
- `weeklyWagerCount INT` — weekly wagers

**New files:**
- `app/api/leaderboard/route.ts` — GET with `type=global|weekly|friends`
- `components/leaderboard/LeaderboardView.tsx` — `computeTier()`, `assignRanks()`, tabs, pinned row
- `components/leaderboard/LeaderboardWidget.tsx` — homepage top-5 widget (client component)
- `app/leaderboard/page.tsx`

**Weekly reset:** `lib/cron.ts` extended with `cron.schedule("0 0 * * 1", ...)` resetting `weeklyWinnings` and `weeklyWagerCount` for all users every Monday 00:00 WAT.

---

### Feature B — Admin Event Wagers with Odds

**Schema additions:**
- `wager_participants.oddsAtBet DECIMAL(5,2)` — odds frozen at join time

**Changes:**
- `AddWagerModal` — wagerType selector, conditional odds input (enabled for event wagers only)
- `createWagerParticipant` — reads wager's `options` JSON, captures `oddsAtBet` at join
- `resolveWagerService` — branches on `wagerType`: event payout uses `amount × oddsAtBet × (1-feeRate)`
- `WagerCard` — EVENT amber badge, per-option odds pills

---

### Feature C — Friend Management

**Schema additions:**
- `friendships` table (v1.5) — `requesterId`, `addresseeId`, `status ENUM('pending','accepted','rejected')`

**New files:**
- `services/friendshipService.ts` — full CRUD
- `app/api/friends/route.ts` — GET (accepted/requests/sent), POST (send request)
- `app/api/friends/[id]/route.ts` — PUT (accept/reject), DELETE (unfriend/cancel)
- `components/friends/FriendsView.tsx` — 3-tab UI
- `components/friends/FriendshipButton.tsx` — 3-state button on profile pages
- `app/friends/page.tsx`

**Service change:** `notificationService.createNotification` now accepts caller-supplied `buttonLink` and `buttonText` (previously hardcoded null). Friend request notifications use these to link to the requester's profile.

**InviteFriendsModal:** Updated from `/api/users/friends` (non-existent) to `/api/friends` with correct response mapping.

---

### Feature D — Event Wager UI

**Changes:**
- `BetConfirmationModal` — new optional props `wagerType`, `oddsAtBet`, `platformFeeRate`. Event layout shows odds, calculated return, and fee disclaimer.
- `WagerDetails` — fetches `platformFeeRate` from `/api/settings`, derives `oddsAtBet` from selected option, passes all three to `BetConfirmationModal`.
- `UserWagerActions` — Cashout button hidden for `wagerType === 'event'`.

---

### Status
All non-optional tasks complete. Optional property-based tests deferred.

---

## types/next-auth.d.ts

Added during this session. Without it, `session.user.id` was `undefined` at runtime because NextAuth's default `User` type doesn't include `id`. The module augmentation declares `id`, `role`, and all profile fields on both `Session["user"]` and `JWT`.

---

## useUserData Fix

`hooks/useUserData.ts` was calling `GET /api/users?id=...` which hits the user list route (returns different data structure). Fixed to call `GET /api/users/user?id=...` which is the correct single-user endpoint returning `{ success: true, user: {...} }`.

Also added `if (status === 'loading') return` guard in the `useEffect` to prevent premature bail-out before the NextAuth session resolves.

---

## Admin Panel Access Fix

`components/dashboard/Sidebar.tsx` was using Firebase Firestore to check admin role — which silently failed since the project uses MySQL/NextAuth. Replaced with `useSession()` role check.

Added "Admin Panel" links to:
- Desktop navbar dropdown (`components/navbar/Navbar.tsx`)
- Mobile sidebar (`components/Sidebar.tsx`)

Both conditioned on `role === 'admin'` from the NextAuth session.
