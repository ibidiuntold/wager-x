# Database Schema

All tables are defined in `database/schema.sql`. The schema uses `CREATE TABLE IF NOT EXISTS` and all migrations use `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`, making it safe to run multiple times.

Run against MySQL:
```bash
mysql -u <user> -p <database> < database/schema.sql
```

---

## Tables

### `users`
Primary user account table.

| Column | Type | Notes |
|---|---|---|
| `id` | VARCHAR(36) PK | UUID |
| `email` | VARCHAR(255) UNIQUE | |
| `password` | VARCHAR(255) | bcrypt hash |
| `firstName` | VARCHAR(100) | |
| `lastName` | VARCHAR(100) | |
| `nickname` | VARCHAR(100) UNIQUE | |
| `dob` | DATE | |
| `phoneNumber` | VARCHAR(20) | |
| `avatarUrl` | VARCHAR(500) | |
| `referralCode` | VARCHAR(20) UNIQUE | |
| `role` | ENUM('user','admin') | Default: 'user' |
| `status` | ENUM('active','inactive','suspended','banned','pending') | Default: 'pending' |
| `emailVerified` | TINYINT(1) | 0 = unverified |
| `kycVerified` | TINYINT(1) | 0 = unverified |
| `balance` | DECIMAL(15,2) | Withdrawable balance |
| `walletBonus` | DECIMAL(15,2) | Non-withdrawable bonus |
| `gamePoints` | INT | For tier calculation |
| `totalWinnings` | DECIMAL(15,2) | v1.3 — global leaderboard |
| `wagersPlayed` | INT | v1.3 — global leaderboard |
| `weeklyWinnings` | DECIMAL(15,2) | v1.3 — weekly leaderboard |
| `weeklyWagerCount` | INT | v1.3 — weekly leaderboard |
| `lastLogin` | DATETIME | |
| `createdAt` / `updatedAt` | DATETIME | |

---

### `wagers`
Wager definitions.

| Column | Type | Notes |
|---|---|---|
| `id` | VARCHAR(36) PK | UUID |
| `creatorId` | VARCHAR(36) FK → users | |
| `title` | VARCHAR(300) | |
| `description` | TEXT | |
| `slug` | VARCHAR(350) UNIQUE | URL-safe identifier |
| `category` | VARCHAR(100) | |
| `image` | VARCHAR(500) | |
| `status` | ENUM('open','closed','settled','cancelled','rejected') | |
| `isResolved` | TINYINT(1) | 0 = active |
| `isPublic` | TINYINT(1) | Default: 1 |
| `options` | JSON | Array of `{name, odds?}` |
| `minimumEntry` | DECIMAL(15,2) | |
| `totalPool` | DECIMAL(15,2) | Sum of all participant amounts |
| `winningOption` | VARCHAR(300) | Set on resolution |
| `expiresAt` | DATETIME | |
| `wagerType` | ENUM('p2p','event') | v1.2 — Default: 'p2p' |
| `createdAt` / `updatedAt` | DATETIME | |

---

### `wager_participants`
One row per user per wager.

| Column | Type | Notes |
|---|---|---|
| `id` | VARCHAR(36) PK | UUID |
| `wagerId` | VARCHAR(36) FK → wagers | |
| `userId` | VARCHAR(36) FK → users | |
| `gameSessionId` | VARCHAR(36) | Optional game session link |
| `optionSelected` | VARCHAR(300) | User's chosen option |
| `amount` | DECIMAL(15,2) | Stake amount |
| `oddsAtBet` | DECIMAL(5,2) | v1.4 — Captured at join time for event wagers |
| `joinedAt` | DATETIME | |

---

### `transactions`
All financial movements.

