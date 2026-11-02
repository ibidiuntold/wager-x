---
inclusion: always
---

# Investigation Rules

## API Route Verification

Before reporting which route handles a request, always list the **full directory tree** of the relevant API folder first.

Next.js App Router has multiple valid route patterns under one folder:

```
app/api/users/
  route.ts              → handles /api/users
  user/route.ts         → handles /api/users/user
  [userId]/route.ts     → handles /api/users/[userId]
  balance/route.ts      → handles /api/users/balance
```

A fetch to `/api/users/user?id=x` and a fetch to `/api/users?id=x` are **different routes** hitting **different files**. Finding one does not confirm the other.

### Required steps when investigating an API issue

1. Read the fetch/axios call in the client code to get the **exact URL**.
2. Run `list_directory` on the matching `app/api/...` folder with `depth=2`.
3. Match the URL segments to the correct `route.ts` file — accounting for static segments, dynamic segments (`[param]`), and catch-all routes.
4. Read **that specific file** before drawing conclusions.

Never assume a `route.ts` at a parent path handles requests meant for a child path.

## Active Editor Files

When the user shares an active editor file as context, read it immediately — it is direct evidence about the problem and should take priority over sub-agent findings or assumptions.

## Sub-Agent Output

Sub-agent findings are a starting point, not a final answer. If a sub-agent reports a file as responsible for something, verify by reading that exact file before citing it as fact.

## "Unexpected token '<'" / HTML-as-JSON Error

When a client-side `fetch` call throws `Unexpected token '<', "<!DOCTYPE "... is not valid JSON`, the server returned an HTML page instead of JSON. This always means one of:

1. **The API route does not exist** — Next.js returns an HTML 404 page
2. **The route exists but throws an unhandled error** — Next.js/Express returns an HTML 500 page
3. **The URL is wrong** — a typo or incorrect path segment points to a non-existent handler

### Required diagnostic steps

1. Read the exact `fetch(...)` URL in the calling code.
2. Run `list_directory` on `app/api/...` with `depth=2` to confirm the route file exists.
3. If the route file is missing, create it. If it exists, read it and check for unhandled throw paths that bypass `NextResponse.json(...)`.

### Prevention rules

- Every `fetch('/api/...')` call must have a corresponding `route.ts` file. Before writing a context/hook/component that calls an API path, verify the file exists.
- Every API route `catch` block must return `NextResponse.json({ ... })` — never let an error propagate as an unhandled exception that Next.js turns into an HTML error page.
- When reading API responses, always check `res.ok` before calling `res.json()`. If `!res.ok`, read `res.text()` as fallback to surface HTML error pages in logs rather than crashing with a JSON parse error:

```typescript
const res = await fetch('/api/...');
if (!res.ok) {
  const text = await res.text();
  throw new Error(`API error ${res.status}: ${text.slice(0, 200)}`);
}
const result = await res.json();
```

## Framer Motion Variants

Always import and apply the `Variants` type when defining variant objects. An untyped variant with a function form will cause TypeScript errors.

### Correct pattern

```typescript
import { motion, type Variants } from 'framer-motion';

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 32 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: 'easeOut' },
  }),
};
```

### Anti-patterns
- `const fadeUp = { visible: (i = 0) => ... }` — untyped, no explicit parameter type, TypeScript infers `any`
- Omitting `type Variants` import when using function-form variants

### Dynamic icon components in maps

Never use `<item.icon />` or `<p.icon />` directly in JSX — React requires component references to be uppercase variables. Always extract to a local const first:

```tsx
// ✅ correct
{items.map((item) => {
  const Icon = item.icon;
  return <Icon className="h-5 w-5" />;
})}

// ❌ wrong — JSX will treat this as a DOM element, not a component
{items.map((item) => <item.icon className="h-5 w-5" />)}
```


## Date Handling: MySQL vs Firebase

MySQL via `mysql2` returns `DATETIME` columns as native JavaScript `Date` objects. Firebase Firestore returns timestamps as `{ toDate: () => Date }` objects. **Never call `.toDate()` on a value that came from a MySQL/REST API response** — it will throw `x.toDate is not a function`.

### Safe date normalisation pattern

Use this helper whenever displaying or computing from a date that may come from either source:

```typescript
function toDate(value: Date | string | { toDate: () => Date } | null | undefined): Date {
  if (!value) return new Date();
  if (typeof value === 'string' || typeof value === 'number') return new Date(value);
  if (typeof (value as any).toDate === 'function') return (value as any).toDate();
  return value as Date;
}
```

### Type declaration rule

When declaring an interface whose data may come from either a REST API (MySQL) or Firebase, type date fields as:

```typescript
createdAt: Date | string | { toDate: () => Date };
```

Never type them as just `Date` if the data comes from a REST JSON response — JSON serialisation converts `Date` objects to ISO strings.
