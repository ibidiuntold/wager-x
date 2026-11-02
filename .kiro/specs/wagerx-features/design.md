# Design Document: WagerX Features

## Overview

This document covers the technical design for four new platform features layered on top of the foundations established in `wagerx-foundations`:

| # | Feature | Primary Files |
|---|---------|---------------|
| 1 | Leaderboard (Global, Weekly, Friends) | `services/wagerService.ts`, `lib/cron.ts`, `app/api/leaderboard/route.ts`, `app/leaderboard/page.tsx` |
| 2 | Admin Event Wagers with Odds | `components/admin/AddWagerModal.tsx`, `app/api/wagers/route.ts`, `services/wagerService.ts` |
| 3 | Friend Management | `services/friendshipService.ts`, `app/api/friends/route.ts`, `app/api/friends/[id]/route.ts`, `app/friends/page.tsx`, `services/notificationService.ts` |
| 4 | Event Wager UI (Confirmation + Cashout) | `components/wagers/modals/BetConfirmationModal.tsx`, `components/wagers/UserWagerActions.tsx`, `components/wagers/WagerCard.tsx`, `services/wagerParticipantService.ts` |

All design decisions follow the established patterns from `wagerx-foundations`:
- Atomic multi-step writes use `pool.getConnection()` with `beginTransaction / commit / rollback / release`
- API auth uses `getToken({ req, secret: process.env.NEXTAUTH_SECRET })` from `next-auth/jwt`
- No new npm packages introduced
- All service files live in `/services/`, all routes in `/app/api/`

---

## Architecture

### Data-Flow Overview

```
Browser                       Next.js API Routes              Service Layer            MySQL
  │                                  │                              │                    │
  │  GET /api/leaderboard?type=X ───▶│ route.ts (getToken guard)   │                    │
  │                                  │──── getLeaderboard(type) ──▶│                    │
  │                                  │                              │── SELECT users ───▶│
  │                                  │◀─── LeaderboardRow[] ───────│◀───────────────────│
  │◀─── { users, isEmpty? } ─────────│                              │                    │
  │                                  │                              │                    │
  │  POST /api/friends ─────────────▶│ route.ts (getToken guard)   │                    │
  │                                  │── createFriendship(...) ────▶│                    │
  │                                  │                              │── INSERT + notif ─▶│
  │◀─── 201 { friendship } ──────────│◀───────────────────────────│◀───────────────────│
```

### Database Schema Additions

The following migrations are idempotent (`ADD COLUMN IF NOT EXISTS`) and are applied by running the migration SQL before the application starts (or as part of the existing schema setup):

```sql
-- Requirement 1: Leaderboard columns on users
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS totalWinnings   DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS wagersPlayed    INT           NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS weeklyWinnings  DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS weeklyWagerCount INT          NOT NULL DEFAULT 0;

-- Requirement 7: oddsAtBet on wager_participants
ALTER TABLE wager_participants
  ADD COLUMN IF NOT EXISTS oddsAtBet DECIMAL(5,2) NOT NULL DEFAULT 1.00;

-- Requirement 11: friendships table
CREATE TABLE IF NOT EXISTS friendships (
  id           VARCHAR(36)                              NOT NULL PRIMARY KEY,
  requesterId  VARCHAR(36)                              NOT NULL,
  addresseeId  VARCHAR(36)                              NOT NULL,
  status       ENUM('pending','accepted','rejected')    NOT NULL DEFAULT 'pending',
  createdAt    DATETIME                                 NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt    DATETIME                                 NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_friendship (requesterId, addresseeId),
  FOREIGN KEY (requesterId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (addresseeId) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_requesterId (requesterId),
  INDEX idx_addresseeId (addresseeId),
  INDEX idx_status      (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## Feature 1: Leaderboard

### 1.1 Schema Increments in `resolveWagerService`

The existing `resolveWagerService` in `services/wagerService.ts` already uses a `ResolutionTransaction` (dedicated connection from `pool.getConnection()`). This spec adds two more UPDATE statements inside the same atomic block — no new transaction scaffolding needed.

**Inside the winner loop (after `UPDATE users SET balance = balance + ?`):**

```typescript
// Increment leaderboard stats for the winner
await conn.query(
  `UPDATE users 
   SET totalWinnings  = totalWinnings  + ?,
       weeklyWinnings = weeklyWinnings + ?
   WHERE id = ?`,
  [netPayout, netPayout, winner.userId]
);
```

**After the winner loop, for all participants (winners + losers):**

```typescript
// One batch UPDATE covering every participant in the wager
const participantIds = participants.map((p: any) => p.userId);
await conn.query(
  `UPDATE users 
   SET wagersPlayed     = wagersPlayed     + 1,
       weeklyWagerCount = weeklyWagerCount + 1
   WHERE id IN (?)`,
  [participantIds]
);
```

> The `netPayout` value used here is the net amount credited to the winner after platform fee. For EventWager it is `participant.amount × participant.oddsAtBet × (1 - feeRate)`; for P2PWager it is the existing proportional share minus fee. Both paths produce a `netPayout` local variable before the balance credit — the leaderboard increment reuses that variable.

### 1.2 Weekly Reset Cron

**File: `lib/cron.ts`** — extend the existing `startCronJobs` function:

```typescript
import cron from "node-cron";
import { checkAndCloseExpiredWagers } from "@/services/wagerService";
import pool from "@/lib/mysql";

