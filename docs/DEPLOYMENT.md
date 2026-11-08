# Bachat Book deployment and recovery

> **Status (2026-11-08):** migrations `00011`–`00019` are applied to the hosted Neon branch and
> verified there (18 + 32 rollback-only checks; hosted data unaffected). The selected HTTPS URL
> serves the app at `/`, but direct route requests still return Vercel 404s: the SPA rewrite in
> `vercel.json` and the signup/role-management/add-member implementation are local and not deployed.
> Real hosted sign-in with credentials and production environment variables remain unverified.

## 1. Release prerequisites

1. Review the intended release changes and commit them to the deployment branch. Do not deploy from
   an uncommitted workspace.
2. Confirm the Neon production project and branch in the Neon Console. Do not reset, recreate, or seed
   the production database.
3. Check the current database backup/PITR retention and restore options for the Neon plan. Record the
   operator and the recovery point before changing production.
4. Review and apply migrations `00011`–`00019` to the confirmed production branch in numeric order using the
   direct connection string and a trusted SQL client or protected CI job. Stop on the first failure.
   Never put `DATABASE_URL` in frontend hosting settings. Verify the resulting schema, policies, and
   functions using the queries in [DATABASE_ARCHITECTURE.md](./DATABASE_ARCHITECTURE.md).
   Migration `00014` includes the owner-bound one-time initial-admin flow. Confirm its configured
   Neon Auth user ID is the intended existing account before applying; do not substitute another
   account or use the flow to create a new Neon Auth user. If an application Admin already exists,
   the migration seeds the permanent setup marker and the claim flow remains disabled.
   Migration `00015` adds `add_profiles_to_group()`, the trusted admin-only RPC used to add registered
   members to a group. Migration `00016` rebuilds both cycle-activation functions to exclude installment
   recipients from their own obligations and rebuilds `record_payout()` to refuse when contributions
   remain outstanding; review before applying to a branch holding live cycles. Migration `00017` adds lifecycle RPCs and archived-write guards; review it before applying as well. Migration `00018` adds group-scoped `record_group_payment()`; review it before applying to a branch with live cycles. Migration `00019` adds automatic cycle completion and the guarded next-cycle rule; review it before applying.
5. Regenerate database types from the migrated target schema with `npm run generate-types`; review
   the generated diff before including it in the release.
6. Run the release checks:

   ```sh
   npm ci
   npm run typecheck
   npm run lint
   npm run build
   ```

   This repository has no configured automated test runner. Do not treat unrun authenticated or
   database tests as passed.

## 2. Static frontend hosting

Vercel configuration is in [`vercel.json`](../vercel.json). The selected production URL is
<https://bachat-book-circle.vercel.app>. Its root currently serves Bachat Book, but deep-link refresh
is broken until the local Vercel configuration is deployed.

| Setting          | Value                                                                     |
| ---------------- | ------------------------------------------------------------------------- |
| Install command  | `npm ci`                                                                  |
| Build command    | `npm run build`                                                           |
| Output directory | `dist`                                                                    |
| Node version     | A version supported by the repository's installed Vite release            |
| SPA routing      | Rewrite app routes to `/index.html`; preserve existing static asset paths |

Set these build-time environment variables in the production project:

| Name                     | Purpose                                                   |
| ------------------------ | --------------------------------------------------------- |
| `VITE_APP_NAME`          | Application name                                          |
| `VITE_APP_ENV`           | Set to `production`                                       |
| `VITE_NEON_AUTH_URL`     | Production Neon Managed Better Auth URL ending in `/auth` |
| `VITE_NEON_DATA_API_URL` | Production Neon Data API URL ending in `/rest/v1`         |

The two `VITE_NEON_*` values are browser-visible endpoint configuration, not credentials. **Never**
set `DATABASE_URL`, a database password, or a privileged key as a `VITE_*` value or as a frontend
runtime variable. Use `DATABASE_URL` only in a trusted operator shell or protected database job.
Keep `.env` files out of the deployment artifact and source control.

Attach the approved production domain, require HTTPS, and test direct navigation and refresh on
`/login`, `/forgot-password`, `/reset-password`, and protected routes. The host must serve the SPA
fallback for application routes without rewriting missing asset requests to HTML.

## 3. Neon Auth and account setup

1. In Neon Auth configuration, allow the exact production origin and the password-reset redirect
   `<production-origin>/reset-password`. The app requests this reset URL using the current site
   origin; do not allow arbitrary origins.
