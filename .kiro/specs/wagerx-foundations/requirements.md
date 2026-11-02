# Requirements Document

## Introduction

WagerX Foundations is a cross-cutting hardening initiative that addresses five correctness and security gaps in the WagerX platform. The work spans the MySQL service layer, REST API authentication, financial transaction recording, player reward mechanics, and the front-end betting-options component.

The five areas are:
1. **Atomic DB transactions** — participant join and wager resolution must be wrapped in proper BEGIN/COMMIT/ROLLBACK database transactions so that balance, pool, and participant records can never diverge.
2. **Transaction record completeness** — every financial movement (participant join debit, winner credit, platform fee) must produce a row in the `transactions` table with the correct type, amount, and reference.
3. **API authentication** — mutating endpoints must verify the caller's JWT before acting, and must derive the acting user's identity from the verified token rather than the request body.
4. **gamePoints on resolution** — participants must receive game-point awards proportional to their stake at the moment a wager is resolved, with winners receiving an additional multiplier bonus.
5. **BettingOptions wager-type split** — the `wagers` table must carry an explicit `wagerType` column, and the `BettingOptions` component must render implied pool-share returns for P2P wagers and static multiplier odds for event wagers.

---

## Glossary

- **AtomicTransaction**: A MySQL connection-level BEGIN/COMMIT/ROLLBACK block that ensures all SQL statements within it succeed or are rolled back together.
- **ForUpdateLock**: A `SELECT ... FOR UPDATE` statement that acquires a row-level write lock inside an AtomicTransaction.
- **Participant**: A user row in `wager_participants` that records one user's stake and chosen option for a specific wager.
- **Pool**: The `totalPool` column on a `wagers` row; the sum of all participant `amount` values for that wager.
- **PlatformFeeRate**: A runtime-configurable decimal stored in `admin_settings.data` under the key `platformFeeRate`; defaults to `0.05` (5 %) when the key is absent.
- **PlatformFeeAccount**: The designated platform user account that receives fee credits; its `id` is stored in `admin_settings.data` under the key `platformFeeAccountId`.
- **WagerDebit**: A `transactions` row with `type = 'wager_debit'` representing a balance deduction when a user joins a wager.
- **WagerCredit**: A `transactions` row with `type = 'wager_credit'` representing a balance addition when a winner is paid out after wager resolution.
- **PlatformFeeTransaction**: A `transactions` row with `type = 'wager_credit'` and `userId` set to the PlatformFeeAccount that records the platform's cut of a resolved wager.
- **ResolutionTransaction**: The AtomicTransaction that runs when `resolveWagerService` executes; it encompasses participant fetch, winner payout, gamePoints update, transaction record insertion, settlement creation, and wager status update.
- **JwtSession**: The next-auth JWT decoded by `getToken({ req, secret: process.env.NEXTAUTH_SECRET })` from the `Authorization` or cookie header.
- **TokenUserId**: The `sub` field of a decoded JwtSession, which uniquely identifies the authenticated user.
- **GamePoints**: The integer `gamePoints` column on the `users` table representing a player's accumulated reward score.
- **BasePoints**: The integer result of `Math.floor(participantAmount / 100)` for a given participant at resolution time.
- **WinnerBonus**: An additional GamePoints award equal to `BasePoints × 2` granted exclusively to participants whose `optionSelected` matches the `winningOption`.
- **WagerType**: The `wagerType` column added to the `wagers` table; must be one of `'p2p'` or `'event'`.
- **P2PWager**: A wager with `wagerType = 'p2p'` where payouts are determined by proportional pool share; no pre-set odds exist.
- **EventWager**: A wager with `wagerType = 'event'` where each option carries an explicit static odds multiplier set by the wager creator.
- **ImpliedReturn**: For a P2PWager, the computed ratio `(userStake / totalStakeOnOption) × totalPool` shown to the user as their expected return if their option wins.
- **StaticOdds**: For an EventWager, the `odds` field stored on each option object inside `wagers.options` (JSON) displayed as a multiplier (e.g., `2.5x`).
- **BettingOptionsComponent**: The `components/wagers/BettingOptions.tsx` React component that renders the selectable outcome cards.
- **WagerService**: The `services/wagerService.ts` module.
- **ParticipantService**: The `services/wagerParticipantService.ts` module.
- **TransactionService**: The `services/transactionService.ts` module.

---

## Requirements

### Requirement 1: Atomic Participant Join

**User Story:** As a platform operator, I want participant join operations to be fully atomic so that a user's balance, the wager pool, the participant record, and the debit transaction record are always consistent.

#### Acceptance Criteria