export function startCronJobs() {
  // Existing: check expired wagers every minute
  cron.schedule("* * * * *", async () => {
    console.log("Running wager expiry check...");
    await checkAndCloseExpiredWagers();
  });

  // New: weekly leaderboard reset — every Monday at 00:00 WAT
  cron.schedule("0 0 * * 1", async () => {
    console.log(`[WeeklyReset] Starting at ${new Date().toISOString()}`);
    try {
      const [result]: any = await pool.query(
        `UPDATE users SET weeklyWinnings = 0, weeklyWagerCount = 0`
      );
      console.log(
        `[WeeklyReset] Completed at ${new Date().toISOString()} — ${result.affectedRows} rows reset`
      );
    } catch (err) {
      console.error("[WeeklyReset] Failed:", err);
      // swallow — do not crash the process
    }
  }, { timezone: "Africa/Lagos" });
}
```

### 1.3 Leaderboard API

**File: `app/api/leaderboard/route.ts`**

The route supports three `type` values with a shared auth guard for the `friends` type.

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import pool from '@/lib/mysql';

type LeaderboardType = 'global' | 'weekly' | 'friends';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') as LeaderboardType | null;
  const limitParam = searchParams.get('limit');
  const limit = limitParam ? Math.min(parseInt(limitParam, 10) || 50, 50) : 50;

  if (!type || !['global', 'weekly', 'friends'].includes(type)) {
    return NextResponse.json(
      { success: false, message: 'Invalid leaderboard type' },
      { status: 400 }
    );
  }

  // Friends tab requires authentication
  if (type === 'friends') {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }
    const userId = token.sub as string;
    const [rows]: any = await pool.query(
      `SELECT u.id, u.nickname, u.avatarUrl, u.totalWinnings, u.wagersPlayed, u.gamePoints
       FROM users u
       JOIN friendships f ON (
         (f.requesterId = ? AND f.addresseeId = u.id)
         OR (f.addresseeId = ? AND f.requesterId = u.id)
       )
       WHERE f.status = 'accepted'
       UNION
       SELECT id, nickname, avatarUrl, totalWinnings, wagersPlayed, gamePoints
       FROM users WHERE id = ?
       ORDER BY totalWinnings DESC
       LIMIT ?`,
      [userId, userId, userId, limit]
    );
    return NextResponse.json({ success: true, users: rows });
  }

  if (type === 'weekly') {
    const [rows]: any = await pool.query(
      `SELECT id, nickname, avatarUrl, weeklyWinnings, weeklyWagerCount, gamePoints
       FROM users
       ORDER BY weeklyWinnings DESC
       LIMIT ?`,
      [limit]
    );
    // Determine empty state: all weeklyWinnings are 0
    const isEmpty = (rows as any[]).every((r: any) => Number(r.weeklyWinnings) === 0);
    return NextResponse.json({ success: true, users: rows, isEmpty });
  }

  // type === 'global'
  const [rows]: any = await pool.query(
    `SELECT id, nickname, avatarUrl, totalWinnings, wagersPlayed, gamePoints
     FROM users
     ORDER BY totalWinnings DESC
     LIMIT ?`,
    [limit]
  );
  return NextResponse.json({ success: true, users: rows });
}
```

> **Note on isEmpty:** Rather than tracking the last reset timestamp separately, `isEmpty` is derived from all rows having `weeklyWinnings = 0`. This matches the requirement's intent: if no wager has been resolved since the last reset, all weekly values remain 0.

### 1.4 Leaderboard Page

**File: `app/leaderboard/page.tsx`**

```tsx
'use client';
import LayoutSelector from '@/components/common/LayoutSelector';
import LeaderboardView from '@/components/leaderboard/LeaderboardView';

export default function LeaderboardPage() {
  return (
    <LayoutSelector layoutType="main">
      <LeaderboardView />
    </LayoutSelector>
  );
}
```

**File: `components/leaderboard/LeaderboardView.tsx`**

The component owns all leaderboard UI state. Key sub-components:

- `LeaderboardView` — tab container, fetch logic, pinned-row logic
- `LeaderboardRow` — single user row with rank, avatar, nickname, stats, TierBadge
- `TierBadge` — pure display component keyed on `gamePoints`

**TierBadge computation (pure function, no side effects):**

```typescript
export function computeTier(gamePoints: number): {
  label: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond';
  colorClass: string;
} {
  if (gamePoints >= 5000) return { label: 'Diamond', colorClass: 'bg-cyan-500' };
  if (gamePoints >= 1000) return { label: 'Platinum', colorClass: 'bg-purple-500' };
  if (gamePoints >= 500)  return { label: 'Gold',     colorClass: 'bg-yellow-500' };
  if (gamePoints >= 100)  return { label: 'Silver',   colorClass: 'bg-gray-400'   };
  return                          { label: 'Bronze',   colorClass: 'bg-orange-600' };
}
```

**Rank assignment with tie handling:**

```typescript
export function assignRanks<T extends { rankScore: number }>(
  users: T[]
): (T & { rank: number })[] {
  // users must be pre-sorted descending by rankScore
  let rank = 1;
  return users.map((user, index) => {
    if (index > 0 && user.rankScore < users[index - 1].rankScore) {
      rank = index + 1; // skip by count of tied users above
    }
    return { ...user, rank };
  });
}
```

**PinnedRow logic:**

```typescript
// Inside LeaderboardView render:
const rankedUsers = assignRanks(users.map(u => ({ ...u, rankScore: activeTab === 'weekly' ? u.weeklyWinnings : u.totalWinnings })));
const selfEntry = rankedUsers.find(u => u.id === session?.user?.id);
const showPinned = selfEntry && selfEntry.rank > 50;
```

**LeaderboardView structure (simplified):**

```tsx
<div className="container mx-auto px-4 py-8 mt-20">
  <h1 className="text-3xl font-bold mb-6">Leaderboard</h1>
  <Tabs value={activeTab} onValueChange={setActiveTab}>
    <TabsList>
      <TabsTrigger value="global">Global</TabsTrigger>
      <TabsTrigger value="weekly">Weekly</TabsTrigger>
      <TabsTrigger value="friends">Friends</TabsTrigger>
    </TabsList>
    <TabsContent value="global">
      {isLoading ? <LoadingSkeleton /> : <LeaderboardTable ... />}
    </TabsContent>
    {/* weekly, friends tabs similarly */}
  </Tabs>
  {showPinned && <PinnedLeaderboardRow user={selfEntry} />}
</div>
```

