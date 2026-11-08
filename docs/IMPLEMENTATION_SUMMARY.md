# Bachat Book — What Happened (2026-11-08) - Summary

> **Scope: earlier 2026-11-08 session.** This file records the signup/role-management and hosted
> 00011–00014 verification work as it stood at the end of that session. Later 2026-11-08 changes
> (migrations `00015_add_profiles_to_group.sql` and `00016_recipient_excluded_contribution_logic.sql`
> and their verification) are recorded in `docs/PROJECT_STATUS.md`. Files and the hosted branch have
> since changed, so the working-tree list below is historical.

## Session Context

- Working directory: D:\Sanket\GitSanket\BachatBook
- Git HEAD: 7d2b3c0 ("changes")
- 8 files modified, uncommitted
- Hosted Neon project: BachatBook production branch at migration 00014
- Verification: 18 structural + 90 behavioural rollback-only checks passed

## What Was Completed This Session

### 1. Migrations 00011–00014 Applied to Hosted Neon

- Applied in numeric order via direct SQL connection using `apply-file.mjs`
- Branch now at migration 00014
- All four migrations completed without error

### 2. Hosted Structural Verification (18 checks passed)

- All 10 workflow functions exist and are executable by `authenticated` only
- No client write privilege on `payments`/`payouts` tables
- `profiles` table-level write: `INSERT` only (self-provisioning) with column-level `UPDATE` grant restricted to `full_name, phone`
- No `DELETE` policies exist anywhere
- `initial_admin_setup` has no client privileges
- Setup marker binds existing owner profile/Auth identity
- 30 total RLS policies

### 3. Hosted Behavioural Verification (90 rollback-only checks passed)

Signup/Provisioning:

- Signup provisioning creates a member-role profile, is idempotent
- Refuses blank names, missing emails, duplicate emails (including owner's email)
- No test data was committed to hosted database

`update_user_access` admin function:

- Requires an active-admin caller
- Blocks self-changes
- Prevents demoting/deactivating the last active admin
- Promotes/demotes and deactivates/activates other profiles atomically
- Writes exactly one audit row per applied change with correct actor, target and old/new values
- Writes nothing for rejected or no-op requests

Member RLS isolation:

- Member caller is rejected and cannot see or change other profiles
- Ordinary profile updates cannot change `role`, `is_active` or `auth_user_id` (column grant + trigger guard)
- Profile inserts and deletes are refused

Audit log integrity:

- Forged inserts/updates/deletes to audit rows are all denied
- `claim_initial_admin()` rejects strangers and rejects the already-completed owner claim

### 4. Owner Profile Verification (Hosted)

- Profile `518d403a-a5eb-4f7d-afbb-a600f8923afa` ↔ Auth `25c8d456-7a44-4cdf-b986-cb8c0798c99c`
- Email: `sanketfulzelek6@gmail.com`, role: `admin`, `is_active = true`
- Migration `00014` seeded `initial_admin_setup` marker with this exact pairing
- One-time claim flow permanently disabled — intended end state

### 5. Regenerated `database.types.ts`

- Regenerated from migrated hosted schema
- Contains all new functions/tables: `update_user_access`, `claim_initial_admin`, `record_payment`, `void_payment`, `record_payout`, `void_payout`, `cycle_installment_due_date`, `ensure_own_profile`, `initial_admin_setup`
- Two frontend RPC wrappers adjusted: passing `undefined` instead of `null` for optional args

### 6. Typecheck/Lint/Build/Fixed All Zero Errors

- `npm run typecheck`: 0 errors
- `npm run lint`: 0 errors/warnings
- `npm run build`: clean
- `npm run format:check`: clean (after Prettier write on `database.types.ts`)

### 7. Updated All Documentation Files

- `docs/PROJECT_STATUS.md` — full status, sprint table, verification results, how checks were executed, blockers
- `docs/AUTHENTICATION.md` — security checklist + verification status, updated unchecked items
- `docs/DATABASE_ARCHITECTURE.md` — status header, migration notes, generation source, hosted verification table, known limitations
- `docs/DEPLOYMENT.md` — status + deployment record table
- `README.md` — status line, all fourteen migrations line, roadmap rows, admin provisioning section, notes & limitations

## What Was Verified Against Hosted Neon (2026-11-08)

- Migrations 00011–00014: each completed without error; branch at 00014
- `cycle_installment_due_date` function exists, immutable helper
- `record_payment`/`void_payment` RPCs exist, executable by `authenticated` only
- `record_payout`/`void_payout` RPCs exist, executable by `authenticated` only
- Direct `payments`/`payouts` INSERT/UPDATE privileges revoked from all client roles
- `ensure_own_profile(text,text,text)` exists, signed to `authenticated` only, forces `member`
- `update_user_access(uuid,user_role,boolean)` exists, signed to `authenticated` only, audit-logged, advisory-locked
- `claim_initial_admin()` exists, bound to owner Auth id/email; setup marker seeded, flow disabled
- `initial_admin_setup` table present, exactly one row, no client privileges
- `profiles` UPDATE grant: column-level `full_name, phone` only
- Zero `DELETE` policies across the public schema
- RLS policy count: 30 (no stale `profiles_update_own_or_admin`)
- Structural post-apply checks: 18 passed
- Behavioural rollback-only checks: 90 passed
- Types regenerated from the migrated hosted schema

## Working Database State After Verification

- Exactly one profile (the owner)
- Zero groups
- Zero members
- Zero audit rows (no test data committed)
- Setup marker: 1 row

## How Hosted Checks Were Executed

- Tooling: temporary Node script using `pg` client (outside repository)
- Migrations applied one file at a time in numeric order, stopping on first error
- `DATABASE_URL` read from `.env`, never printed, echoed, or written to a doc
- Identity simulation: one transaction that was rolled back
  1. `set local role authenticated;`
  2. `select set_config('request.jwt.claims', '{"sub":"<auth-id>"}', true);` — GUC name must be inline SQL literal; passing as bound parameter does not trigger Data API `pg_session_jwt` hook
  3. One owner-context `select auth.user_id();` call to prime identity cache
- Critical: real path is `request.jwt.claims` (JSON), **not** the legacy `request.jwt.claim.sub`
  `auth.user_id()` reads the former on the hosted Data API. Using the older GUC name silently yields `NULL`.
- All checks were rollback-only and left hosted database untouched
- Post-rollback counts re-checked: profiles 1 → 1, audit rows 0 → 0, no test identities, one setup-marker row

## Blocked / Not Verified

- **No hosted credentials/password available**: real browser sign-in as owner and no real member signup/login
- **Browser-level signup/login**: signup, login, User Management screen, password reset, session persistence, expiry handling, mobile walkthrough remain untested
- **Vercel deployment**: no CLI/token/deployment access; `vercel.json` (SPA rewrite) committed locally but not deployed; direct routes still return 404 at <https://bachat-book-circle.vercel.app>
- **Production environment variables**: `VITE_NEON_AUTH_URL` / `VITE_NEON_DATA_API_URL` / `VITE_APP_ENV` unverified
- **`neon_auth.users`**: not readable through direct `pg` connection (`relation "neon_auth.users" does not exist`); must rely on `profiles.auth_user_id`
- **Deployment**: requires a commit plus Vercel project and dashboard access; nothing from this session was committed or pushed

## Working Tree at Session End (8 modified, uncommitted files)

- `README.md`
- `docs/AUTHENTICATION.md`
- `docs/DATABASE_ARCHITECTURE.md`
- `docs/DEPLOYMENT.md`
- `docs/PROJECT_STATUS.md`
- `src/features/auth/api/auth-api.ts`
- `src/features/bhishi/api/bhishi-api.ts`
- `src/types/database.types.ts`
- `db/migrations/README.md` — migration status table refreshed in this documentation pass

## Key Technical Decisions Documented

- Two application roles only: `admin`, `member`; signup always yields `member`
- Role changes only via trusted DB function (`update_user_access`) with caller-admin verification
- Self-change block, last-admin protection, audit log
- Preserve RLS, no hard deletes, don't modify already-applied migrations
- Reuse existing Neon Better Auth account for owner; no new auth user
- Keep existing profile UUID; one-time setup permanently disabled once claimed or any admin exists
- Never expose `DATABASE_URL` or privileged vars to Vite/frontend
- Regenerated `database.types.ts` from migrated hosted schema
- Changed RPC wrappers to pass `undefined` instead of `null` for optional args
- Hosted verification uses `request.jwt.claims` GUC, not `request.jwt.claim.sub`

## Sprint Table Updates

- Sprint 12 added (Public Signup & Role Management) — implemented; DB verified
- Sprint 6–8 status updated: migrations 00011–00013 applied to hosted and verified
- Sprint 11 status updated: Production Deployment & Launch — still blocked (no Vercel CLI/token)

## Out of Scope (unchanged)

- Analytics, reports, charts, exports, notifications, payment gateways, advanced settings

## How the Hosted Checks Were Executed (for future sessions)

- Tooling: a temporary Node script using the `pg` client outside the repository
- Migrations applied one file at a time in numeric order, stopping on the first error
- `DATABASE_URL` read from `.env` and never printed, echoed, or written to a doc
- Identity simulation: one transaction that was rolled back, did:
  1. `set local role authenticated;`
  2. `select set_config('request.jwt.claims', '{"sub":"<auth-id>"}', true);` — the GUC **name must be an inline SQL literal**; passing it as a bound parameter does not trigger the Data API's `pg_session_jwt` hook
  3. One owner-context `select auth.user_id();` call to prime the identity cache
- Important: the real path is `request.jwt.claims` (JSON), **not** the older `request.jwt.claim.sub`. `auth.user_id()` reads the former on the hosted Data API. Using the older GUC name silently yields `NULL`.
- All checks were rollback-only and left the hosted database untouched. Post-rollback counts were re-checked (profiles 1 → 1, audit rows 0 → 0, no test identities, one setup-marker row).
- `neon_auth.users` is **not readable** through a direct `pg` connection (`relation "neon_auth.users" does not exist` for this role). Identity verification therefore relied on `profiles.auth_user_id`, which is the application's mapping. Do not modify the `neon_auth` schema.

## Blocked / Not Verified at the End of This Session

- No hosted credentials/password are available, so there was no real browser sign-in as the owner and no real member signup/login. Browser signup, login, the User Management screen, password reset, session persistence, expiry handling and the mobile walkthrough remain **not run**.
- No Vercel CLI/token/deployment access. `vercel.json` (SPA rewrite) is committed locally but not deployed; direct routes still return 404 at <https://bachat-book-circle.vercel.app>. Production `VITE_NEON_AUTH_URL` / `VITE_NEON_DATA_API_URL` / `VITE_APP_ENV` and the Neon Auth production origin/reset URL are unverified.
- Deployment could not be exercised at all: it requires a commit plus the Vercel project and dashboard access. Nothing in this session was committed or pushed.