2. Verify email delivery and complete a password-reset round trip using a controlled test account.
3. Verify the existing administrator's Neon Auth identity maps to exactly one active
   `public.profiles` row with the `admin` role. Follow the trusted-operator procedure in
   [DATABASE_ARCHITECTURE.md, Administrator provisioning](./DATABASE_ARCHITECTURE.md#11-administrator-provisioning).
   Do not create a duplicate identity or grant admin through the client.
4. Provision family members through the existing approved account/profile and group-membership
   workflow. Confirm each account maps to the intended member, retains the `member` role, and can
   read only its permitted information. Do not share passwords in source control or documentation.

## 4. Launch smoke checks

Run these checks only after the database and application are configured. Use a separate controlled
test branch and test accounts for financial workflows; do not create fake payments or payouts in
real family records.

- Confirm HTTPS, no browser-console errors, app assets, ICO/PNG favicons, Apple touch icon, shared
  Bachat Book logo, web manifest and its Android icons load.
- Verify public signup, duplicate-email handling, email verification if enabled, member profile creation,
  and member-role dashboard routing using a dedicated test account.
- Run the initial-admin setup only with the pre-existing owner account; record the returned existing
  profile UUID and verify its `auth_user_id`, `role` and `is_active` against the database.
- As Admin, test user search, member promotion, admin demotion, account activation/deactivation,
  confirmation dialogs, self-change rejection and last-active-admin protection. Verify the matching
  audit rows.
- As a separate Member account, verify admin route denial, own-profile update restrictions and RLS
  isolation from unrelated groups, payments and payouts.
- Refresh a deep link and navigate between login, reset-password, and authenticated routes.
- Test admin and member login/logout and password reset with real controlled accounts.
- Verify admin access and member read-only isolation using authenticated sessions.
- On the test branch, verify cycle activation, installment generation, payment recording/voiding and
  payout recording/voiding, including amounts, recipient matching, and duplicate prevention.
- Verify mobile viewport layout and bottom navigation while signed in.
- Record each result as passed, failed, or not run. Do not call deployment complete until required
  database/RLS checks and workflows have actually passed.

## 5. Backup and recovery

- Confirm the Neon plan's backup/PITR availability and retention in the Console before launch; this
  repository does not establish the production plan or retention period.
- For a suspected database incident, stop further financial writes if safe, preserve logs and the
  original branch, and contact the authorized database operator. Restore to a separate branch or
  environment from the selected recovery point; validate schema, RLS, profiles, and financial
  consistency before any controlled cutover. Never test destructive recovery against production.
- Do not restore the entire database merely to correct one mistaken financial transaction. Use the
  authorized void operation with a reason and enter a corrected transaction as a new record. Never
  hard-delete payments or payouts.
- Keep database credentials in the password manager or approved secret store, restrict access to
  named operators, and rotate credentials if exposure is suspected.

## 6. Current deployment record

| Item                              | Status                                                                                                                                                                                                 |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Hosting provider / production URL | Vercel / <https://bachat-book-circle.vercel.app> (selected; root responds over HTTPS)                                                                                                                  |
| Frontend deployment / HTTPS       | Existing page is reachable; this release is not deployed and deep routes return 404                                                                                                                    |
| Production environment variables  | Not configured or verified                                                                                                                                                                             |
| Vercel deployment access          | Not connected to this execution; no Vercel CLI/token is available                                                                                                                                      |
| Neon Auth origin / reset URL      | Not configured or verified for a production domain                                                                                                                                                     |
| Production migrations             | `00011`–`00019` applied to the hosted branch (2026-11-08) and verified; `00014` seeded the claim marker with the existing owner profile, permanently disabling the one-time setup flow by design       |
| Database types                    | `src/types/database.types.ts` regenerated from the migrated hosted schema (2026-11-08, includes `add_profiles_to_group`)                                                                               |
| Hosted structural verification    | 18 checks passed for `00011`–`00014`; RPC grant for `add_profiles_to_group` confirmed for `authenticated` only in `00015` work                                                                         |
| Hosted behavioural verification   | 90 + 32 rollback-only checks passed (provisioning, role/access RPC, audit trail, profiles RLS, trigger guard, claim flow, add-profiles-to-group idempotency/admin guard/audit); hosted data unaffected |
| Remote public smoke checks        | Root login loaded at 390px with no horizontal overflow/console errors; direct app routes return 404                                                                                                    |
| Authenticated smoke tests         | Not run (no real hosted sign-in with credentials yet)                                                                                                                                                  |
| Signup and two-account role tests | Database/RPC level verified against hosted Neon; browser-level signup and role changes remain to be run with real accounts                                                                             |
| Initial Admin profile link        | Verified in the hosted database: profile `518d403a-…3afa` ↔ Auth `25c8d456-…99c`, role `admin`, `is_active = true`                                                                                     |
| Backup retention / restore        | Not verified against the production Neon plan                                                                                                                                                          |
| PWA                               | `public/site.webmanifest` and favicon/install icons exist; no service worker/offline caching is configured                                                                                             |