### 1.5 Homepage Leaderboard Widget

**File: `components/leaderboard/LeaderboardWidget.tsx`**

```tsx
// Server component — fetch top 5 at render time using the leaderboard API
// Falls back to an empty state card on error — never throws
async function fetchTop5(): Promise<LeaderboardRow[]> {
  try {
    const res = await fetch(`/api/leaderboard?type=global&limit=5`, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    const data = await res.json();
    return data.users ?? [];
  } catch {
    return [];
  }
}
```

Rendered as a compact ranked list on the homepage in the existing `Dashboard` component (imported alongside other homepage sections). If `users.length === 0` it renders a "Leaderboard coming soon" placeholder card.

---

## Feature 2: Event Wagers with Odds

### 2.1 AddWagerModal Changes

**File: `components/admin/AddWagerModal.tsx`**

Add a `wagerType` field to the local state (default `'p2p'`):

```typescript
const [wager, setWager] = useState({
  // ...existing fields...
  wagerType: 'p2p' as 'p2p' | 'event',
});
```

Add the wagerType selector above the options section:

```tsx
<div className="space-y-2">
  <Label htmlFor="wagerType">Wager Type</Label>
  <Select
    value={wager.wagerType}
    onValueChange={(value: 'p2p' | 'event') =>
      setWager({ ...wager, wagerType: value })
    }
  >
    <SelectTrigger>
      <SelectValue placeholder="Select type" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="p2p">P2P (Pool-based)</SelectItem>
      <SelectItem value="event">Event (Fixed Odds)</SelectItem>
    </SelectContent>
  </Select>
</div>
```

The odds input inside the options array is conditionally enabled:

```tsx
<Input
  id={`option-odds-${index}`}
  type="number"
  step="0.01"
  min="1"
  value={option.odds}
  disabled={wager.wagerType === 'p2p'}
  className={`mt-2 ${wager.wagerType === 'p2p' ? 'bg-gray-100 dark:bg-gray-800' : ''}`}
  onChange={(e) => handleOptionChange(index, 'odds', e.target.value)}
/>
{wager.wagerType === 'p2p' && (
  <p className="text-xs text-muted-foreground mt-1">
    Odds are automatically calculated based on user activity
  </p>
)}
```

The `handleSubmit` function already spreads `wager` into the POST body — `wagerType` and the updated `options` array (with admin-entered odds) are included automatically.

### 2.2 API Route: Accept wagerType

**File: `app/api/wagers/route.ts` — POST handler**

The existing `createWager` call already forwards `data` from the request body. The `createWager` service function is extended to read `wagerType`:

```typescript
// No route-level changes needed — body is forwarded as-is to createWager
// which already handles arbitrary fields through the data parameter
```

### 2.3 WagerService: Persist wagerType and Odds

**File: `services/wagerService.ts` — `createWager`**

```typescript
export async function createWager(data: any) {
  const {
    category, description, expiresAt, image, options,
    slug, status, title, minimumEntry, creatorId,
    wagerType = 'p2p'   // new field, defaults to 'p2p'
  } = data;

  const wagerId = uuidv4();
  const [result] = await pool.query(
    `INSERT INTO wagers
       (id, creatorId, category, description, expiresAt, image,
        options, slug, status, title, minimumEntry, wagerType, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
    [wagerId, creatorId, category, description, expiresAt, image,
     JSON.stringify(options), slug, status || 'open', title, minimumEntry, wagerType]
  );
  return result;
}
```

`getFilteredWagers` already includes `w.wagerType` in the SELECT from the foundations spec. No additional change needed there.

### 2.4 OddsAtBet Capture on Participant Join

**File: `services/wagerParticipantService.ts`**

Inside `createWagerParticipant`, after fetching the wager row under `FOR UPDATE`, determine and store `oddsAtBet`:

```typescript
// Read wagerType and options from the locked wager row
const wagerType: 'p2p' | 'event' = wagerRow.wagerType ?? 'p2p';
const parsedOptions: Array<{ name: string; odds?: number }> =
  typeof wagerRow.options === 'string'
    ? JSON.parse(wagerRow.options)
    : wagerRow.options;

let oddsAtBet = 1.00;
if (wagerType === 'event') {
  const matchedOption = parsedOptions.find(o => o.name === data.optionSelected);
  if (matchedOption?.odds != null && matchedOption.odds > 0) {
    oddsAtBet = matchedOption.odds;
  } else {
    console.warn(
      `[createWagerParticipant] EventWager ${data.wagerId}: odds absent for option ` +
      `"${data.optionSelected}" — defaulting oddsAtBet to 1.00`
    );
  }
}

// Add to INSERT statement:
await conn.query(
  `INSERT INTO wager_participants
     (id, wagerId, userId, optionSelected, amount, oddsAtBet, joinedAt)
   VALUES (?, ?, ?, ?, ?, ?, NOW())`,
  [participantId, data.wagerId, data.userId, data.optionSelected, data.amount, oddsAtBet]
);
```

### 2.5 Event Payout Resolution

**File: `services/wagerService.ts` — `resolveWagerService`**

After reading the wager row under `FOR UPDATE`, branch on `wagerType`:

```typescript
const wagerType: 'p2p' | 'event' = wager.wagerType ?? 'p2p';

