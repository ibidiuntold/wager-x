# API Reference

All routes live under `app/api/`. Authentication uses `getToken({ req, secret: process.env.NEXTAUTH_SECRET })` from `next-auth/jwt`.

**Standard auth guard pattern (applied to all mutating endpoints):**
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

## Authentication

| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/[...nextauth]` | NextAuth sign-in / sign-out / session |
| POST | `/api/auth/verify-email` | Verify email token |
| POST | `/api/auth/resend-verification` | Resend verification email |
| POST | `/api/auth/password-reset` | Request password reset |
| POST | `/api/auth/reset-password` | Reset password with token |

---

## Users

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/users` | — | Register new user |
| GET | `/api/users` | Admin JWT | List/filter users (admin) or own profile (user) |
| PUT | `/api/users` | JWT | Update own profile / password |
| GET | `/api/users/user?id=` | JWT | Get user by id (own data for users, any for admin) |
| GET | `/api/users/balance?userId=` | JWT | Get `walletBalance` + `walletBonus` |
| GET | `/api/users/check-availability` | — | Check nickname/email uniqueness |
| GET | `/api/users/stats` | Admin JWT | User statistics |
| PUT | `/api/users/status` | Admin JWT | Update user status |
| GET | `/api/users/wagers` | JWT | Get wagers participated by user |
| GET | `/api/users/comments` | JWT | Get user's comments |
| GET/PUT/DELETE | `/api/users/[userId]` | Admin JWT | Admin user management |

---

## Wagers

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/wagers` | — | List wagers (filtered, paginated) |
| POST | `/api/wagers` | JWT | Create wager (creatorId set from token) |
| PUT | `/api/wagers` | JWT | Update wager |
| DELETE | `/api/wagers` | JWT | Delete wager |
| POST | `/api/wagers/resolve` | JWT | Resolve wager — triggers AtomicResolutionTransaction |
| GET | `/api/wagers/stats` | Admin JWT | Wager statistics |
| GET | `/api/wagers/[wagerId]` | — | Get single wager by id |

**Note:** `POST /api/wagers` always uses `token.sub` as `creatorId`, ignoring any body-supplied value.

---

## Wager Participants

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/wager-participants` | JWT | Join wager (userId from token, not body) |
| GET | `/api/wager-participants/[wagerId]` | — | Get all participants for a wager |

---

## Friends

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/friends` | JWT | List accepted friends |
| GET | `/api/friends?type=requests` | JWT | Incoming pending requests |
| GET | `/api/friends?type=sent` | JWT | Outgoing pending requests |
| POST | `/api/friends` | JWT | Send friend request |
| PUT | `/api/friends/[id]` | JWT | Accept or reject (addressee only) |
| DELETE | `/api/friends/[id]` | JWT | Unfriend or cancel request |

---

## Leaderboard

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/leaderboard?type=global` | — | Top 50 by `totalWinnings` |
| GET | `/api/leaderboard?type=weekly` | — | Top 50 by `weeklyWinnings` + `isEmpty` flag |
| GET | `/api/leaderboard?type=friends` | JWT | Friends + self by `totalWinnings` |

Optional `?limit=N` param (max 50).

---

## Payments

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/payment/initialize` | JWT | Initialize Paystack payment |
| GET | `/api/payment/verify` | JWT | Verify payment after callback |
| POST | `/api/payment/resolve-account` | JWT | Resolve bank account number |
| POST | `/api/payment/withdrawal` | JWT | Submit withdrawal request |
| POST | `/api/webhooks/paystack` | Paystack sig | Paystack webhook receiver |

---

## Notifications

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/notifications` | JWT | Get user notifications |
| POST | `/api/notifications` | Admin JWT | Create/broadcast notification |
| PUT | `/api/notifications` | JWT | Mark read |
| DELETE | `/api/notifications` | JWT | Delete notification |

---

## Transactions

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/transactions` | JWT | Get transaction history |
| GET | `/api/transactions/stats` | Admin JWT | Transaction statistics |

---

## Settlements

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/settlement` | JWT | List settlements |
| GET | `/api/settlement/stats` | Admin JWT | Settlement statistics |
| GET/PUT | `/api/settlement/[id]` | Admin JWT | Get / update settlement |

---

## Comments, Replies, Likes

| Method | Path | Auth | Description |
|---|---|---|---|
| GET/POST | `/api/comments` | JWT (POST) | List / create comments |
| PUT/DELETE | `/api/comments/[commentId]` | JWT | Update / delete own comment |
| GET/POST | `/api/reply` | JWT (POST) | List / create replies |
| PUT/DELETE | `/api/reply/[replyId]` | JWT | Update / delete own reply |
| POST/DELETE | `/api/likes` | JWT | Toggle like |
| GET | `/api/likes/[targetId]` | — | Get like count |

---

## Bonuses

| Method | Path | Auth | Description |
|---|---|---|---|
| GET/POST | `/api/bonuses` | Admin JWT (POST) | List / create bonus |
| GET/PUT/DELETE | `/api/bonuses/[id]` | Admin JWT | Manage specific bonus |

---

## Referrals

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/referrals` | Admin JWT | List referrals |
| GET | `/api/referrals/code` | JWT | Get own referral code |
| GET | `/api/referrals/stats` | Admin JWT | Referral statistics |
| GET | `/api/referrals/[id]` | Admin JWT | Get referral by id |

---

## Subscribers (Newsletter)

| Method | Path | Auth | Description |
|---|---|---|---|
| GET/POST | `/api/subscribers` | — / Admin | List / subscribe |

---

## Admin

| Method | Path | Auth | Description |
|---|---|---|---|
| GET/POST/DELETE | `/api/admin/auth` | Admin JWT | Admin session management |
| GET/PUT | `/api/admin/settings` | Admin JWT | Read/write `admin_settings` JSON |
| POST | `/api/admin/newsletter/send` | Admin JWT | Send newsletter campaign |

---

## Settings (per-category)

| Method | Path | Auth | Description |
|---|---|---|---|
| GET/PUT | `/api/settings/system` | Admin JWT | System toggles |
| GET/PUT | `/api/settings/payment-gateways` | Admin JWT | Paystack / Flutterwave keys |
| GET/PUT | `/api/settings/smtp` | Admin JWT | Email settings |
| GET/PUT | `/api/settings/seo` | Admin JWT | SEO metadata |
| GET/PUT | `/api/settings/social-links` | Admin JWT | Social URLs |
