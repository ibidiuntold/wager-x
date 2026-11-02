# Implementation Plan: WagerX Features

## Overview

Four feature groups implemented on top of the wagerx-foundations base: Leaderboard (global, weekly, friends), Admin Event Wagers with Odds, Friend Management, and Event Wager UI (BetConfirmationModal + cashout suppression). All code is TypeScript/React following the existing Next.js App Router structure.

## Tasks

---

### Feature A — Leaderboard

- [x] A1. Schema migration — leaderboard columns on `users`
  - [x] A1.1 Add leaderboard columns to `users` table
    - Add `totalWinnings DECIMAL(15,2) NOT NULL DEFAULT 0.00`, `wagersPlayed INT NOT NULL DEFAULT 0`, `weeklyWinnings DECIMAL(15,2) NOT NULL DEFAULT 0.00`, `weeklyWagerCount INT NOT NULL DEFAULT 0` to `database/schema.sql` using `ALTER TABLE … ADD COLUMN IF NOT EXISTS`
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [ ]* A1.2 Write unit tests for the leaderboard migration SQL
    - Verify all four columns are added idempotently (run twice, no error)
    - _Requirements: 1.1–1.4_

- [x] A2. Update `resolveWagerService` to increment leaderboard counters
  - [ ] A2.1 Introduce `conn` (getConnection) pattern in `resolveWagerService`
    - Refactor the existing `resolveWagerService` in `services/wagerService.ts` to use `pool.getConnection()` / `beginTransaction` / `commit` / `rollback` / `release` so all steps run atomically
    - _Requirements: 1.5, 1.6_

  - [ ] A2.2 Increment `totalWinnings` and `weeklyWinnings` per winner
    - Inside the winner loop (after `UPDATE users SET balance = balance + ?`), add a second UPDATE for `totalWinnings = totalWinnings + ?` and `weeklyWinnings = weeklyWinnings + ?` using `netPayout` (the same variable used for the balance credit)
    - _Requirements: 1.5_

  - [ ] A2.3 Increment `wagersPlayed` and `weeklyWagerCount` for all participants
    - After the winner loop, build the `participantIds` array from `participants` and run one batch `UPDATE users SET wagersPlayed = wagersPlayed + 1, weeklyWagerCount = weeklyWagerCount + 1 WHERE id IN (?)` inside the same transaction
    - _Requirements: 1.6_

  - [ ]* A2.4 Write property test for winner counter increment (Property 1)
    - **Property 1: Winner leaderboard counters increment correctly**
    - **Validates: Requirements 1.5**

  - [ ]* A2.5 Write property test for participant counter increment (Property 2)
    - **Property 2: Wagers-played counters increment for every participant**
    - **Validates: Requirements 1.6**

- [x] A3. Add weekly reset cron job to `lib/cron.ts`
  - [ ] A3.1 Extend `startCronJobs` with the weekly reset schedule
    - Import `pool` from `@/lib/mysql` and add `cron.schedule("0 0 * * 1", async () => { ... }, { timezone: "Africa/Lagos" })` inside `startCronJobs`
    - Log the count of `result.affectedRows` and execution timestamp on success; catch and log errors without re-throwing
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [ ]* A3.2 Write property test for weekly reset (Property 3)
    - **Property 3: Weekly reset zeroes all counters**
    - **Validates: Requirements 2.2**

- [x] A4. Create `GET /api/leaderboard` route
  - [ ] A4.1 Create `app/api/leaderboard/route.ts` with global and weekly handlers
    - Handle `type=global`: SELECT `id, nickname, avatarUrl, totalWinnings, wagersPlayed, gamePoints` ORDER BY `totalWinnings DESC` LIMIT 50
    - Handle `type=weekly`: same SELECT with `weeklyWinnings, weeklyWagerCount`, compute `isEmpty` flag when all `weeklyWinnings = 0`
    - Return HTTP 400 for absent/invalid `type` param
    - _Requirements: 3.1, 3.2, 3.4, 3.5_

  - [ ] A4.2 Add `friends` type with JWT auth guard
    - Use `getToken({ req, secret: process.env.NEXTAUTH_SECRET })`, return 401 if absent
    - UNION query: accepted friends via `friendships` table JOIN `users` plus the authenticated user row, ORDER BY `totalWinnings DESC`
    - Support optional `limit` query param (cap at 50)
    - _Requirements: 3.3_

  - [ ]* A4.3 Write property test for leaderboard ordering invariant (Property 4)
    - **Property 4: Leaderboard ordering invariant**
    - **Validates: Requirements 3.1, 3.2, 3.3**