if (wagerType === 'event') {
  // ── EVENT PAYOUT PATH ──────────────────────────────────────────────
  // Each winner gets: amount × oddsAtBet × (1 - feeRate)
  const feeRate = settings?.platformFeeRate ?? 0.05;
  let totalGrossWinnerPayout = 0;

  for (const winner of winners) {
    const gross = winner.amount * winner.oddsAtBet;
    const net   = gross * (1 - feeRate);
    totalGrossWinnerPayout += gross;

    await conn.query(
      `UPDATE users
       SET balance         = balance         + ?,
           totalWinnings   = totalWinnings   + ?,
           weeklyWinnings  = weeklyWinnings  + ?
       WHERE id = ?`,
      [net, net, net, winner.userId]
    );

    await conn.query(
      `INSERT INTO transactions
         (id, userId, reference, amount, netAmount, processingFee, status, type, provider)
       VALUES (?, ?, ?, ?, ?, 0, 'completed', 'wager_credit', 'internal')`,
      [
        uuidv4(),
        winner.userId,
        `wager_credit_${wagerId}_${winner.userId}_${Date.now()}`,
        net, net
      ]
    );

    await createSettledUser(settlement.id, wagerId, winner.userId, net);
  }

  // Platform fee row
  const fee = totalGrossWinnerPayout * feeRate;
  if (settings?.platformFeeAccountId) {
    await conn.query(
      `UPDATE users SET balance = balance + ? WHERE id = ?`,
      [fee, settings.platformFeeAccountId]
    );
    await conn.query(
      `INSERT INTO transactions
         (id, userId, reference, amount, netAmount, processingFee, status, type, provider)
       VALUES (?, ?, ?, ?, ?, 0, 'completed', 'wager_credit', 'internal')`,
      [
        uuidv4(),
        settings.platformFeeAccountId,
        `platform_fee_${wagerId}_${Date.now()}`,
        fee, fee
      ]
    );
  }

} else {
  // ── P2P PATH (existing pool-proportional logic, unchanged) ─────────
  // ... existing code ...
}

// wagersPlayed + weeklyWagerCount increment for ALL participants (both paths)
const participantIds = participants.map((p: any) => p.userId);
await conn.query(
  `UPDATE users
   SET wagersPlayed     = wagersPlayed     + 1,
       weeklyWagerCount = weeklyWagerCount + 1
   WHERE id IN (?)`,
  [participantIds]
);
```

### 2.6 Event Badge and Odds on Wager Cards

**File: `components/wagers/WagerCard.tsx`**

Add an `EVENT` badge and per-option odds display when `wager.wagerType === 'event'`:

```tsx
interface WagerCardProps {
  wager: {
    // ...existing fields...
    wagerType?: 'p2p' | 'event';
    options?: Array<{ name: string; odds?: number }>;
  };
  // ...
}

// Inside the card body, after the category badge:
{wager.wagerType === 'event' && (
  <span className="inline-block bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded-full mb-2 uppercase ml-1">
    EVENT
  </span>
)}

// Inside the details grid, replace the Options count for EventWager:
{wager.wagerType === 'event' && Array.isArray(wager.options) ? (
  <div className="col-span-3 flex gap-2 flex-wrap mt-2">
    {wager.options.map((opt, i) => (
      <span key={i} className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full">
        {opt.name}: <strong>{opt.odds}x</strong>
      </span>
    ))}
  </div>
) : (
  <div>
    <p>Options</p>
    <p className="font-semibold text-gray-900 dark:text-white">
      {Array.isArray(wager.options) ? wager.options.length : 0}
    </p>
  </div>
)}
```

The same `WagerCard` receives the options array already from `getFilteredWagers` — the `wagerType` field is included in the SELECT from foundations, so no API changes are required.

---

## Feature 3: Friend Management

### 3.1 FriendshipService

**New file: `services/friendshipService.ts`**

All friendship operations use `pool.query` (simple reads/writes) except the friend-request creation which also fires a notification — these two writes run sequentially but are not wrapped in a transaction (the notification is a best-effort side effect; a notification failure should not roll back the friendship creation).

```typescript
import pool from '@/lib/mysql';
import { v4 as uuidv4 } from 'uuid';
import { createNotification } from './notificationService';

