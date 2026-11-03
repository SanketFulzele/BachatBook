# Bachat Book deployment and recovery

> **Status (2026-11-03):** the selected HTTPS URL serves the app at `/`, but direct route requests
> currently return Vercel 404s. A Vercel SPA rewrite has been added locally and is not deployed.
> Migrations `00011`–`00013` are pending per the project handoff, and authenticated production
> verification has not been performed.

## 1. Release prerequisites

1. Review the intended release changes and commit them to the deployment branch. Do not deploy from
   an uncommitted workspace.
2. Confirm the Neon production project and branch in the Neon Console. Do not reset, recreate, or seed
   the production database.
3. Check the current database backup/PITR retention and restore options for the Neon plan. Record the
   operator and the recovery point before changing production.
4. Apply migrations `00011`–`00013` to the confirmed production branch in numeric order using the
   direct connection string and a trusted SQL client or protected CI job. Stop on the first failure.
   Never put `DATABASE_URL` in frontend hosting settings. Verify the resulting schema, policies, and
   functions using the queries in [DATABASE_ARCHITECTURE.md](./DATABASE_ARCHITECTURE.md).
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

- Confirm HTTPS, no browser-console errors, app assets, manifest and icons load.
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

| Item                              | Status                                                                                                                |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Hosting provider / production URL | Vercel / <https://bachat-book-circle.vercel.app> (selected; root responds over HTTPS)                                 |
| Frontend deployment / HTTPS       | Existing page is reachable; this release is not deployed and deep routes return 404                                   |
| Production environment variables  | Not configured or verified                                                                                            |
| Vercel deployment access          | Not connected to this execution; no Vercel CLI/token is available                                                     |
| Neon Auth origin / reset URL      | Not configured or verified for a production domain                                                                    |
| Production migrations             | `00011`–`00013` pending; user approved application after verification, but no database connection/client is available |
| Remote public smoke checks        | Root login loaded at 390px with no horizontal overflow/console errors; direct app routes return 404                   |
| Authenticated smoke tests         | Not run                                                                                                               |
| Backup retention / restore        | Not verified against the production Neon plan                                                                         |
| PWA                               | Web manifest and icons exist; no service worker/offline caching is configured                                         |
