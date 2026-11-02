# Authentication

## Provider

NextAuth.js v4 with a **Credentials provider** backed by MySQL.

Config file: `app/api/auth/[...nextauth]/route.ts`
Session type augmentation: `types/next-auth.d.ts`

---

## Sign-in Flow

1. User submits email + password
2. `authorize()` queries `users` table via `mysql2`
3. `bcryptjs.compare()` verifies password
4. Checks `emailVerified` and `status` — throws descriptive errors for pending/suspended/banned
5. Returns `SessionUser` object with all profile fields
6. `jwt` callback stores all fields on the token
7. `session` callback copies token fields to `session.user`

---

## JWT Token Fields

```typescript
// types/next-auth.d.ts (module augmentation)
interface JWT {
  id: string;
  role: string;           // 'user' | 'admin'
  firstName: string;
  lastName: string;
  dob: string;
  nickname: string;
  phoneNumber: string;
  avatarUrl: string;
  referralCode: string;
  status: string;
}
```

---

## Session Shape

```typescript
interface Session {
  user: {
    id: string;
    role: string;
    firstName: string;
    lastName: string;
    dob: string;
    nickname: string;
    phoneNumber: string;
    avatarUrl: string;
    referralCode: string;
    status: string;
  } & DefaultSession["user"]; // + name, email, image
}
```

Without `types/next-auth.d.ts`, `session.user.id` would be `undefined` at runtime because NextAuth's default `User` type doesn't include `id`. The module augmentation is critical.

---

## API Route Auth Guard

Applied to all mutating API endpoints:

```typescript
import { getToken } from 'next-auth/jwt';

const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
if (!token) {
  return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
}
```

Endpoints where `userId` matters always derive it from `token.sub` (or `token.id`) — never from the request body. This prevents identity spoofing.

---

## useAuth Hook

`hooks/useAuth.ts` — wraps `useSession()` and exposes:

```typescript
const { user, userRole, isLoading, signIn, signUp, logout, hasPermission } = useAuth();
```

`userRole` is `session.user.role`. The `hasPermission` function implements role hierarchy:
- `admin` can access both `admin` and `user` resources
- `user` can only access `user` resources

---

## Role Guards

### `RoleGuard` (`components/auth/RoleGuard.tsx`)
Client component. Redirects to `redirectTo` if `userRole` doesn't match `allowedRoles`. Used to wrap admin pages.

### `AdminAuthWrapper` (`components/admin/AdminAuthWrapper.tsx`)
Wraps the entire admin layout. Checks:
1. Already-authenticated admin on `/admin/login` → redirect to `/admin/dashboard`
2. Non-admin / unauthenticated on any other `/admin/*` page → redirect to `/admin/login`

Includes a 6-hour session timeout with a 5-minute warning modal.

---

## Admin Access

**Three entry points to the admin panel:**

1. **Direct URL:** `/admin/login` — dedicated login form using the same NextAuth Credentials provider, but checks `role === 'admin'` after sign-in.

2. **Navbar dropdown** (`components/navbar/Navbar.tsx`) — "Admin Panel" link shown when `user?.role === 'admin'`.

3. **Mobile sidebar** (`components/Sidebar.tsx`) — "Admin Panel" link (purple) shown when `userData?.role === 'admin'`.

**Important:** If you change a user's role directly in the database, you must **sign out and sign back in** for the new role to be reflected in the JWT token. NextAuth does not re-read the database on each request — the role is stored in the token at sign-in time.

---

## Email Verification

- New accounts start with `emailVerified = 0` and `status = 'pending'`
- Verification email sent on registration
- `GET /api/auth/verify-email?token=...` sets `emailVerified = 1` and `status = 'active'`
- Unverified users cannot sign in (the `authorize` function throws)

---

## Password Reset

1. `POST /api/auth/password-reset` — generates token, sends reset email
2. User clicks link → `/reset-password?token=...`
3. `POST /api/auth/reset-password` — verifies token, updates hashed password