export interface Friendship {
  id: string;
  requesterId: string;
  addresseeId: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

/** Create a friend request (pending friendship) */
export async function createFriendRequest(
  requesterId: string,
  addresseeId: string
): Promise<Friendship> {
  const id = uuidv4();
  await pool.query(
    `INSERT INTO friendships (id, requesterId, addresseeId, status)
     VALUES (?, ?, ?, 'pending')`,
    [id, requesterId, addresseeId]
  );
  const [rows]: any = await pool.query(
    `SELECT * FROM friendships WHERE id = ?`, [id]
  );
  return rows[0];
}

/** Notify the addressee of the new friend request */
export async function notifyFriendRequest(
  requesterId: string,
  addresseeId: string,
  requesterNickname: string
): Promise<void> {
  try {
    await createNotification({
      userId:     addresseeId,
      category:   'social',
      type:       'friend_request',
      title:      'New Friend Request',
      message:    `${requesterNickname} sent you a friend request.`,
      buttonLink: `/profile?userId=${requesterId}`,
      buttonText: 'View Request',
    });
  } catch (err) {
    console.error('[FriendshipService] Failed to create friend request notification:', err);
    // do not re-throw — notification failure is non-blocking
  }
}

/** Update friendship status (accept / reject) — only the addressee may call this */
export async function updateFriendshipStatus(
  id: string,
  status: 'accepted' | 'rejected'
): Promise<Friendship | null> {
  await pool.query(
    `UPDATE friendships SET status = ?, updatedAt = NOW() WHERE id = ?`,
    [status, id]
  );
  const [rows]: any = await pool.query(
    `SELECT * FROM friendships WHERE id = ?`, [id]
  );
  return rows[0] ?? null;
}

/** Delete a friendship row by id */
export async function deleteFriendship(id: string): Promise<void> {
  await pool.query(`DELETE FROM friendships WHERE id = ?`, [id]);
}

/** Get a friendship by id */
export async function getFriendshipById(id: string): Promise<Friendship | null> {
  const [rows]: any = await pool.query(
    `SELECT * FROM friendships WHERE id = ?`, [id]
  );
  return rows[0] ?? null;
}

/** Get all accepted friends for a user (both directions) */
export async function getAcceptedFriends(userId: string): Promise<any[]> {
  const [rows]: any = await pool.query(
    `SELECT
       f.id,
       f.requesterId,
       f.addresseeId,
       u.id        AS friendId,
       u.nickname  AS friendNickname,
       u.avatarUrl AS friendAvatarUrl
     FROM friendships f
     JOIN users u ON (
       u.id = CASE
         WHEN f.requesterId = ? THEN f.addresseeId
         ELSE f.requesterId
       END
     )
     WHERE f.status = 'accepted'
       AND (f.requesterId = ? OR f.addresseeId = ?)`,
    [userId, userId, userId]
  );
  return rows;
}

/** Get all incoming pending friend requests for a user */
export async function getPendingIncomingRequests(userId: string): Promise<any[]> {
  const [rows]: any = await pool.query(
    `SELECT
       f.id,
       f.requesterId,
       f.createdAt,
       u.id        AS requesterId,
       u.nickname  AS requesterNickname,
       u.avatarUrl AS requesterAvatarUrl
     FROM friendships f
     JOIN users u ON u.id = f.requesterId
     WHERE f.addresseeId = ? AND f.status = 'pending'`,
    [userId]
  );
  return rows;
}

/** Get all outgoing pending friend requests sent by a user */
export async function getPendingOutgoingRequests(userId: string): Promise<any[]> {
  const [rows]: any = await pool.query(
    `SELECT
       f.id,
       f.addresseeId,
       f.createdAt,
       u.id        AS addresseeId,
       u.nickname  AS addresseeNickname,
       u.avatarUrl AS addresseeAvatarUrl
     FROM friendships f
     JOIN users u ON u.id = f.addresseeId
     WHERE f.requesterId = ? AND f.status = 'pending'`,
    [userId]
  );
  return rows;
}

/** Check friendship state between two users */
export async function getFriendshipBetween(
  userA: string,
  userB: string
): Promise<Friendship | null> {
  const [rows]: any = await pool.query(
    `SELECT * FROM friendships
     WHERE (requesterId = ? AND addresseeId = ?)
        OR (requesterId = ? AND addresseeId = ?)
     LIMIT 1`,
    [userA, userB, userB, userA]
  );
  return rows[0] ?? null;
}
```

### 3.2 NotificationService: Accept buttonLink/buttonText

**File: `services/notificationService.ts`** — update `createNotification`:

```typescript
export async function createNotification(data: {
  category?: string;
  createdAt?: Date;
  expiresAt?: Date | null;
  message: string;
  title: string;
  type?: string;
  userId?: string | null;
  buttonLink?: string | null;   // ← new optional param
  buttonText?: string | null;   // ← new optional param
}) {
  const id = uuidv4();
  const {
    category,
    createdAt  = new Date(),
    expiresAt  = null,
    message,
    title,
    type,
    userId     = null,
    buttonLink = null,   // default null — preserves backward compat
    buttonText = null,   // default null — preserves backward compat
  } = data;
  const status = false;

  const [result] = await pool.query(
    `INSERT INTO notifications
       (id, buttonLink, buttonText, category, createdAt, expiresAt,
        message, title, type, userId, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, buttonLink, buttonText, category, createdAt, expiresAt,
     message, title, type, userId, status]
  );
  return { ...result, id };
}
```

> The existing `POST /api/notifications` route handler explicitly deletes `buttonLink` and `buttonText` from client-supplied data (`delete data.buttonLink`) as a security measure. That behavior is preserved. The service now accepts these values from **server-side callers** (like `FriendshipService`) which pass them directly — they bypass the API route entirely.

### 3.3 Friends API Routes

#### `app/api/friends/route.ts`

Handles `GET` (list accepted friends), `POST` (send request), and `GET /requests` (see below).

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import {
  createFriendRequest, notifyFriendRequest,
  getAcceptedFriends, getPendingIncomingRequests, getPendingOutgoingRequests,
  getFriendshipBetween
} from '@/services/friendshipService';
import { getUserById } from '@/services/userService';

async function requireAuth(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) return null;
  return token.sub as string;
}

export async function GET(req: NextRequest) {
  const userId = await requireAuth(req);
  if (!userId) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type'); // 'requests' | 'sent' | null (accepted)

  if (type === 'requests') {
    const requests = await getPendingIncomingRequests(userId);
    return NextResponse.json({ success: true, requests });
  }
  if (type === 'sent') {
    const sent = await getPendingOutgoingRequests(userId);
    return NextResponse.json({ success: true, sent });
  }
  // default: accepted friends
  const friends = await getAcceptedFriends(userId);
  return NextResponse.json({ success: true, friends });
}

export async function POST(req: NextRequest) {
  const userId = await requireAuth(req);
  if (!userId) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const { addresseeId } = await req.json();

  if (userId === addresseeId) {
    return NextResponse.json(
      { success: false, message: 'Cannot send a friend request to yourself' },
      { status: 400 }
    );
  }

  // Check for duplicate
  const existing = await getFriendshipBetween(userId, addresseeId);
  if (existing) {
    return NextResponse.json(
      { success: false, message: 'Friend request already exists' },
      { status: 409 }
    );
  }

  const friendship = await createFriendRequest(userId, addresseeId);

  // Fire notification (best-effort — non-blocking)
  const requester = await getUserById(userId);
  await notifyFriendRequest(userId, addresseeId, requester?.nickname ?? 'Someone');

  return NextResponse.json({ success: true, friendship }, { status: 201 });
}
```

#### `app/api/friends/[id]/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import {
  getFriendshipById, updateFriendshipStatus, deleteFriendship
} from '@/services/friendshipService';

async function requireAuth(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) return null;
  return token.sub as string;
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = await requireAuth(req);
  if (!userId) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const { id } = params;
  const { status } = await req.json();

  const friendship = await getFriendshipById(id);
  if (!friendship) {
    return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
  }
  if (friendship.addresseeId !== userId) {
    return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
  }

  const updated = await updateFriendshipStatus(id, status);
  return NextResponse.json({ success: true, friendship: updated });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = await requireAuth(req);
  if (!userId) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const { id } = params;
  const friendship = await getFriendshipById(id);
  if (!friendship) {
    return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
  }
  if (friendship.requesterId !== userId && friendship.addresseeId !== userId) {
    return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
  }

  await deleteFriendship(id);
  return NextResponse.json({ success: true });
}
```

### 3.4 Friends Page

**File: `app/friends/page.tsx`**

```tsx
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import LayoutSelector from '@/components/common/LayoutSelector';
import FriendsView from '@/components/friends/FriendsView';

export default async function FriendsPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect('/auth');
  }
  return (
    <LayoutSelector layoutType="main">
      <FriendsView />
    </LayoutSelector>
  );
}
```

**File: `components/friends/FriendsView.tsx`**

Client component with three tabs (My Friends, Requests, Sent). Uses ShadCN `Tabs`, `Avatar`, `Button`:

```tsx
'use client';
import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