| Column | Type | Notes |
|---|---|---|
| `id` | VARCHAR(36) PK | |
| `userId` | VARCHAR(36) FK | |
| `reference` | VARCHAR(100) UNIQUE | Paystack ref or internal |
| `providerReference` | VARCHAR(100) | Gateway ref |
| `amount` | DECIMAL(15,2) | |
| `netAmount` | DECIMAL(15,2) | After fee |
| `processingFee` | DECIMAL(15,2) | |
| `status` | ENUM('pending','processing','completed','failed','reversed') | |
| `type` | ENUM('deposit','withdrawal','bonus','refund','wager_debit','wager_credit') | |
| `provider` | VARCHAR(50) | 'paystack', 'internal', etc. |
| `metadata` | JSON | Optional extra data |
| `createdAt` | DATETIME | |

---

### `settlements`
Wager resolution records.

| Column | Notes |
|---|---|
| `id` | UUID |
| `wagerId` | FK → wagers |
| `creatorId` | FK → users (resolver) |
| `totalAmount` | Total pool at time of settlement |
| `status` | 'pending' → 'completed' |
| `notes` | Optional |
| `processedAt` | Timestamp when completed |
| `createdAt` | |

---

### `settled_users`
One row per winner per settlement.

| Column | Notes |
|---|---|
| `id` | UUID |
| `settlementId` | FK → settlements |
| `wagerId` | FK → wagers |
| `userId` | FK → users (winner) |
| `amount` | Net payout amount |
| `transactionId` | FK → transactions (optional) |

---

### `friendships` *(v1.5)*

| Column | Type | Notes |
|---|---|---|
| `id` | VARCHAR(36) PK | UUID |
| `requesterId` | VARCHAR(36) FK | Sender |
| `addresseeId` | VARCHAR(36) FK | Receiver |
| `status` | ENUM('pending','accepted','rejected') | Default: 'pending' |
| `createdAt` / `updatedAt` | DATETIME | |
| UNIQUE KEY | `(requesterId, addresseeId)` | Prevents duplicates in either direction |

---

### `notifications`

| Column | Notes |
|---|---|
| `id` | UUID |
| `userId` | NULL = global broadcast |
| `title` | VARCHAR(300) |
| `message` | TEXT |
| `type` | VARCHAR(50) |
| `category` | VARCHAR(50) |
| `status` | 0 = unread, 1 = read |
| `buttonLink` | Optional action URL |
| `buttonText` | Optional action label |
| `expiresAt` | Optional expiry |
| `createdAt` | |

---

### `admin_settings`
Single row (`id = 'main'`). Stores all site config as a JSON blob in the `data` column.

Key JSON fields (accessed via `adminSettingsService.ts`):
- `platformFeeRate` — float, default `0.05`
- `platformFeeAccountId` — userId to receive platform fees
- `paystackPublicKey` / `paystackSecretKey`
- `flutterwavePublicKey` / `flutterwaveSecretKey`
- SMTP settings
- SEO metadata
- Social links

---

### Other Tables (summary)

| Table | Purpose |
|---|---|
| `games` | Game catalog with slug as PK, settings as JSON |
| `game_sessions` | Real-time multiplayer game state (JSON columns) |
| `bonuses` | Bonus rule definitions |
| `bonus_users` | Bonus assignments to users |
| `referrals` | Referral codes and usage tracking |
| `comments` | Wager comments |
| `replies` | Replies to comments |
| `likes` | Likes on comments/replies (targetType ENUM) |
| `subscribers` | Newsletter subscriber list |
| `mailing_settings` | Per-user email preferences |
| `bank_details` | Per-user withdrawal bank account |

---

## Migration History

Migrations are at the bottom of `schema.sql`:

| Version | Change |
|---|---|
| v1.1 | `isPrivate` → `isPublic` rename on `wagers` |
| v1.2 | `wagerType ENUM('p2p','event')` added to `wagers` |
| v1.3 | `totalWinnings`, `wagersPlayed`, `weeklyWinnings`, `weeklyWagerCount` added to `users` |
| v1.4 | `oddsAtBet DECIMAL(5,2)` added to `wager_participants` |
| v1.5 | `friendships` table created |
