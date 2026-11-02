# Implementation Plan: WagerX Foundations

## Overview

Five targeted hardening changes to the WagerX platform, implemented in TypeScript (Next.js / mysql2). Each task maps directly to a file or component identified in the design. Tasks 1 and 2 are independent of each other and can run in parallel. Tasks 3 and 4 are independent of each other. Task 5 (schema + service layer) must land before Tasks 6 and 7 (UI). Task 8 (property-based tests) depends on all prior tasks.

---

## Tasks

- [x] 1. Atomic participant join with debit transaction record
  - [x] 1.1 Refactor `createWagerParticipant` to use a dedicated mysql2 connection with `BEGIN`/`COMMIT`/`ROLLBACK`
    - Replace all `pool.query` calls with `conn.query` on a single connection obtained via `pool.getConnection()`
    - Add `SELECT balance FROM users WHERE id = ? FOR UPDATE` as the first statement inside the transaction to acquire a ForUpdateLock
    - Throw `Error('Insufficient balance')` and rollback if the locked balance is less than `data.amount`
    - Keep existing steps: INSERT wager_participants, UPDATE wagers totalPool, UPDATE users balance
    - Add `conn.release()` in a `finally` block
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [x] 1.2 Insert a WagerDebit row inside the same `createWagerParticipant` transaction
    - After the balance deduction step, add `conn.query(INSERT INTO transactions ...)` with `type='wager_debit'`, `status='completed'`, `provider='internal'`, `reference=wager_debit_<wagerId>_<userId>_<Date.now()>`, `processingFee=0`, `netAmount=amount`
    - This insert must be inside the same `conn` transaction so any failure rolls everything back
    - Remove the separate `getUserBalance` import/call from the route handler (balance check moves into the service)
    - _Requirements: 2.1, 2.6_

  - [ ]* 1.3 Write property test for participant join consistency
    - **Property 1: Participant join consistency** — after a successful join, balance decreases by exactly `amount`, `totalPool` increases by exactly `amount`, a `wager_participants` row exists, and a `transactions` row of `type='wager_debit'` exists with correct `userId` and `amount`
    - **Property 2: Insufficient balance atomicity** — when balance < amount, all four records remain unchanged from pre-call values
    - **Validates: Requirements 1.1, 1.3, 2.1, 2.6**

- [x] 2. Atomic wager resolution with credit transactions, platform fee, and gamePoints
  - [x] 2.1 Refactor `resolveWagerService` to use an AtomicTransaction (dedicated connection)
    - Wrap all writes in `conn.beginTransaction()` / `conn.commit()` / `conn.rollback()` with `conn.release()` in `finally`
    - Change the opening wager fetch to `SELECT * FROM wagers WHERE id = ? FOR UPDATE` (ForUpdateLock) using `conn.query`
    - Add `SELECT ... FOR UPDATE` on participant rows before iterating
    - On "already resolved" or "not authorized": rollback and return `{ success: false, message: ... }`
    - On any SQL error: rollback and return `{ success: false, message: error.message }`
    - _Requirements: 1.6, 1.7, 1.8_

  - [x] 2.2 Add `readAdminSettings` helper and platform fee logic inside `resolveWagerService`
    - Implement `readAdminSettings(conn)` as a local function in `wagerService.ts` that runs `SELECT data FROM admin_settings WHERE id = 'main'` via the passed `conn` and JSON-parses the result
    - Read `platformFeeRate` (default `0.05`) and `platformFeeAccountId` (default `null`) from settings
    - Compute `fee = Math.floor(totalPool × feeRate)`
    - If `platformFeeAccountId` is present: `UPDATE users SET balance = balance + fee WHERE id = platformFeeAccountId` and INSERT a PlatformFeeTransaction row (`type='wager_credit'`, `reference=platform_fee_<wagerId>_<Date.now()>`)
    - If `platformFeeAccountId` is absent: log a warning and skip (do not throw)
    - _Requirements: 2.3, 2.4, 2.5_

  - [x] 2.3 Insert WagerCredit rows per winner and update winner balances inside the ResolutionTransaction
    - For each winning participant compute `winAmount = (winner.amount / winnerTotalStake) × totalPool` (using the pool **before** fee deduction matches existing behavior; adjust only if design specifies post-fee pool)
    - `UPDATE users SET balance = balance + winAmount WHERE id = winner.userId`
    - INSERT transactions row: `type='wager_credit'`, `reference=wager_credit_<wagerId>_<userId>_<Date.now()>`, `status='completed'`, `provider='internal'`
    - Reuse existing `createSettlement`, `createSettledUser`, `updateSettlementStatus` calls but move them inside the same `conn` transaction using `conn.query` overrides or by passing `conn` to those helpers
    - _Requirements: 2.2_

  - [x] 2.4 Add gamePoints awards inside the ResolutionTransaction
    - For every participant (winners and losers) compute `basePoints = Math.floor(participant.amount / 100)`
    - Losers: `UPDATE users SET gamePoints = gamePoints + basePoints WHERE id = participant.userId`
    - Winners: `UPDATE users SET gamePoints = gamePoints + (basePoints * 3) WHERE id = participant.userId`
    - Execute the UPDATE even when `basePoints === 0` (requirement 4.4)
    - All gamePoints UPDATEs run on `conn` inside the same ResolutionTransaction
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [ ]* 2.5 Write property test for resolution payout completeness
    - **Property 3: Resolution payout completeness** — every winning participant's balance increases by their proportional share, `isResolved=1`, `status='closed'`, and one `wager_credit` transaction row exists per winner
    - **Property 4: Platform fee calculation correctness** — PlatformFeeTransaction amount equals `Math.floor(P × R)` for pool P and rate R
    - **Validates: Requirements 1.6, 2.2, 2.3, 2.4**

  - [ ]* 2.6 Write property test for gamePoints award formula
    - **Property 7: gamePoints award formula** — losers receive `Math.floor(amount / 100)` points, winners receive `Math.floor(amount / 100) × 3` points, award executes even when result is 0
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.4**

