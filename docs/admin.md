# Admin Panel

## Access

Navigate to `/admin` or `/admin/login`. The admin panel is a separate layout tree protected by `AdminAuthWrapper` and `RoleGuard`.

**Entry points from the main site:**
- Navbar user dropdown → "Admin Panel" (visible when `role === 'admin'`)
- Mobile sidebar → "Admin Panel" link (purple icon, visible when `role === 'admin'`)

Both links go to `/admin/dashboard`.

---

## Layout

`app/admin/layout.tsx` → `AdminNav` → `AdminSidebar` + `AdminHeader`

The sidebar (`components/admin/AdminSidebar.tsx`) reads nav items from `lib/admin/config.ts`. The header shows a theme toggle, notification bell, and user dropdown.

---

## Navigation (navItems in `lib/admin/config.ts`)

| Item | Path | Notes |
|---|---|---|
| Dashboard | `/admin/dashboard` | Stats overview |
| Users | `/admin/users` | User management |
| Wagers | `/admin/wagers` | Wager management |
| Notifications | `/admin/notifications` | Broadcast system |
| Newsletter → Subscribers | `/admin/newsletter/subscribers` | Subscriber list |
| Newsletter → Broadcast | `/admin/newsletter/broadcast` | Send campaigns |
| Payments → Transactions | `/admin/transactions` | All transactions |
| Payments → Settlements | `/admin/settlements` | Wager payouts |
| Bonuses | `/admin/bonuses` | Bonus management |
| Referrals | `/admin/referrals` | Referral tracking |
| **Site Settings** | `/admin/settings` | Platform configuration |

---

## Site Settings (`/admin/settings`)

Powered by `components/admin/SiteSettings.tsx` and `hooks/admin/useAdminSiteSettings.ts`.

All settings are stored in `admin_settings.data` (JSON column, single row with `id = 'main'`).

**Tabs:**

### System
- Maintenance mode toggle
- Site name, description
- Registration on/off
- Feature flags

### Payment Gateways
- Paystack public + secret keys
- Flutterwave public + secret keys
- Enable/disable each gateway

### Platform Fees
- `platformFeeRate` — decimal (e.g. `0.05` = 5%)
- `platformFeeAccountId` — userId that receives collected fees

### SMTP
- Host, port, user, password, from-address
- Test email button

### SEO
- Title, description, OG image, keywords

### Social Links
- Twitter, Instagram, Facebook, LinkedIn, YouTube URLs

---

## User Management (`/admin/users`)

- View all users with pagination and filters (status, date range, search)
- Update user status: active / inactive / suspended / banned
- View individual user details, transaction history, wager history

---

## Wager Management (`/admin/wagers`)

- View all wagers
- **Create event wagers** with fixed odds via `AddWagerModal`
  - Select `wagerType: 'event'`
  - Set odds per option (enabled when wagerType = 'event')
- Resolve wagers (select winning option)
- Delete wagers

---

## Transactions & Settlements

**Transactions (`/admin/transactions`):**
- View all deposits and withdrawals
- Filter by type, status, date
- Approve withdrawal requests

**Settlements (`/admin/settlements`):**
- View all wager resolution payouts
- See per-winner amounts
- `SettledUsersModal` shows individual winner breakdown

---

## Notifications (`/admin/notifications`)

`NotificationBroadcast` component. Can send to:
- All users
- Specific user by ID
- Users with a specific role

Notifications support `buttonLink` and `buttonText` for action CTAs.

---

## Newsletter

- **Subscribers** — view, export subscriber list
- **Broadcast** — compose and send email campaign via `POST /api/admin/newsletter/send`

---

## Security

- `AdminAuthWrapper` redirects all non-admin users to `/admin/login`
- `RoleGuard` component used on individual admin page components
- Session expires after 6 hours of inactivity (configurable in `AdminAuthWrapper`)
- 5-minute warning modal before session timeout (`SessionTimeoutWarning`)
- Admin auth API (`/api/admin/auth`) manages admin-specific session state
