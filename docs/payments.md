# Payments

## Provider

**Paystack** — primary payment processor for NGN deposits and withdrawals.
**Flutterwave** — secondary processor (configurable in admin settings).

Keys are stored in `admin_settings.data` and read via `adminSettingsService`. Fallback to environment variables if not set in the database.

---

## Deposits

### Flow

1. User clicks "Deposit" in wallet modal
2. `DepositTab` calls `POST /api/payment/initialize`
3. Server creates a Paystack transaction via `paystackService.initializeTransaction()`
4. Client receives `authorization_url` and redirects or uses Paystack popup
5. On success, Paystack calls `POST /api/webhooks/paystack`
6. Webhook verifies signature and credits `users.balance`
7. Inserts a `transactions` row: `type='deposit'`, `status='completed'`

### Webhook Security

`/api/webhooks/paystack` validates the `x-paystack-signature` header (HMAC-SHA512 of the raw body using the Paystack secret key). Requests without a valid signature are rejected with 401.

---

## Withdrawals

### Flow

1. User submits withdrawal request in `WithdrawTab`
2. Bank account resolved via `POST /api/payment/resolve-account`
3. `POST /api/payment/withdrawal` creates a pending transaction
4. Admin reviews in `/admin/transactions`
5. Admin approves → balance debited, payout initiated

Withdrawals are manual — Paystack's Transfer API is used for the actual disbursement.

---

## Balance Model

| Field | Column | Description |
|---|---|---|
| Main balance | `users.balance` | Withdrawable. Credited by deposits and wager winnings. |
| Bonus balance | `users.walletBonus` | Non-withdrawable. Credited by bonuses and referrals. |

Both are read by `getUserBalance()` in `userService.ts`. The balance route returns both plus `totalBalance`.

---

## Transaction Records

Every financial movement creates a row in `transactions`:

| Movement | `type` | `provider` |
|---|---|---|
| Paystack deposit | `deposit` | `paystack` |
| Withdrawal | `withdrawal` | `paystack` |
| Join wager | `wager_debit` | `internal` |
| Win payout | `wager_credit` | `internal` |
| Platform fee | `wager_credit` | `internal` |
| Bonus credit | `bonus` | `internal` |

### WagerDebit (on join)
```
reference: wager_debit_<wagerId>_<userId>_<timestamp>
type: 'wager_debit'
status: 'completed'
provider: 'internal'
processingFee: 0
netAmount: amount
```

### WagerCredit (on win)
```
reference: wager_credit_<wagerId>_<userId>_<timestamp>
type: 'wager_credit'
status: 'completed'
provider: 'internal'
```

### Platform Fee Transaction
```
reference: platform_fee_<wagerId>_<timestamp>
type: 'wager_credit'
userId: platformFeeAccountId (from admin_settings)
```

---

## Platform Fee

Configured in Site Settings:
- `platformFeeRate` — percentage as decimal (default `0.05` = 5%)
- `platformFeeAccountId` — UUID of the account that receives fees

**P2P wager fee:** `Math.floor(totalPool × feeRate)` — deducted from pool before proportional distribution.

**Event wager fee:** `SUM(winner.amount × winner.oddsAtBet) × feeRate` — deducted from gross winner payouts.

If `platformFeeAccountId` is not configured, the fee step is skipped (logged as warning) and the resolution proceeds normally.

---

## Service Layer

`services/paystackService.ts` wraps all Paystack API calls:
- `initializeTransaction(email, amount, reference)`
- `verifyTransaction(reference)`
- `resolveAccountNumber(accountNumber, bankCode)`
- `initiateTransfer(amount, recipient, reason)`