- [ ] 3. Checkpoint — verify atomicity before proceeding to auth
  - Ensure `createWagerParticipant` and `resolveWagerService` compile without TypeScript errors
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. API authentication guards on `/api/wagers`
  - [x] 4.1 Add `getToken` guard to `POST /api/wagers`
    - Import `getToken` from `next-auth/jwt` at the top of `app/api/wagers/route.ts`
    - Wrap the call in try/catch — return HTTP 500 `{ success: false, message: 'Authentication check failed' }` on exception
    - Return HTTP 401 `{ success: false, message: 'Unauthorized' }` if token is null
    - Override `data.creatorId` with `token.sub` before passing to `createWager`
    - _Requirements: 3.1, 3.6, 3.7_

  - [x] 4.2 Add `getToken` guard to `PUT /api/wagers`
    - Apply the identical try/catch + null-check pattern from 4.1
    - _Requirements: 3.2, 3.7_

  - [x] 4.3 Add `getToken` guard to `DELETE /api/wagers`
    - Apply the identical try/catch + null-check pattern from 4.1
    - _Requirements: 3.3, 3.7_

  - [ ]* 4.4 Write property test for unauthenticated wagers requests
    - **Property 5: Unauthenticated requests are rejected** — requests to POST/PUT/DELETE `/api/wagers` without a valid JWT return status 401 and body `{ success: false, message: 'Unauthorized' }`
    - **Property 6: Token identity override** — for `POST /api/wagers`, the `creatorId` in the created row matches `token.sub` regardless of any body-supplied value
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.6**

- [x] 5. API authentication guard on `/api/wager-participants`
  - [x] 5.1 Add `getToken` guard to `POST /api/wager-participants`
    - Import `getToken` from `next-auth/jwt`
    - Apply the identical try/catch + null-check pattern
    - Set `userId = token.sub as string`; remove the `userId` read from `req.json()` (or keep it but override with token value)
    - Remove the now-redundant `getUserBalance` import and balance check from the route handler (balance check lives in the service after Task 1)
    - _Requirements: 3.4, 3.5, 3.7_

  - [ ]* 5.2 Write property test for token identity override on wager-participants
    - **Property 6 (wager-participants leg): Token identity override** — when a request body carries a `userId` different from `token.sub`, the created `wager_participants` row uses `token.sub`
    - **Validates: Requirements 3.4, 3.5**

- [x] 6. Schema migration — add `wagerType` column to `wagers`
  - [x] 6.1 Append idempotent migration to `database/schema.sql`
    - Add `ALTER TABLE wagers ADD COLUMN IF NOT EXISTS wagerType ENUM('p2p', 'event') NOT NULL DEFAULT 'p2p';` under the MIGRATIONS section
    - _Requirements: 5.1_

  - [x] 6.2 Update `createWager` in `services/wagerService.ts` to persist `wagerType`
    - Read `wagerType` from `data.wagerType` with a fallback to `'p2p'`
    - Add `wagerType` to the INSERT column list and values array
    - _Requirements: 5.2_

  - [x] 6.3 Update `getFilteredWagers` in `services/wagerService.ts` to include `wagerType`
    - Add `w.wagerType` to the SELECT column list so downstream consumers receive the field
    - _Requirements: 5.8_

  - [ ]* 6.4 Write property test for wagerType default and persistence
    - **Property 8: wagerType default and persistence** — if `wagerType` is absent the stored row has `wagerType='p2p'`; if `'p2p'` or `'event'` is supplied the row reflects that value; every row from `getFilteredWagers` includes a `wagerType` field
    - **Validates: Requirements 5.2, 5.8**

