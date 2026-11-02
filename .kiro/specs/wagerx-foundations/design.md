# Design Document: WagerX Foundations

## Overview

This document covers the technical design for five targeted hardening changes to the WagerX platform. Each area is self-contained and touches a specific layer of the stack. The implementation reuses existing patterns (mysql2 pool, next-auth `getToken`, `createTransaction`) and introduces no new npm dependencies.

### Fix Areas Summary

| # | Area | Files Changed |
|---|------|---------------|
| 1 | Atomic DB transactions | `services/wagerParticipantService.ts`, `services/wagerService.ts` |
| 2 | Transaction record completeness | `services/wagerParticipantService.ts`, `services/wagerService.ts` |
| 3 | API authentication | `app/api/wagers/route.ts`, `app/api/wager-participants/route.ts` |
| 4 | gamePoints on resolution | `services/wagerService.ts` |
| 5 | BettingOptions wager-type split | `database/schema.sql`, `services/wagerService.ts`, `components/wagers/BettingOptions.tsx`, `components/wagers/WagerDetails.tsx` |

---

## Architecture

### Connection Model: Dedicated vs Pool

The current codebase uses `pool.query(...)` for all database access — adequate for independent reads but insufficient for multi-statement writes that must succeed or fail together.

The pattern change for Areas 1 & 2:

```
Normal read/write:          pool.query(sql, params)

Atomic multi-write:         const conn = await pool.getConnection()
                            try {
                              await conn.beginTransaction()
                              await conn.query(...)   // step 1
                              await conn.query(...)   // step 2
                              await conn.commit()
                            } catch (err) {
                              await conn.rollback()
                              throw err
                            } finally {
                              conn.release()          // always release
                            }
```

`pool.getConnection()` is already available from mysql2/promise — no new import needed. The `conn.release()` call in `finally` guarantees the connection returns to the pool regardless of outcome.

### Auth Guard Pattern

The existing pattern across the codebase (used in `/api/transactions`, `/api/settlement`, `/api/users`, etc.) is the canonical guard:

```typescript
import { getToken } from 'next-auth/jwt';

const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
if (!token) {
  return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
}
// token.sub is the TokenUserId
```

Area 3 applies this exact guard to the four currently unprotected mutating handlers.

---

## Component and Data-Flow Design

### Area 1 & 2: Atomic Participant Join (`createWagerParticipant`)

**Current state:** Five separate `pool.query` calls — no transaction, no rollback path, no transaction record.

**New flow inside one AtomicTransaction on a dedicated connection:**

```
conn.beginTransaction()
  1. SELECT balance FROM users WHERE id = ? FOR UPDATE       ← ForUpdateLock
  2. Balance check → throw 'Insufficient balance' if low
  3. INSERT wager_participants (id, wagerId, userId, ...)
  4. UPDATE wagers SET totalPool = totalPool + ?
  5. UPDATE users SET balance = balance - ?
  6. INSERT transactions (WagerDebit row)                    ← new
conn.commit()
conn.release()   ← in finally
```

**WagerDebit record shape:**

```typescript
{
  id:         uuidv4(),
  userId:     data.userId,
  wagerId:    data.wagerId,   // stored in metadata / reference
  reference:  `wager_debit_${data.wagerId}_${data.userId}_${Date.now()}`,
  amount:     data.amount,
  netAmount:  data.amount,
  processingFee: 0,
  status:     'completed',
  type:       'wager_debit',
  provider:   'internal',
}
```

The `createTransaction` utility in `transactionService.ts` does not currently accept `type: 'wager_debit'` — it omits `amount`/`netAmount`/`processingFee` from its parameter list. Rather than extending that utility, the WagerDebit insert will use an explicit `conn.query(INSERT ...)` inside the atomic block. This keeps the transaction on the same connection object and avoids mixing `pool.query` (different connection) with `conn.query` within the same logical transaction.

### Area 1 & 2: Atomic Wager Resolution (`resolveWagerService`)

**Current state:** Sequential `pool.query` calls, settlement service calls interleaved, no rollback path, no transaction records, no gamePoints.

**New ResolutionTransaction flow:**