1. WHEN `createWagerParticipant` is called, THE ParticipantService SHALL acquire a dedicated connection from the mysql2 pool and execute all database writes (participant insert, pool update, balance deduction, WagerDebit insert) within a single AtomicTransaction using `BEGIN`, `COMMIT`, and `ROLLBACK`.

2. WHEN the AtomicTransaction in `createWagerParticipant` begins, THE ParticipantService SHALL lock the target `users` row with a ForUpdateLock (`SELECT balance FROM users WHERE id = ? FOR UPDATE`) before reading the balance.

3. WHEN the ForUpdateLock balance check in `createWagerParticipant` determines that the user's locked balance is less than the requested `amount`, THE ParticipantService SHALL roll back the AtomicTransaction and throw an error with the message `'Insufficient balance'`.

4. IF any SQL statement within the `createWagerParticipant` AtomicTransaction throws an error, THEN THE ParticipantService SHALL execute `ROLLBACK` on the dedicated connection before releasing it to the pool and re-throw the original error.

5. WHEN the `createWagerParticipant` AtomicTransaction commits successfully, THE ParticipantService SHALL release the dedicated connection back to the pool.

6. WHEN `resolveWagerService` is called, THE WagerService SHALL acquire a dedicated connection from the mysql2 pool and execute all database writes (wager status update, winner balance updates, GamePoints updates, WagerCredit inserts, PlatformFeeTransaction insert, settlement creation, settled_user inserts) within a single ResolutionTransaction using `BEGIN`, `COMMIT`, and `ROLLBACK`.

7. WHEN the ResolutionTransaction in `resolveWagerService` begins, THE WagerService SHALL lock the target `wagers` row with a ForUpdateLock (`SELECT * FROM wagers WHERE id = ? FOR UPDATE`) before reading wager state.

8. IF any SQL statement within the ResolutionTransaction throws an error, THEN THE WagerService SHALL execute `ROLLBACK` on the dedicated connection before releasing it and return `{ success: false, message: <error message> }`.

---

### Requirement 2: Transaction Record Completeness

**User Story:** As a platform operator, I want every financial movement to produce a corresponding `transactions` table row so that the ledger is auditable and reconcilable.

#### Acceptance Criteria

1. WHEN `createWagerParticipant` commits its AtomicTransaction, THE ParticipantService SHALL insert a WagerDebit row into `transactions` with `type = 'wager_debit'`, `userId` set to the joining user's id, `amount` equal to the participant's stake, `status = 'completed'`, `provider = 'internal'`, and a unique `reference` in the format `wager_debit_<wagerId>_<userId>_<timestamp>`.

2. WHEN `resolveWagerService` commits its ResolutionTransaction, THE WagerService SHALL insert one WagerCredit row into `transactions` per winner with `type = 'wager_credit'`, `userId` set to the winner's id, `amount` equal to the winner's proportional payout, `status = 'completed'`, `provider = 'internal'`, and a unique `reference` in the format `wager_credit_<wagerId>_<userId>_<timestamp>`.

3. WHEN `resolveWagerService` commits its ResolutionTransaction, THE WagerService SHALL compute the platform fee as `Math.floor(totalPool × PlatformFeeRate)` and insert a PlatformFeeTransaction row into `transactions` with `type = 'wager_credit'`, `userId` set to the PlatformFeeAccountId read from `admin_settings`, `amount` equal to the computed fee, `status = 'completed'`, `provider = 'internal'`, and a unique `reference` in the format `platform_fee_<wagerId>_<timestamp>`.

4. WHEN `resolveWagerService` reads `admin_settings` and the `platformFeeRate` key is absent or null, THE WagerService SHALL use a default PlatformFeeRate of `0.05`.

5. WHEN `resolveWagerService` reads `admin_settings` and the `platformFeeAccountId` key is absent or null, THE WagerService SHALL skip the PlatformFeeTransaction insert and log a warning rather than throwing an error.

6. WHEN the WagerDebit insert in `createWagerParticipant` fails, THE ParticipantService SHALL roll back the entire AtomicTransaction so that no balance deduction, participant record, or pool update persists.

---

### Requirement 3: API Authentication

**User Story:** As a platform operator, I want mutating API endpoints to verify the caller's identity so that only authenticated users can create or modify wagers and wager participation.

#### Acceptance Criteria

1. WHEN the `POST /api/wagers` handler receives a request, THE API SHALL call `getToken({ req, secret: process.env.NEXTAUTH_SECRET })` and return HTTP 401 with `{ success: false, message: 'Unauthorized' }` if the returned token is null or undefined.

2. WHEN the `PUT /api/wagers` handler receives a request, THE API SHALL call `getToken({ req, secret: process.env.NEXTAUTH_SECRET })` and return HTTP 401 with `{ success: false, message: 'Unauthorized' }` if the returned token is null or undefined.