- [ ] 7. Checkpoint — schema and service changes verified
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. BettingOptions component — conditional rendering based on wager type
  - [x] 8.1 Update `BettingOptions` props interface in `components/wagers/BettingOptions.tsx`
    - Change `BettingOption.odds` to `odds?: number` (optional)
    - Add new props to `BettingOptionsProps`: `wagerType: 'p2p' | 'event'`, `userStake: number`, `totalStakePerOption: Record<string, number>`
    - _Requirements: 5.6_

  - [x] 8.2 Implement conditional render inside the option card
    - For `wagerType === 'p2p'`: replace the existing `{option.odds}x` block with the ImpliedReturn display
      - When `totalStakePerOption[option.name] > 0`: compute `(userStake / totalStakePerOption[option.name]) × sum(Object.values(totalStakePerOption))` and render as `₦<value>` (`.toFixed(2)`) with label "Est. Return"
      - When `totalStakePerOption[option.name] === 0`: render `"—"` with label "Est. Return"
    - For `wagerType === 'event'`: render `{option.odds}x` with label "Odds" (existing behavior)
    - _Requirements: 5.3, 5.4, 5.5, 5.7_

  - [ ]* 8.3 Write property tests for BettingOptions rendering
    - **Property 9: ImpliedReturn display correctness** — for P2P wagers with `totalStakeOnOption > 0`, the component renders `₦<X>` where X equals `(userStake / totalStakePerOption[option.name]) × sum(totalStakePerOption)` to 2 decimal places; when `totalStakeOnOption === 0` it renders `"—"`
    - **Property 10: EventWager odds display** — for event wagers, the component renders `<odds>x` and "Odds" label and does NOT render "Est. Return" for any option
    - **Validates: Requirements 5.3, 5.4, 5.5, 5.7**

- [x] 9. Wire `BettingOptions` new props from `WagerDetails`
  - [x] 9.1 Add `totalStakePerOption` memo to `WagerDetails.tsx`
    - Derive `totalStakePerOption` from `processedOptions` using `useMemo`: `processedOptions.reduce((acc, o) => { acc[o.name] = o.totalAmount; return acc; }, {})`
    - _Requirements: 5.7_

  - [x] 9.2 Replace the inline "Choose Your Pick" grid in `WagerDetails.tsx` with the `BettingOptions` component
    - Import `BettingOptions` from `@/components/wagers/BettingOptions`
    - Pass all required props: `options={parsedOptions}`, `selectedOption`, `isExpired={isClosed}`, `onSelectOption={setSelectedOption}`, `wagerType={wager.wagerType ?? 'p2p'}`, `userStake={parseFloat(betAmount) || 0}`, `totalStakePerOption`
    - Derive `parsedOptions` by parsing `wager.options` JSON (the raw options array, not `processedOptions`)
    - _Requirements: 5.3, 5.4, 5.5, 5.6_

- [ ] 10. Final checkpoint — end-to-end integration
  - Ensure all tests pass, ask the user if questions arise.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Tasks 1 and 2 are independent and can be implemented in parallel
- Tasks 4 and 5 (auth guards) are independent and can be implemented in parallel
- Task 6 (schema migration) must be applied to the database before Tasks 8 and 9 are testable end-to-end
- The `conn.release()` call in `finally` is critical — without it, connections leak and the pool starves under load
- WagerDebit and WagerCredit inserts use an explicit `conn.query(INSERT ...)` rather than the existing `createTransaction` utility, because they must share the same connection object as the surrounding transaction
- Settlement service calls (`createSettlement`, `createSettledUser`, `updateSettlementStatus`) in Task 2.3 need to be ported to use `conn.query` — either by passing `conn` as a parameter or by inlining the SQL directly in `resolveWagerService`
- Property tests should use an in-memory or test-database fixture; do not run property tests against the production database

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "2.1", "4.1", "4.2", "4.3", "5.1", "6.1"] },
    { "id": 1, "tasks": ["1.2", "2.2", "2.3", "2.4", "6.2", "6.3"] },
    { "id": 2, "tasks": ["1.3", "2.5", "2.6", "4.4", "5.2", "6.4", "8.1"] },
    { "id": 3, "tasks": ["8.2", "9.1"] },
    { "id": 4, "tasks": ["8.3", "9.2"] }
  ]
}
```