// Each tab fetches its own data slice on mount using:
//   GET /api/friends           → accepted friends
//   GET /api/friends?type=requests  → incoming pending
//   GET /api/friends?type=sent      → outgoing pending

// Action handlers:
//   Unfriend       → DELETE /api/friends/[id]
//   Accept         → PUT /api/friends/[id] { status: 'accepted' }
//   Reject         → PUT /api/friends/[id] { status: 'rejected' }
//   Cancel Request → DELETE /api/friends/[id]
```

Each action refetches its tab after completion. UI uses `useToast` for feedback.

### 3.5 Profile Page: Add Friend / Unfriend Buttons

**File: `components/common/ProfileSettings.tsx`** (or the relevant profile view component)

Add a `FriendshipButton` client component that:
1. On mount calls `GET /api/friends` and checks if `profileUserId` is in the friends list, or `GET /api/friends?type=sent` to detect a pending outgoing request.
2. Renders the appropriate button: "Add Friend" → "Request Sent" indicator → "Unfriend".

```typescript
type FriendshipButtonState = 'none' | 'pending-sent' | 'accepted';

// Transitions:
// 'none'         → POST /api/friends → 'pending-sent'
// 'pending-sent' → DELETE /api/friends/[id] → 'none'
// 'accepted'     → DELETE /api/friends/[id] → 'none'
```

### 3.6 InviteFriendsModal: Wire to Real Friends Endpoint

**File: `components/wagers/InviteFriendsModal.tsx`**

Replace the current `fetch('/api/users/friends')` call with `fetch('/api/friends')` and map the response shape:

```typescript
const loadFriends = async () => {
  setIsLoading(true);
  try {
    const res = await fetch('/api/friends');
    if (!res.ok) throw new Error('Failed to fetch friends');
    const data = await res.json();
    // Map API shape to local Friend shape
    const friendsData: Friend[] = (data.friends ?? []).map((f: any) => ({
      id:        f.friendId,
      name:      f.friendNickname ?? f.friendId,
      username:  f.friendNickname ?? f.friendId,
      avatarUrl: f.friendAvatarUrl ?? '',
      email:     '',           // not returned by friends API — search by nickname only
      selected:  false,
    }));
    setFriends(friendsData);
  } catch (error) {
    // existing error handling unchanged
  } finally {
    setIsLoading(false);
  }
};
```

Client-side search already filters `friend.name` and `friend.email` — with email absent, only nickname matching applies (the requirement says "nickname or email", and email is an acceptable omission since the friends API deliberately excludes it for privacy).

---

## Feature 4: Event Wager UI (BetConfirmationModal + Cashout Suppression)

### 4.1 BetConfirmationModal: Event Layout

**File: `components/wagers/modals/BetConfirmationModal.tsx`**

Add two new props with backward-compatible defaults:

```typescript
interface BetConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedOption: string;
  betAmount: string;
  potentialReturn: number;
  isPlacingBet: boolean;
  onConfirm: () => void;
  wagerType?: 'p2p' | 'event';   // new — defaults to 'p2p'
  oddsAtBet?: number;             // new — defaults to undefined
  platformFeeRate?: number;       // new — defaults to 0.05
}
```

Conditional body rendering:

```tsx
{wagerType === 'event' ? (
  <div className="space-y-3 mt-4">
    <div className="grid grid-cols-2 gap-4">
      <div>
        <span className="text-sm text-gray-500 dark:text-gray-400">Selected Option</span>
        <p className="font-semibold text-gray-900 dark:text-white">{selectedOption}</p>
      </div>
      <div>
        <span className="text-sm text-gray-500 dark:text-gray-400">Stake</span>
        <p className="font-semibold text-purple-600 dark:text-purple-400">
          ₦{betAmount ? Number(betAmount).toLocaleString() : '0'}
        </p>
      </div>
    </div>
    {oddsAtBet && oddsAtBet > 0 ? (
      <>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">Odds</span>
            <p className="font-semibold text-amber-600 dark:text-amber-400">{oddsAtBet}x</p>
          </div>
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">Potential Return</span>
            <p className="font-semibold text-green-600 dark:text-green-400">
              ₦{(Number(betAmount) * oddsAtBet * (1 - (platformFeeRate ?? 0.05))).toFixed(2)}
            </p>
          </div>
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500">
          * Displayed return is subject to a {((platformFeeRate ?? 0.05) * 100).toFixed(0)}% platform fee.
        </p>
      </>
    ) : (
      <div>
        <span className="text-sm text-gray-500 dark:text-gray-400">Potential Return</span>
        <p className="font-semibold text-gray-400">—</p>
      </div>
    )}
  </div>
) : (
  // Existing P2P layout — unchanged
  <div className="space-y-4 mt-4">
    {/* ...existing JSX... */}
  </div>
)}
```

**platformFeeRate resolution in WagerDetails:**

```typescript
// In WagerDetails.tsx — read from admin_settings or fall back to 0.05
// A lightweight helper that calls GET /api/settings (existing endpoint) or falls back:
const [platformFeeRate, setPlatformFeeRate] = useState(0.05);
useEffect(() => {
  fetch('/api/settings')
    .then(r => r.json())
    .then(d => {
      const rate = d?.settings?.platformFeeRate;
      if (typeof rate === 'number' && rate > 0 && rate < 1) {
        setPlatformFeeRate(rate);
      }
    })
    .catch(() => {}); // silent fallback to 0.05
}, []);
```

### 4.2 Cashout Suppression for Event Wagers

**File: `components/wagers/UserWagerActions.tsx`**

The component already receives a `wager` prop of type `Wager`. Extend the Wager type with `wagerType`:

```typescript
// In types/game.types.ts — add to Wager interface:
wagerType?: 'p2p' | 'event';
```

In `UserWagerActions.tsx`, conditionally hide the Cashout button:

```tsx
{isOpen && (
  <div className="flex gap-2">
    <Button
      variant="outline"
      className="flex-1 ..."
      onClick={onIncreaseBet}
    >
      Increase Bet
    </Button>
    {(wager.wagerType ?? 'p2p') === 'p2p' && (
      <Button
        variant="destructive"
        className="flex-1 bg-red-600 hover:bg-red-700 text-white"
        onClick={onCashout}
      >
        Cashout
      </Button>
    )}
  </div>
)}
```

---

## Data Models

### New / Modified Tables

| Table | Change | Purpose |
|-------|--------|---------|
| `users` | +`totalWinnings`, +`wagersPlayed`, +`weeklyWinnings`, +`weeklyWagerCount` | Leaderboard denormalized counters |
| `wager_participants` | +`oddsAtBet DECIMAL(5,2)` | Freeze odds at join time for event wagers |
| `friendships` | New table | Social graph (pending / accepted / rejected) |
| `wagers` | `wagerType` (from foundations) | Distinguish event vs p2p |

### LeaderboardRow Shape (API response)

```typescript
// Global / Friends tab
interface GlobalLeaderboardRow {
  id: string;
  nickname: string;
  avatarUrl: string | null;
  totalWinnings: number;
  wagersPlayed: number;
  gamePoints: number;
  // computed client-side:
  rank: number;
  tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond';
}