```
conn.beginTransaction()
  1. SELECT * FROM wagers WHERE id = ? FOR UPDATE             ← ForUpdateLock
  2. Validate not already resolved, resolver is authorized
  3. Read admin_settings for platformFeeRate / platformFeeAccountId
  4. UPDATE wagers SET isResolved=1, status='closed', winningOption=?
  5. SELECT participants FOR UPDATE (lock all participant rows)
  6. For each participant:
       a. Compute basePoints = Math.floor(amount / 100)
       b. Compute isWinner = (optionSelected === winningOption)
       c. Compute pointsAward = isWinner ? basePoints * 3 : basePoints
       d. UPDATE users SET gamePoints = gamePoints + ? WHERE id = ?
       e. If isWinner:
            - Compute winAmount (proportional share of pool minus platform fee)
            - UPDATE users SET balance = balance + ?
            - INSERT transactions (WagerCredit row)
  7. If platformFeeAccountId present:
       a. Compute fee = Math.floor(totalPool × feeRate)
       b. UPDATE users SET balance = balance + fee WHERE id = platformFeeAccountId
       c. INSERT transactions (PlatformFeeTransaction row)
  8. INSERT settlements row
  9. INSERT settled_users rows (one per winner)
  10. UPDATE settlements SET status='completed'
conn.commit()
conn.release()   ← in finally
```

**Platform fee fallback logic:**

```typescript
const settings = await readAdminSettings(conn);   // conn.query on same connection
const feeRate = settings?.platformFeeRate ?? 0.05;
const feeAccountId = settings?.platformFeeAccountId ?? null;

if (!feeAccountId) {
  console.warn('[resolveWagerService] platformFeeAccountId not configured — skipping fee insert');
  // no throw, no rollback
}
```

A `readAdminSettings` helper reads `SELECT data FROM admin_settings WHERE id = 'main'` and JSON-parses the `data` column. It is a lightweight function that can live in `wagerService.ts` locally or be extracted to a shared `adminSettingsService.ts`.

**WagerCredit record shape (per winner):**

```typescript
{
  reference: `wager_credit_${wagerId}_${winner.userId}_${Date.now()}`,
  type:      'wager_credit',
  userId:    winner.userId,
  amount:    winAmount,
  status:    'completed',
  provider:  'internal',
}
```

**PlatformFeeTransaction record shape:**

```typescript
{
  reference: `platform_fee_${wagerId}_${Date.now()}`,
  type:      'wager_credit',
  userId:    feeAccountId,
  amount:    fee,
  status:    'completed',
  provider:  'internal',
}
```

### Area 3: API Authentication

**`app/api/wagers/route.ts` changes:**

- `POST`: add `getToken` guard at top; replace any body-supplied `creatorId` with `token.sub`.
- `PUT`: add `getToken` guard.
- `DELETE`: add `getToken` guard.
- All three: wrap `getToken` call in try/catch → return 500 `'Authentication check failed'` on exception.

**`app/api/wager-participants/route.ts` changes:**

- `POST`: add `getToken` guard; set `userId = token.sub` before calling `createWagerParticipant`, ignoring `req.body.userId`.

```typescript
// Pattern applied identically to all four handlers:
let token;
try {
  token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
} catch {
  return NextResponse.json({ success: false, message: 'Authentication check failed' }, { status: 500 });
}
if (!token) {
  return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
}
const tokenUserId = token.sub as string;
```

### Area 4: gamePoints on Resolution

gamePoints are computed and updated inside the ResolutionTransaction described in Area 1. The formula:

```typescript
const basePoints = Math.floor(participant.amount / 100);   // always an integer ≥ 0
const isWinner   = participant.optionSelected === winningOption;
const award      = isWinner ? basePoints * 3 : basePoints;  // 3× for winners (base + WinnerBonus of 2×)

// Always execute — even when award === 0
await conn.query(
  'UPDATE users SET gamePoints = gamePoints + ? WHERE id = ?',
  [award, participant.userId]
);
```

Because this UPDATE runs inside the ResolutionTransaction, any subsequent failure causes a full rollback including the gamePoints write.

### Area 5: BettingOptions Wager-Type Split

#### Schema Change

```sql
-- Add to wagers table (idempotent migration):
ALTER TABLE wagers
  ADD COLUMN IF NOT EXISTS wagerType ENUM('p2p', 'event') NOT NULL DEFAULT 'p2p';
```

`getFilteredWagers` in `wagerService.ts` adds `w.wagerType` to its `SELECT` list.

`createWager` in `wagerService.ts` reads `wagerType` from the input and falls back to `'p2p'`:

```typescript
const wagerType = data.wagerType ?? 'p2p';
// Added to INSERT column list and values array
```

#### Updated BettingOptions Component Props

```typescript
interface BettingOption {
  name: string;
  odds?: number;   // only meaningful for EventWager; optional for P2PWager
}

interface BettingOptionsProps {
  options: BettingOption[];
  selectedOption: string;
  isExpired: boolean;
  onSelectOption: (option: string) => void;
  // ── new props ──────────────────────────────────────
  wagerType: 'p2p' | 'event';
  userStake: number;                       // current user's entered stake amount
  totalStakePerOption: Record<string, number>;  // sum of wager_participants.amount per optionName
}
```

#### BettingOptions Rendering Logic

```typescript
// Inside the option card render, replacing the single odds display:

{wagerType === 'p2p' ? (
  <div className="text-right">
    <p className="text-sm text-gray-500">Est. Return</p>
    {totalStakePerOption[option.name] > 0 ? (
      <span className="text-lg font-bold text-purple-600 dark:text-purple-400">
        ₦{((userStake / totalStakePerOption[option.name]) *
            Object.values(totalStakePerOption).reduce((a, b) => a + b, 0) +
            userStake   // user's own stake is already reflected in totalPool calc
          ).toFixed(2)}
      </span>
    ) : (
      <span className="text-lg font-bold text-gray-400">—</span>
    )}
  </div>
) : (
  <div className="text-right">
    <p className="text-sm text-gray-500">Odds</p>
    <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">
      {option.odds}x
    </span>
  </div>
)}
```