3. WHEN the `DELETE /api/wagers` handler receives a request, THE API SHALL call `getToken({ req, secret: process.env.NEXTAUTH_SECRET })` and return HTTP 401 with `{ success: false, message: 'Unauthorized' }` if the returned token is null or undefined.

4. WHEN the `POST /api/wager-participants` handler receives a request, THE API SHALL call `getToken({ req, secret: process.env.NEXTAUTH_SECRET })` and return HTTP 401 with `{ success: false, message: 'Unauthorized' }` if the returned token is null or undefined.

5. WHEN the `POST /api/wager-participants` handler has verified the JwtSession, THE API SHALL set the `userId` field for `createWagerParticipant` to the TokenUserId extracted from the decoded token, ignoring any `userId` value present in the request body.

6. WHEN the `POST /api/wagers` handler has verified the JwtSession and the request body contains a `creatorId` field, THE API SHALL override `creatorId` with the TokenUserId from the decoded token.

7. IF `getToken` throws an error during any of the above token-verification calls, THEN THE API SHALL return HTTP 500 with `{ success: false, message: 'Authentication check failed' }`.

---

### Requirement 4: gamePoints on Resolution

**User Story:** As a player, I want to earn game points whenever I participate in a resolved wager so that my engagement is rewarded and I can progress through platform levels.

#### Acceptance Criteria

1. WHEN `resolveWagerService` executes its ResolutionTransaction, THE WagerService SHALL compute BasePoints for each participant as `Math.floor(participant.amount / 100)`.

2. WHEN `resolveWagerService` processes a participant whose `optionSelected` does not match `winningOption`, THE WagerService SHALL add BasePoints to that participant's `users.gamePoints` column via `UPDATE users SET gamePoints = gamePoints + ? WHERE id = ?` within the ResolutionTransaction.

3. WHEN `resolveWagerService` processes a winner participant whose `optionSelected` matches `winningOption`, THE WagerService SHALL add `BasePoints + WinnerBonus` (i.e., `BasePoints × 3`) to that participant's `users.gamePoints` column within the ResolutionTransaction.

4. WHEN a participant's computed BasePoints equals zero (i.e., `Math.floor(amount / 100) === 0`), THE WagerService SHALL still execute the `UPDATE users SET gamePoints` statement for that participant with a value of `0`, ensuring no participant is silently skipped.

5. WHEN the GamePoints update statements are executed, THE WagerService SHALL execute them inside the same ResolutionTransaction so that a failure in any GamePoints update causes a full rollback of all resolution writes.

---

### Requirement 5: BettingOptions Wager-Type Split

**User Story:** As a bettor, I want to see relevant payout information — pool-share returns for P2P wagers and fixed odds for event wagers — so that I can make informed betting decisions.

#### Acceptance Criteria

1. THE WagerService SHALL support a schema migration that adds the column `wagerType ENUM('p2p', 'event') NOT NULL DEFAULT 'p2p'` to the `wagers` table if the column does not already exist.

2. WHEN a wager is created via `createWager`, THE WagerService SHALL persist the `wagerType` value from the input data; IF `wagerType` is absent from the input, THEN THE WagerService SHALL default to `'p2p'`.

3. WHEN the BettingOptionsComponent renders an option for a P2PWager, THE BettingOptionsComponent SHALL display the ImpliedReturn computed as `(userStake / totalStakeOnOption) × totalPool` formatted to two decimal places in the local currency symbol (₦), with a label "Est. Return".

4. WHEN the BettingOptionsComponent renders an option for a P2PWager and `totalStakeOnOption` equals zero, THE BettingOptionsComponent SHALL display "—" in place of the ImpliedReturn to avoid division by zero.

5. WHEN the BettingOptionsComponent renders an option for an EventWager, THE BettingOptionsComponent SHALL display the StaticOdds value from the option's `odds` field formatted as `<value>x` with a label "Odds", and SHALL NOT display an ImpliedReturn.

6. THE BettingOptionsComponent SHALL accept a `wagerType` prop of type `'p2p' | 'event'`, a `userStake` prop of type `number`, and a `totalStakePerOption` prop of type `Record<string, number>` in addition to its existing `options`, `selectedOption`, `isExpired`, and `onSelectOption` props.

7. WHEN the BettingOptionsComponent renders and `wagerType` is `'p2p'`, THE BettingOptionsComponent SHALL compute ImpliedReturn using `totalStakePerOption[option.name]` and the sum of all values in `totalStakePerOption` as the `totalPool`.

8. WHEN the `wagerType` column is added to `wagers`, THE WagerService `getFilteredWagers` function SHALL include `w.wagerType` in the `SELECT` column list so that downstream consumers receive the wager type.