- [x] A5. Create LeaderboardView component and sub-components
  - [ ] A5.1 Create `computeTier` pure function in `components/leaderboard/LeaderboardView.tsx`
    - Implement the tier thresholds: Bronze (<100), Silver (100–499), Gold (500–999), Platinum (1000–4999), Diamond (≥5000)
    - Export as a named function for testability
    - _Requirements: 4.4_

  - [ ]* A5.2 Write property test for `computeTier` (Property 5)
    - **Property 5: Tier badge is a pure function of gamePoints**
    - **Validates: Requirements 4.4**

  - [ ] A5.3 Create `assignRanks` pure function
    - Accept a pre-sorted descending array with a `rankScore` field, assign tied ranks using the standard competition ranking algorithm
    - _Requirements: 4.3_

  - [ ]* A5.4 Write property test for `assignRanks` (Property 6)
    - **Property 6: Tied-rank assignment**
    - **Validates: Requirements 4.3**

  - [ ] A5.5 Create `LeaderboardRow` and `TierBadge` sub-components
    - `TierBadge`: renders a colored pill using the label from `computeTier`
    - `LeaderboardRow`: displays rank, avatar, nickname, earnings (totalWinnings or weeklyWinnings), wagersPlayed/weeklyWagerCount, and TierBadge; applies distinct highlight class when `isCurrentUser === true`
    - _Requirements: 4.2, 4.6_

  - [ ] A5.6 Create `LeaderboardView` with tabs, fetch logic, and PinnedRow
    - Three tabs (Global, Weekly, Friends) using ShadCN `Tabs`; each tab calls `GET /api/leaderboard?type=X` on selection
    - Weekly empty state: when `isEmpty: true` is returned, show a WeeklyEmptyState message
    - Friends empty state: when friends array is empty, show invite-friends message
    - PinnedRow: if `selfEntry.rank > 50`, render the authenticated user's `LeaderboardRow` again at the bottom of the list
    - _Requirements: 4.1, 4.5, 4.7, 4.8_

  - [ ]* A5.7 Write property test for PinnedRow visibility (Property 7)
    - **Property 7: PinnedRow appears when and only when rank > 50**
    - **Validates: Requirements 4.5**

- [x] A6. Create `/leaderboard` page
  - [ ] A6.1 Create `app/leaderboard/page.tsx`
    - Wrap `LeaderboardView` in `LayoutSelector layoutType="main"`
    - _Requirements: 4.1_

- [x] A7. Create LeaderboardWidget and wire into homepage
  - [ ] A7.1 Create `components/leaderboard/LeaderboardWidget.tsx`
    - Async server component; fetch `GET /api/leaderboard?type=global&limit=5` with `{ next: { revalidate: 60 } }`; catch errors and render empty-state card ("Leaderboard coming soon") instead of throwing
    - Display top-5 users with rank, avatar, nickname, totalWinnings
    - _Requirements: 5.1, 5.2, 5.3_

  - [ ] A7.2 Import and render `LeaderboardWidget` in `app/page.tsx`
    - Wrap in `<ErrorBoundary>` and `<Suspense>` with a `LoadingSpinner` fallback, consistent with existing homepage section pattern
    - _Requirements: 5.1_

- [x] A8. Checkpoint — Leaderboard feature
  - Ensure all tests pass, ask the user if questions arise.

---

### Feature B — Admin Event Wagers

- [x] B1. Schema migration — `oddsAtBet` column on `wager_participants`
  - [ ] B1.1 Add `oddsAtBet` column to `wager_participants` in `database/schema.sql`
    - `ALTER TABLE wager_participants ADD COLUMN IF NOT EXISTS oddsAtBet DECIMAL(5,2) NOT NULL DEFAULT 1.00`
    - _Requirements: 7.1_

- [x] B2. Update `AddWagerModal` with wagerType selector and conditional odds input
  - [ ] B2.1 Add `wagerType` field to local state and render the type selector
    - Add `wagerType: 'p2p' as 'p2p' | 'event'` to the existing `useState` initializer in `components/admin/AddWagerModal.tsx`
    - Add a ShadCN `Select` above the options section with values `p2p` and `event`
    - _Requirements: 6.1_

  - [ ] B2.2 Enable odds inputs when `wagerType === 'event'`
    - Change the disabled odds `Input` to be `disabled={wager.wagerType === 'p2p'}` and update `onChange` to call `handleOptionChange`
    - Show the "Odds auto-calculated" helper text only when `wagerType === 'p2p'`; hide it for `event`
    - _Requirements: 6.2, 6.3_

  - [ ] B2.3 Include `wagerType` in POST body and update `createWager` service
    - Verify `handleSubmit` already spreads `wager` into the POST body (no route change needed)
    - In `services/wagerService.ts`, destructure `wagerType = 'p2p'` from `data` and add it to the `INSERT INTO wagers` statement and column list
    - _Requirements: 6.4, 6.5_

