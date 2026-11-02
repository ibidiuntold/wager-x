---
inclusion: always
---

# Documentation Rules

## When to Update Documentation

Update documentation whenever a change affects any of the following:

| Change Type | Files to Update |
|---|---|
| New API endpoint | `docs/api.md` |
| New database table or column | `docs/database.md` + `database/schema.sql` migrations section |
| New feature or component | `docs/features.md` |
| Auth flow change | `docs/auth.md` |
| Admin panel change | `docs/admin.md` |
| Payment flow change | `docs/payments.md` |
| Architecture change (new provider, new service, new layout) | `docs/architecture.md` |
| Any code change at all | `docs/changelog.md` (append entry) |

Always append to `docs/changelog.md` at the end of a session that includes code changes. Never delete existing changelog entries.

## README.md

`README.md` is the entry point. It contains:
- One-paragraph project overview
- Tech stack table
- Getting started (install, DB setup, env vars, run commands)
- Links to all `/docs/*.md` files
- No implementation details — those live in the linked docs

Do not add implementation details directly to README.md. Link to the appropriate docs file instead.

## Documentation Structure

```
docs/
  architecture.md   — runtime model, provider stack, DB connection, service layer
  features.md       — all user-facing and admin features
  database.md       — all tables with columns and migration history
  api.md            — all /api/ endpoints with method, path, auth, description
  auth.md           — NextAuth config, session shape, role guards
  admin.md          — admin panel layout, nav items, settings
  payments.md       — Paystack integration, webhooks, transaction records
  specs.md          — spec implementation history (requirements → design → tasks)
  changelog.md      — running log of all changes made
```

## Changelog Format

Each entry in `docs/changelog.md` should be grouped by area (Database, Services, API Routes, Components, Hooks, Types, etc.) and describe **what changed and why**, not just the file name.

```markdown
## [Date or Session Description]

### Database
- `tableName` — describe column added or table created

### Services
- `serviceName.ts` — describe what changed and why

### Components
- `ComponentName.tsx` — describe what changed and why
```

## Database Schema Rule

Every schema change must:
1. Be added to `database/schema.sql` under the `-- MIGRATIONS` section
2. Use `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` (idempotent)
3. Be documented in `docs/database.md` under the relevant table section
4. Have a version number (v1.2, v1.3, etc.) in both the SQL comment and the migration history table

## API Documentation Rule

When adding a new API route:
1. Add it to `docs/api.md` in the correct group section
2. Include: Method, Path, Auth requirement, one-line description
3. Note any non-obvious behaviour (e.g. "userId always set from token.sub, not body")

## Specs Rule

When a spec task is completed, update `docs/specs.md` to record:
- What the task changed
- Which files were modified
- Any design decisions or tradeoffs made

## What NOT to Put in Docs

- Do not duplicate code in documentation — describe behaviour, link to source
- Do not put environment variable values or secrets in docs
- Do not document internal implementation details that may change — document the interface (inputs, outputs, side effects)