// Weekly tab
interface WeeklyLeaderboardRow {
  id: string;
  nickname: string;
  avatarUrl: string | null;
  weeklyWinnings: number;
  weeklyWagerCount: number;
  gamePoints: number;
  rank: number;
  tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond';
}
```

### Friendship Shape (API response)

```typescript
interface FriendshipResponse {
  id: string;
  requesterId: string;
  addresseeId: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
  updatedAt: string;
  // included for list endpoints:
  friendId?: string;
  friendNickname?: string;
  friendAvatarUrl?: string | null;
}
```

---

## Error Handling

| Scenario | Behavior |
|----------|----------|
| Leaderboard API — invalid `type` param | HTTP 400 `{ success: false, message: 'Invalid leaderboard type' }` |
| Leaderboard API `friends` — no session | HTTP 401 `{ success: false, message: 'Unauthorized' }` |
| WeeklyReset — DB error | Log error; process continues (no crash) |
| `createWagerParticipant` EventWager — `odds` absent | Log warning; store `oddsAtBet = 1.00`; continue |
| `resolveWagerService` EventWager — no winners | Return `{ success: false, message: 'No winners found.' }` |
| `POST /api/friends` — self-request | HTTP 400 `{ success: false, message: 'Cannot send a friend request to yourself' }` |
| `POST /api/friends` — duplicate | HTTP 409 `{ success: false, message: 'Friend request already exists' }` |
| `PUT /api/friends/[id]` — not addressee | HTTP 403 `{ success: false, message: 'Forbidden' }` |
| Any FriendsAPI — no session | HTTP 401 `{ success: false, message: 'Unauthorized' }` |
| `notifyFriendRequest` — notification fails | Log error; friendship creation already committed; no rollback |
| `BetConfirmationModal` — `oddsAtBet` is 0/absent for EventWager | Render "—" as potential return; hide odds line |
| Homepage leaderboard widget — fetch fails | Render empty state card; no unhandled exception |

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Winner leaderboard counters increment correctly

*For any* resolved wager (P2P or Event) with at least one winner, after `resolveWagerService` commits: each winning participant's `totalWinnings` and `weeklyWinnings` each increase by exactly their net payout amount, while non-winning participants' totals remain unchanged.

**Validates: Requirements 1.5**

---

### Property 2: Wagers-played counters increment for every participant

*For any* resolved wager and any participant in that wager (whether winner or loser), after `resolveWagerService` commits: that participant's `wagersPlayed` increases by exactly 1 and `weeklyWagerCount` increases by exactly 1.

**Validates: Requirements 1.6**

---

### Property 3: Weekly reset zeroes all counters

*For any* set of users with any non-negative values of `weeklyWinnings` and `weeklyWagerCount`, after the WeeklyReset job executes successfully: every user in the `users` table has `weeklyWinnings = 0` and `weeklyWagerCount = 0`.

**Validates: Requirements 2.2**

---

### Property 4: Leaderboard ordering invariant

*For any* set of users returned by `GET /api/leaderboard?type=global`, the response array is sorted in non-increasing order of `totalWinnings` and its length does not exceed 50. The same ordering invariant holds for `type=weekly` (sorted by `weeklyWinnings`) and `type=friends` (sorted by `totalWinnings` among the authenticated user's accepted friends).

**Validates: Requirements 3.1, 3.2, 3.3**

---

### Property 5: Tier badge is a pure function of gamePoints

*For any* non-negative integer `gamePoints`, `computeTier(gamePoints)` returns exactly one of: Bronze (0–99), Silver (100–499), Gold (500–999), Platinum (1000–4999), Diamond (5000+). The thresholds are inclusive-lower-exclusive-upper except Diamond which is inclusive on both sides.

**Validates: Requirements 4.4**

---

### Property 6: Tied-rank assignment

*For any* list of users pre-sorted descending by rank score, `assignRanks` assigns the same rank number to all users sharing the same score at any position, and the next rank number after a group of `k` tied users is `position + k` where `position` is the 1-based index of the first tied user.

**Validates: Requirements 4.3**

---

### Property 7: PinnedRow appears when and only when rank > 50

*For any* authenticated user whose computed rank in the active leaderboard tab exceeds 50, the leaderboard page renders that user's row a second time as a pinned element at the bottom of the visible list. For any authenticated user whose rank is ≤ 50, no pinned duplicate row is rendered.

**Validates: Requirements 4.5**

---

### Property 8: EventWager card renders EVENT badge and per-option odds

*For any* wager card where `wagerType === 'event'`, the rendered HTML contains the text "EVENT" and, for each option, a string matching `<value>x`. For any card where `wagerType === 'p2p'`, neither the "EVENT" badge nor any `<value>x` odds label is present.

**Validates: Requirements 9.1, 9.2, 9.3**

---

### Property 9: oddsAtBet round-trip for EventWager participants

*For any* EventWager option with a numeric `odds` value in `wager.options`, calling `createWagerParticipant` with that option stores `oddsAtBet` equal to `wager.options[selectedOption].odds`. For any P2PWager participant, `oddsAtBet = 1.00` regardless of input.

**Validates: Requirements 7.2, 7.3**

---

### Property 10: EventWager NetPayout formula correctness

*For any* EventWager winner with `amount` (stake), `oddsAtBet`, and `platformFeeRate`: after `resolveWagerService` commits, the winner's balance increment equals `amount × oddsAtBet × (1 - platformFeeRate)` rounded to two decimal places, and the inserted `transactions` row has `amount` equal to that same value.

**Validates: Requirements 8.1, 8.5**

---

### Property 11: EventPlatformFee formula correctness

*For any* resolved EventWager with a set of winners, the inserted PlatformFeeTransaction amount equals `SUM(winner.amount × winner.oddsAtBet) × platformFeeRate`.

**Validates: Requirements 8.2**

---

### Property 12: P2P resolution path is unmodified

*For any* P2PWager resolved by `resolveWagerService`, the payout to each winner equals their proportional share of the total pool minus the platform fee — identical to the computation defined in wagerx-foundations Requirement 2 — and no `oddsAtBet` multiplication is applied.

**Validates: Requirements 8.3, 8.4**

---

### Property 13: CashoutButton present on P2P wagers, absent on Event wagers

*For any* WagerDetails page rendered for a P2PWager where `isOpen === true` and the user is a participant, the CashoutButton is rendered. *For any* WagerDetails page rendered for an EventWager, the CashoutButton is absent regardless of wager status or user participation.

**Validates: Requirements 10.1, 10.2**

---

### Property 14: Friendship creation is idempotent-guarded

*For any* pair `(requesterId, addresseeId)` where a Friendship row already exists (in any status), `POST /api/friends` returns HTTP 409 and no new row is inserted. For any distinct pair where no Friendship row exists, the response is HTTP 201 and a new row with `status = 'pending'` is present in the database.

**Validates: Requirements 11.2, 11.4**

---

### Property 15: FriendsAPI authorization gate

*For any* request to any endpoint under `/api/friends` or `/api/friends/[id]` that carries no valid JWT session, the response status is 401 and the body matches `{ success: false, message: 'Unauthorized' }`.

**Validates: Requirements 11.10**

---

### Property 16: Friend list completeness and symmetry

*For any* authenticated user U, `GET /api/friends` returns exactly the set of users who have an accepted Friendship row with U in either direction (`requesterId = U` or `addresseeId = U`), and no users outside that set.

**Validates: Requirements 11.8**

---

### Property 17: Friend request notification correctness

*For any* successfully created FriendRequest, the resulting notification row has `userId = addresseeId`, `category = 'social'`, `type = 'friend_request'`, `buttonLink = '/profile?userId=<requesterId>'`, and `buttonText = 'View Request'`.

**Validates: Requirements 12.1**

---

### Property 18: Notification backward compatibility

*For any* call to `createNotification` that omits `buttonLink` and/or `buttonText`, the persisted notification row has `buttonLink = NULL` and `buttonText = NULL`.

**Validates: Requirements 12.3**

---

### Property 19: Profile friendship button reflects current state

*For any* authenticated user U viewing another user V's profile page: if no Friendship row exists between U and V, the page renders "Add Friend"; if a pending row exists with `requesterId = U`, the page renders "Cancel Request"; if an accepted row exists, the page renders "Unfriend". No other button states are possible.

**Validates: Requirements 14.1, 14.3, 14.5**

---

### Property 20: InviteFriendsModal client-side search

*For any* non-empty search term T and any loaded friends list, the filtered list contains exactly those friends whose `nickname` contains T (case-insensitive). No friends outside that predicate appear in the filtered list.

**Validates: Requirements 15.3**

---

### Property 21: EventWager BetConfirmationModal potential return formula

*For any* EventWager bet confirmation with `betAmount`, `oddsAtBet > 0`, and `platformFeeRate`, the displayed potential return value equals `betAmount × oddsAtBet × (1 - platformFeeRate)` formatted to two decimal places. When `oddsAtBet` is absent or zero, the displayed value is "—".

**Validates: Requirements 16.2, 16.4**

---

### Property 22: P2PWager BetConfirmationModal layout is unchanged

*For any* P2PWager bet confirmation, the modal renders the existing layout without any odds line, event disclaimer, or `oddsAtBet` display.

**Validates: Requirements 16.3**