- [x] B3. Capture `oddsAtBet` in `createWagerParticipant`
  - [ ] B3.1 Read `wagerType` and `options` from the wager row and compute `oddsAtBet`
    - In `services/wagerParticipantService.ts`, after fetching the wager row, read `wagerType` and `parsedOptions`
    - For `event` wagers: find the matching option and read `.odds`; if absent/null, default to `1.00` and log a warning
    - For `p2p` wagers: `oddsAtBet = 1.00`
    - _Requirements: 7.2, 7.3, 7.4_

  - [ ] B3.2 Add `oddsAtBet` to the `INSERT INTO wager_participants` statement
    - Extend the INSERT in `createWagerParticipant` to include the `oddsAtBet` column and value
    - _Requirements: 7.2, 7.3_

  - [ ]* B3.3 Write property test for `oddsAtBet` round-trip (Property 9)
    - **Property 9: oddsAtBet round-trip for EventWager participants**
    - **Validates: Requirements 7.2, 7.3**

- [x] B4. Update `resolveWagerService` with EventWager payout path
  - [ ] B4.1 Read `wagerType` and branch on it in `resolveWagerService`
    - After fetching the locked wager row, read `wagerType` (default `'p2p'`)
    - Read `platformFeeRate` from `admin_settings.data` (fallback `0.05`)
    - Branch: `if (wagerType === 'event') { ... } else { /* existing P2P path */ }`
    - _Requirements: 8.4_

  - [ ] B4.2 Implement EventWager payout path
    - For each winner: compute `gross = amount × oddsAtBet`, `net = gross × (1 - feeRate)`, UPDATE balance + `totalWinnings` + `weeklyWinnings`, INSERT `wager_credit` transaction row, call `createSettledUser`
    - Compute `totalGrossWinnerPayout` for the fee row; if `settings.platformFeeAccountId` exists, credit fee and insert a platform fee transaction row
    - _Requirements: 8.1, 8.2, 8.5_

  - [ ]* B4.3 Write property test for EventWager NetPayout formula (Property 10)
    - **Property 10: EventWager NetPayout formula correctness**
    - **Validates: Requirements 8.1, 8.5**

  - [ ]* B4.4 Write property test for EventPlatformFee formula (Property 11)
    - **Property 11: EventPlatformFee formula correctness**
    - **Validates: Requirements 8.2**

  - [ ]* B4.5 Write property test for P2P path unchanged (Property 12)
    - **Property 12: P2P resolution path is unmodified**
    - **Validates: Requirements 8.3, 8.4**

- [x] B5. Update `WagerCard` with EVENT badge and per-option odds display
  - [ ] B5.1 Extend `WagerCardProps` with `wagerType` and typed `options`
    - Add `wagerType?: 'p2p' | 'event'` and `options?: Array<{ name: string; odds?: number }>` to the `wager` prop interface in `components/wagers/WagerCard.tsx`
    - _Requirements: 9.1, 9.2, 9.3_

  - [ ] B5.2 Render EVENT badge and per-option odds for event wagers
    - After the category badge, conditionally render the amber `EVENT` pill when `wagerType === 'event'`
    - Replace the static "Options" count cell with per-option `<name>: <value>x` pills when `wagerType === 'event'`; keep the count cell for P2P wagers
    - _Requirements: 9.1, 9.2, 9.3_

  - [ ]* B5.3 Write property test for WagerCard event badge (Property 8)
    - **Property 8: EventWager card renders EVENT badge and per-option odds**
    - **Validates: Requirements 9.1, 9.2, 9.3**

- [x] B6. Checkpoint — Event Wagers feature
  - Ensure all tests pass, ask the user if questions arise.

---

### Feature C — Friend Management