> **Note on ImpliedReturn formula:** `totalPool` for the ImpliedReturn display is the sum of all values in `totalStakePerOption` (current live pool, not including the user's prospective new stake). The formula `(userStake / totalStakeOnOption) × totalPool` is applied where `totalPool = sum(totalStakePerOption)` and `totalStakeOnOption = totalStakePerOption[option.name]`. `WagerDetails.tsx` already computes `processedOptions` with per-option totals — those values feed directly into `totalStakePerOption`.

#### WagerDetails.tsx Integration

`WagerDetails.tsx` already computes:
- `processedOptions` (per-option total amounts from `participants`)
- `totalPool` (sum of all participant amounts)
- `betAmount` (user's input stake)

The `totalStakePerOption` prop is built from `processedOptions`:

```typescript
const totalStakePerOption = useMemo(() =>
  processedOptions.reduce<Record<string, number>>((acc, o) => {
    acc[o.name] = o.totalAmount;
    return acc;
  }, {}),
[processedOptions]);
```

The updated `BettingOptions` call in `WagerDetails.tsx` (replacing the current option rendering in "Choose Your Pick"):

```tsx
<BettingOptions
  options={parsedOptions}       // raw options array from wager.options JSON
  selectedOption={selectedOption}
  isExpired={isClosed}
  onSelectOption={setSelectedOption}
  wagerType={wager.wagerType ?? 'p2p'}
  userStake={parseFloat(betAmount) || 0}
  totalStakePerOption={totalStakePerOption}
/>
```

#### Schema Prep Note: `oddsAtBet` Column

Event wagers store static odds on the `wagers.options` JSON. A future improvement would record the odds seen by each participant at join time in a `wager_participants.oddsAtBet` column. This column is **not** added in this spec iteration — it is flagged here as a schema prep item for the EventWager settlement logic in a follow-up.

---

## Data Models

### Transaction Row (wager_debit / wager_credit)

These reuse the existing `transactions` table. The relevant fields:

| Column | wager_debit value | wager_credit value |
|--------|------------------|--------------------|
| `type` | `'wager_debit'` | `'wager_credit'` |
| `status` | `'completed'` | `'completed'` |
| `provider` | `'internal'` | `'internal'` |
| `reference` | `wager_debit_<wagerId>_<userId>_<ts>` | `wager_credit_<wagerId>_<userId>_<ts>` / `platform_fee_<wagerId>_<ts>` |
| `processingFee` | `0` | `0` |
| `netAmount` | equals `amount` | equals `amount` |

### wagers Table Addition

```
wagerType  ENUM('p2p', 'event')  NOT NULL  DEFAULT 'p2p'
```

No other schema changes are required for this spec.

---

## Error Handling

| Scenario | Behavior |
|----------|----------|
| `createWagerParticipant` — balance insufficient | Rollback; throw `Error('Insufficient balance')` |
| `createWagerParticipant` — any SQL error | Rollback; re-throw original error |
| `resolveWagerService` — wager already resolved | Rollback; return `{ success: false, message: 'Wager already resolved.' }` |
| `resolveWagerService` — resolver not authorized | Rollback; return `{ success: false, message: 'Only the wager creator or an admin can resolve this wager.' }` |
| `resolveWagerService` — any SQL error | Rollback; return `{ success: false, message: <error.message> }` |
| `resolveWagerService` — `platformFeeAccountId` missing | Log warning; skip fee insert; continue and commit |
| API guard — `getToken` returns null | Return HTTP 401 `{ success: false, message: 'Unauthorized' }` |
| API guard — `getToken` throws | Return HTTP 500 `{ success: false, message: 'Authentication check failed' }` |
| `BettingOptions` P2P — `totalStakeOnOption === 0` | Display `"—"` (no division attempted) |

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Participant join consistency

*For any* valid user with sufficient balance and any positive wager amount, after `createWagerParticipant` completes successfully: the user's balance decreases by exactly the staked amount, the wager's `totalPool` increases by exactly the staked amount, a `wager_participants` row exists for that user/wager pair, and a `transactions` row of `type='wager_debit'` exists with the correct `userId` and `amount`.

**Validates: Requirements 1.1, 2.1**

---

### Property 2: Insufficient balance atomicity

*For any* user whose current balance is less than the requested join amount, `createWagerParticipant` SHALL throw `'Insufficient balance'` and all four records (balance, pool, participant row, debit transaction) remain unchanged from their pre-call values.

**Validates: Requirements 1.3, 2.6**

---

### Property 3: Resolution payout completeness

*For any* wager with at least one participant on the winning option, after `resolveWagerService` completes: every winning participant's balance increases by their proportional share of the pool (minus platform fee), the wager row has `isResolved=1` and `status='closed'`, and one `transactions` row of `type='wager_credit'` exists per winner with the correct `userId` and `amount`.

**Validates: Requirements 1.6, 2.2**

---

### Property 4: Platform fee calculation correctness

*For any* resolved wager with total pool P and platform fee rate R, the inserted `PlatformFeeTransaction` amount equals `Math.floor(P × R)`.

**Validates: Requirements 2.3, 2.4**

---

### Property 5: Unauthenticated requests are rejected

*For any* request to `POST /api/wagers`, `PUT /api/wagers`, `DELETE /api/wagers`, or `POST /api/wager-participants` that carries no valid JWT session, the response status SHALL be 401 and the body SHALL match `{ success: false, message: 'Unauthorized' }`.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4**

---

### Property 6: Token identity override

*For any* authenticated request to `POST /api/wager-participants` where the request body contains a `userId` field different from the token's `sub`, the created `wager_participants` row SHALL use the `sub` value, not the body value. Equivalently for `POST /api/wagers`, the `creatorId` in the created row SHALL match `token.sub`.

**Validates: Requirements 3.5, 3.6**

---

### Property 7: gamePoints award formula

*For any* participant in a resolved wager: their `users.gamePoints` column increases by `Math.floor(amount / 100)` if they are a loser, and by `Math.floor(amount / 100) × 3` if they are a winner. This holds even when `Math.floor(amount / 100) === 0`.

**Validates: Requirements 4.1, 4.2, 4.3, 4.4**

---

### Property 8: wagerType default and persistence

*For any* call to `createWager`, if `wagerType` is absent from the input the stored row has `wagerType = 'p2p'`; if `wagerType` is `'p2p'` or `'event'` in the input the stored row reflects that value exactly. Every row returned by `getFilteredWagers` includes a `wagerType` field.

**Validates: Requirements 5.2, 5.8**

---

### Property 9: ImpliedReturn display correctness

*For any* P2P wager option where `totalStakeOnOption > 0`, the BettingOptionsComponent renders the string `₦<X>` where X equals `(userStake / totalStakePerOption[option.name]) × sum(totalStakePerOption)` formatted to two decimal places. When `totalStakeOnOption === 0` the component renders `"—"` for that option.

**Validates: Requirements 5.3, 5.4, 5.7**

---

### Property 10: EventWager odds display

*For any* event wager option with a numeric `odds` field, the BettingOptionsComponent renders a string containing `<odds>x` and the label `"Odds"`, and does NOT render an ImpliedReturn or "Est. Return" label for that option.

**Validates: Requirements 5.5**

---

## Components and Interfaces

### Service Functions

#### `createWagerParticipant(data)` — `services/wagerParticipantService.ts`

```typescript
interface CreateWagerParticipantInput {
  wagerId:        string;
  userId:         string;   // always token.sub — never trust request body
  optionSelected: string;
  amount:         number;
}

interface CreateWagerParticipantResult {
  success: boolean;
  message?: string;
}
```

Atomically: checks balance, inserts participant row, updates pool total, debits user balance, inserts WagerDebit transaction. Throws `Error('Insufficient balance')` if balance is too low; caller catches and returns 400.

---

#### `resolveWagerService(wagerId, winningOption, resolverId)` — `services/wagerService.ts`

```typescript
interface ResolveWagerInput {
  wagerId:       string;
  winningOption: string;
  resolverId:    string;   // must be wager creator or admin
}

interface ResolveWagerResult {
  success: boolean;
  message: string;
}
```

Atomically: locks wager row, validates authorization, credits winners, awards gamePoints, inserts WagerCredit and PlatformFee transactions, inserts settlement and settled_users rows.

---

#### `createWager(data)` — `services/wagerService.ts`

```typescript
interface CreateWagerInput {
  category:     string;
  description:  string;
  expiresAt:    string;
  image:        string;
  options:      Array<{ name: string; odds?: number }>;
  slug:         string;
  status?:      string;
  title:        string;
  minimumEntry: number;
  creatorId:    string;   // always token.sub
  wagerType?:   'p2p' | 'event';   // defaults to 'p2p'
}
```

---

#### `getFilteredWagers(filters)` — `services/wagerService.ts`

Returns an array of wager rows including `wagerType` in the `SELECT` list. No interface changes — existing filter params unchanged.

---

### API Route Contracts

| Route | Method | Auth Required | Input | Output |
|-------|--------|---------------|-------|--------|
| `/api/wagers` | `POST` | Yes — `token.sub` used as `creatorId` | Wager body | `{ success, wagerId }` |
| `/api/wagers` | `PUT` | Yes | `{ id, ...updates }` | `{ success }` |
| `/api/wagers` | `DELETE` | Yes | `{ id }` | `{ success }` |
| `/api/wager-participants` | `POST` | Yes — `token.sub` used as `userId` | `{ wagerId, optionSelected, amount }` | `{ success, message? }` |

All four handlers apply the canonical auth guard:

```typescript
let token;
try {
  token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
} catch {
  return NextResponse.json({ success: false, message: 'Authentication check failed' }, { status: 500 });
}
if (!token) {
  return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
}
const tokenUserId = token.sub as string;
```

---

### UI Components

#### `BettingOptions` — `components/wagers/BettingOptions.tsx`

```typescript
interface BettingOption {
  name:   string;
  odds?:  number;   // only meaningful for 'event' wagerType
}

interface BettingOptionsProps {
  options:              BettingOption[];
  selectedOption:       string;
  isExpired:            boolean;
  onSelectOption:       (option: string) => void;
  wagerType:            'p2p' | 'event';
  userStake:            number;
  totalStakePerOption:  Record<string, number>;
}
```

Renders per-option cards. For `p2p`: shows "Est. Return" computed from live pool ratios, or `"—"` when `totalStakeOnOption === 0`. For `event`: shows `<odds>x` under the label "Odds".

---

#### `WagerDetails` integration — `components/wagers/WagerDetails.tsx`

New derived state passed down to `BettingOptions`:

```typescript
const totalStakePerOption = useMemo(() =>
  processedOptions.reduce<Record<string, number>>((acc, o) => {
    acc[o.name] = o.totalAmount;
    return acc;
  }, {}),
[processedOptions]);
```

---

### Shared Helpers

#### `readAdminSettings(conn)` (local to `wagerService.ts` or extracted to `adminSettingsService.ts`)

```typescript
async function readAdminSettings(conn: PoolConnection): Promise<{
  platformFeeRate:      number;
  platformFeeAccountId: string | null;
} | null>
```

Executes `SELECT data FROM admin_settings WHERE id = 'main'` on the supplied dedicated connection and JSON-parses the `data` column. Returns `null` if no row found.

---

## Testing Strategy

All tests follow the project's existing test tooling and patterns (unit tests for services, integration-style tests for API routes via mocked `pool`). No new test framework is introduced.

### Unit Tests: Service Layer

#### `createWagerParticipant` — happy path

- Mock `pool.getConnection()` returning a `conn` stub with `beginTransaction`, `query`, `commit`, `release` spies.
- Assert `conn.beginTransaction()` called once.
- Assert `conn.query` called in order: `SELECT ... FOR UPDATE`, `INSERT wager_participants`, `UPDATE wagers SET totalPool`, `UPDATE users SET balance`, `INSERT transactions`.
- Assert `conn.commit()` called once.
- Assert `conn.release()` called in `finally` (verify it is called even when commit throws).

#### `createWagerParticipant` — insufficient balance

- Stub the `SELECT` query to return a user with balance = 0, requested amount = 100.
- Assert `conn.rollback()` called.
- Assert `conn.release()` called.
- Assert the thrown error message equals `'Insufficient balance'`.

#### `resolveWagerService` — gamePoints formula

- Stub participants: one winner with `amount = 500`, one loser with `amount = 200`.
- Assert the winner's `UPDATE users SET gamePoints` call uses award = `Math.floor(500 / 100) * 3 = 15`.
- Assert the loser's `UPDATE users SET gamePoints` call uses award = `Math.floor(200 / 100) = 2`.

#### `resolveWagerService` — already resolved

- Stub wager row with `isResolved = 1`.
- Assert rollback called and result is `{ success: false, message: 'Wager already resolved.' }`.

#### `resolveWagerService` — missing `platformFeeAccountId`

- Stub `admin_settings` to return `platformFeeRate: 0.05, platformFeeAccountId: null`.
- Assert no `INSERT transactions` call for platform fee.
- Assert `commit()` still called (no rollback).

---

### Unit Tests: UI Components

#### `BettingOptions` — P2P estimated return

- Render with `wagerType="p2p"`, `userStake=100`, `totalStakePerOption={{ A: 400, B: 200 }}`.
- Assert option A displays `₦${(100/400 * 600).toFixed(2)}` = `₦150.00`.
- Assert option B displays the corresponding ratio value.

#### `BettingOptions` — P2P zero-stake guard

- Render with `totalStakePerOption={{ A: 0 }}`.
- Assert option A renders `"—"` (not a number, not a division error).

#### `BettingOptions` — event odds display

- Render with `wagerType="event"`, `options=[{ name: 'Team A', odds: 2.5 }]`.
- Assert the label `"Odds"` is present.
- Assert the text `"2.5x"` is present.
- Assert `"Est. Return"` is NOT present.

---

### Integration Tests: API Routes

#### `POST /api/wager-participants` — unauthenticated

- Mock `getToken` to return `null`.
- Assert response status 401, body `{ success: false, message: 'Unauthorized' }`.

#### `POST /api/wager-participants` — `userId` from token, not body

- Mock `getToken` to return `{ sub: 'user-from-token' }`.
- Supply body `{ userId: 'attacker-id', wagerId: 'w1', optionSelected: 'A', amount: 100 }`.
- Assert `createWagerParticipant` is called with `userId = 'user-from-token'`, not `'attacker-id'`.

#### `POST /api/wagers` — unauthenticated

- Mock `getToken` to return `null`.
- Assert response status 401.

#### `POST /api/wagers` — `creatorId` from token

- Mock `getToken` to return `{ sub: 'token-creator' }`.
- Assert `createWager` is called with `creatorId = 'token-creator'`.

---

### Manual / Smoke Verification Checklist

| Scenario | Expected |
|----------|----------|
| Join wager with exact balance | Balance decreases, participant row present, WagerDebit in transactions |
| Join wager with insufficient balance | HTTP 400, no DB rows changed |
| Resolve wager — winner | Balance credit, WagerCredit transaction, gamePoints × 3 |
| Resolve wager — loser | No credit, gamePoints × 1 |
| Resolve wager — no fee account configured | Resolution succeeds, warning in server log, no fee transaction |
| Unauthenticated POST to `/api/wagers` | HTTP 401 |
| P2P BettingOptions with live stakes | "Est. Return" renders a ₦ value |
| Event wager option card | "Odds" label and `<n>x` value visible; "Est. Return" absent |
| Create wager without `wagerType` | Stored row has `wagerType = 'p2p'` |