- [x] C1. Schema migration — `friendships` table
  - [ ] C1.1 Add `friendships` CREATE TABLE statement to `database/schema.sql`
    - Use `CREATE TABLE IF NOT EXISTS friendships` with columns `id`, `requesterId`, `addresseeId`, `status ENUM('pending','accepted','rejected')`, `createdAt`, `updatedAt`, `UNIQUE KEY uq_friendship (requesterId, addresseeId)`, and FK constraints referencing `users(id) ON DELETE CASCADE`
    - Include indexes on `requesterId`, `addresseeId`, and `status`
    - _Requirements: 11.1_

- [x] C2. Create `services/notificationService.ts` — accept `buttonLink`/`buttonText`
  - [ ] C2.1 Update `createNotification` signature and INSERT to accept caller-supplied `buttonLink` and `buttonText`
    - Add `buttonLink?: string | null` and `buttonText?: string | null` to the function's input destructuring with defaults of `null`
    - Remove the hardcoded `const buttonLink = null; const buttonText = null;` lines and use the parameter values in the INSERT statement
    - _Requirements: 12.2, 12.3_

  - [ ]* C2.2 Write property test for notification backward compatibility (Property 18)
    - **Property 18: Notification backward compatibility**
    - **Validates: Requirements 12.3**

- [x] C3. Create `services/friendshipService.ts`
  - [ ] C3.1 Implement core CRUD functions
    - Create the file with: `createFriendRequest`, `getFriendshipById`, `updateFriendshipStatus`, `deleteFriendship`, `getFriendshipBetween`
    - All use `pool.query` directly; no transaction wrapper (notifications are best-effort)
    - _Requirements: 11.1, 11.2, 11.5, 11.7_

  - [ ] C3.2 Implement friend list query functions
    - Add: `getAcceptedFriends(userId)`, `getPendingIncomingRequests(userId)`, `getPendingOutgoingRequests(userId)`
    - Each JOIN to `users` to return partner user `id`, `nickname`, `avatarUrl`
    - _Requirements: 11.8, 11.9_

  - [ ] C3.3 Implement `notifyFriendRequest` helper
    - Call `createNotification` with `category: 'social'`, `type: 'friend_request'`, `title: 'New Friend Request'`, `buttonLink: '/profile?userId=<requesterId>'`, `buttonText: 'View Request'`
    - Wrap in try/catch; log errors but do not re-throw
    - _Requirements: 12.1_

  - [ ]* C3.4 Write property test for friendship creation idempotency guard (Property 14)
    - **Property 14: Friendship creation is idempotent-guarded**
    - **Validates: Requirements 11.2, 11.4**

  - [ ]* C3.5 Write property test for friend list completeness and symmetry (Property 16)
    - **Property 16: Friend list completeness and symmetry**
    - **Validates: Requirements 11.8**

  - [ ]* C3.6 Write property test for friend request notification correctness (Property 17)
    - **Property 17: Friend request notification correctness**
    - **Validates: Requirements 12.1**

- [x] C4. Create `app/api/friends/route.ts`
  - [ ] C4.1 Implement auth guard helper and `GET` handler
    - Shared `requireAuth(req)` helper using `getToken`; return `null` if no token
    - `GET` with no `type` param → `getAcceptedFriends`; `?type=requests` → `getPendingIncomingRequests`; `?type=sent` → `getPendingOutgoingRequests`
    - Return 401 for unauthenticated requests
    - _Requirements: 11.8, 11.9, 11.10_

  - [ ] C4.2 Implement `POST` handler (send friend request)
    - Validate `addresseeId !== userId` (400), check for existing friendship via `getFriendshipBetween` (409 if exists)
    - Call `createFriendRequest`, then `notifyFriendRequest` (non-blocking), return 201
    - _Requirements: 11.2, 11.3, 11.4_

  - [ ]* C4.3 Write property test for FriendsAPI auth gate (Property 15)
    - **Property 15: FriendsAPI authorization gate**
    - **Validates: Requirements 11.10**

- [x] C5. Create `app/api/friends/[id]/route.ts`
  - [ ] C5.1 Implement `PUT` handler (accept/reject)
    - Call `getFriendshipById`; return 404 if not found; return 403 if `friendship.addresseeId !== userId`
    - Call `updateFriendshipStatus(id, status)` and return 200 with updated friendship
    - _Requirements: 11.5, 11.6_

  - [ ] C5.2 Implement `DELETE` handler (unfriend/cancel)
    - Return 403 if caller is neither `requesterId` nor `addresseeId`; call `deleteFriendship(id)` and return 200
    - _Requirements: 11.7_

- [x] C6. Create `/friends` page and `FriendsView` component
  - [ ] C6.1 Create `app/friends/page.tsx` with auth redirect
    - Use `getServerSession(authOptions)`; redirect to `/auth` if no session
    - Wrap `FriendsView` in `LayoutSelector layoutType="main"`
    - _Requirements: 13.1_

  - [ ] C6.2 Create `components/friends/FriendsView.tsx` with three tabs
    - Three tabs: My Friends, Requests, Sent; each fetches its own data on mount (`GET /api/friends`, `?type=requests`, `?type=sent`)
    - My Friends tab: list with avatar, nickname, Unfriend button → `DELETE /api/friends/[id]`
    - Requests tab: list with avatar, nickname, Accept button (`PUT` with `status: 'accepted'`) and Reject button (`PUT` with `status: 'rejected'`)
    - Sent tab: list with avatar, nickname, Cancel Request button → `DELETE /api/friends/[id]`
    - Each action refetches its tab's data; use `useToast` for feedback
    - _Requirements: 13.2–13.9_

- [x] C7. Wire `InviteFriendsModal` to real `GET /api/friends` endpoint
  - [ ] C7.1 Replace `fetch('/api/users/friends')` call with `fetch('/api/friends')` in `components/wagers/InviteFriendsModal.tsx`
    - Map response shape: `data.friends.map(f => ({ id: f.friendId, name: f.friendNickname, username: f.friendNickname, avatarUrl: f.friendAvatarUrl, email: '', selected: false }))`
    - Show "No friends available" when the array is empty (already handled by existing conditional)
    - _Requirements: 15.1, 15.2_

  - [ ]* C7.2 Write property test for InviteFriendsModal client-side search (Property 20)
    - **Property 20: InviteFriendsModal client-side search**
    - **Validates: Requirements 15.3**

- [x] C8. Add friend-state buttons on user profile pages
  - [ ] C8.1 Create `FriendshipButton` client component
    - Create `components/friends/FriendshipButton.tsx`; on mount, derive friendship state by calling `GET /api/friends` (check accepted list) and `GET /api/friends?type=sent` (check pending outgoing)
    - Three states: `'none'` → "Add Friend" button (POST /api/friends, transitions to `'pending-sent'`); `'pending-sent'` → "Cancel Request" (DELETE, transitions to `'none'`); `'accepted'` → "Unfriend" (DELETE, transitions to `'none'`)
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

  - [ ] C8.2 Render `FriendshipButton` on profile pages for other users
    - In `components/common/ProfileSettings.tsx`, detect if the viewed profile belongs to another user (by comparing `profileUserId` prop with the session user id); if so, render `<FriendshipButton profileUserId={profileUserId} />`
    - _Requirements: 14.1, 14.3, 14.5_

  - [ ]* C8.3 Write property test for profile friendship button states (Property 19)
    - **Property 19: Profile friendship button reflects current state**
    - **Validates: Requirements 14.1, 14.3, 14.5**

- [x] C9. Checkpoint — Friends feature
  - Ensure all tests pass, ask the user if questions arise.

---

### Feature D — Event Wager UI

- [x] D1. Update `BetConfirmationModal` with `wagerType`/`oddsAtBet` props and event layout
  - [ ] D1.1 Add new optional props to `BetConfirmationModalProps` interface
    - Add `wagerType?: 'p2p' | 'event'` (default `'p2p'`), `oddsAtBet?: number`, `platformFeeRate?: number` (default `0.05`) to the interface in `components/wagers/modals/BetConfirmationModal.tsx`
    - _Requirements: 16.1_

  - [ ] D1.2 Implement conditional event layout in the modal body
    - When `wagerType === 'event'`: render selected option, stake amount, odds as `{oddsAtBet}x`, potential return as `₦{(stake × oddsAtBet × (1 - feeRate)).toFixed(2)}`, and the platform-fee disclaimer
    - When `oddsAtBet` is absent or zero: render "—" as potential return and omit the odds line
    - When `wagerType !== 'event'`: render the existing P2P layout unchanged
    - _Requirements: 16.2, 16.3, 16.4_

  - [ ]* D1.3 Write property test for EventWager modal potential return formula (Property 21)
    - **Property 21: EventWager BetConfirmationModal potential return formula**
    - **Validates: Requirements 16.2, 16.4**

  - [ ]* D1.4 Write property test for P2PWager modal layout unchanged (Property 22)
    - **Property 22: P2PWager BetConfirmationModal layout is unchanged**
    - **Validates: Requirements 16.3**

- [x] D2. Hide `CashoutButton` on event wagers in `UserWagerActions`
  - [ ] D2.1 Add `wagerType` to `Wager` interface in `types/game.types.ts`
    - Add `wagerType?: 'p2p' | 'event'` to the `Wager` interface (the `isResolved` field is also missing — add `isResolved?: boolean` while here)
    - _Requirements: 10.1, 10.2_

  - [ ] D2.2 Wrap the Cashout `Button` in a `wagerType` guard in `UserWagerActions.tsx`
    - Replace the unconditional `<Button … onClick={onCashout}>Cashout</Button>` with `{(wager.wagerType ?? 'p2p') === 'p2p' && (<Button …>Cashout</Button>)}` inside the `isOpen` block
    - _Requirements: 10.1, 10.2_

  - [ ]* D2.3 Write property test for CashoutButton visibility (Property 13)
    - **Property 13: CashoutButton present on P2P wagers, absent on Event wagers**
    - **Validates: Requirements 10.1, 10.2**

- [x] D3. Wire new `BetConfirmationModal` props from `WagerDetails`
  - [ ] D3.1 Fetch `platformFeeRate` from settings API in `WagerDetails`
    - Add a `platformFeeRate` state (default `0.05`) and a `useEffect` that calls `GET /api/settings`, reads `d?.settings?.platformFeeRate`, and sets state if it is a valid number in (0, 1)
    - _Requirements: 16.2_

  - [ ] D3.2 Pass `wagerType`, `oddsAtBet`, and `platformFeeRate` to `BetConfirmationModal`
    - In `WagerDetails.tsx`, derive `wagerType` from `wager.wagerType ?? 'p2p'` and `oddsAtBet` from the matched option's `.odds` field based on `selectedOption`
    - Pass all three as props to `<BetConfirmationModal …>`
    - _Requirements: 16.1, 16.2_

- [x] D4. Final checkpoint — Event Wager UI feature
  - Ensure all tests pass, ask the user if questions arise.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Schema migration tasks (A1.1, B1.1, C1.1) are independent and can run in parallel
- B2 and C2 are also independent of each other and can proceed simultaneously
- Each task references specific requirements and design properties for traceability
- `wagerType` column in the `wagers` table is assumed to be present from the wagerx-foundations spec; if not, add `ALTER TABLE wagers ADD COLUMN IF NOT EXISTS wagerType ENUM('p2p','event') NOT NULL DEFAULT 'p2p'` alongside A1.1
- The profile page (`ProfileSettings.tsx`) currently shows only the authenticated user's own profile; task C8.2 assumes it will receive a `profileUserId` prop when navigating to another user's profile — the routing mechanism for this should be confirmed before implementation

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["A1.1", "B1.1", "C1.1"] },
    { "id": 1, "tasks": ["A1.2", "B2.1", "C2.1"] },
    { "id": 2, "tasks": ["A2.1", "B2.2", "C2.2", "C3.1"] },
    { "id": 3, "tasks": ["A2.2", "B2.3", "C3.2", "C3.3"] },
    { "id": 4, "tasks": ["A2.3", "B3.1", "C3.4", "C3.5", "C3.6"] },
    { "id": 5, "tasks": ["A2.4", "A2.5", "B3.2", "C4.1", "C4.2"] },
    { "id": 6, "tasks": ["A3.1", "B3.3", "B4.1", "C4.3", "C5.1", "C5.2"] },
    { "id": 7, "tasks": ["A3.2", "B4.2", "C6.1", "C6.2"] },
    { "id": 8, "tasks": ["A4.1", "B4.3", "B4.4", "B4.5", "C7.1"] },
    { "id": 9, "tasks": ["A4.2", "B5.1", "C7.2", "C8.1"] },
    { "id": 10, "tasks": ["A4.3", "B5.2", "C8.2"] },
    { "id": 11, "tasks": ["A5.1", "B5.3", "C8.3", "D1.1"] },
    { "id": 12, "tasks": ["A5.2", "A5.3", "D1.2", "D2.1"] },
    { "id": 13, "tasks": ["A5.4", "A5.5", "D1.3", "D1.4", "D2.2"] },
    { "id": 14, "tasks": ["A5.6", "D2.3", "D3.1"] },
    { "id": 15, "tasks": ["A5.7", "D3.2"] },
    { "id": 16, "tasks": ["A6.1", "A7.1"] },
    { "id": 17, "tasks": ["A7.2"] }
  ]
}
```
