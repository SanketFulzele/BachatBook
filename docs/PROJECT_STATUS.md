# Bachat Book — Project Status

> **This file is the handoff document between sprints.** Read it before starting any new sprint.
> Update it at the end of every sprint. Never delete previous sprint history, never mark unfinished work
> as done, and never record secret values.

Last updated: **2026-11-04 (authentication/signup and role-management implemented locally; migration
00014 and hosted account verification remain pending)**

### Recent update — Signup, initial admin and user management (2026-11-04)

- Added public signup using the existing Neon Managed Better Auth client, password confirmation and
  visibility controls, duplicate-account messaging, and session-based member profile provisioning.
- Added the restricted `/initial-admin-setup` flow. The proposed migration binds it to the existing
  Auth subject supplied by the owner, preserves the existing matching profile UUID/details, refuses
  setup if any application Admin already exists, and permanently marks setup complete after the claim.
- Added admin user search, role promotion/demotion and activate/deactivate controls. Changes use a
  PostgreSQL RPC that checks the caller role, blocks self/last-admin changes, and writes audit history.
- Added admin Members and member Installments navigation pages; filled out the requested role-specific
  navigation labels.
- Added append-only migration `00014_auth_signup_and_role_management.sql`; it is **local only** and
  has not been applied to hosted Neon. Migrations `00011`–`00014` remain pending deployment.
- The complete profile UUID, role assignment and Auth-to-profile link for the existing admin were not
  queried or verified because this workspace has no hosted database connection/client. Two-account
  auth/RLS tests and production deployment are also pending. Do not treat the feature as hosted-ready.

### Recent update — Favicon and shared brand logo (2026-11-04)

- Replaced the previous standalone SVG favicon with the supplied ICO and PNG variants in `public/`.
- Added `public/site.webmanifest` with the Bachat Book app metadata and supplied Android icon sizes.
- Updated `index.html` to reference the favicon variants, Apple touch icon, and site manifest.
- Updated the shared `Logo` component to use `public/bachat-book-logo.png`, copied from
  `favicon-data/BachatBook.png`. This updates the mark used across the app's shared headers and screens.
- Removed the obsolete `public/favicon.svg`, `public/manifest.webmanifest`, and
  `public/icons/bachat-book-mark.svg` assets. The source image in `favicon-data/` remains unchanged.
- Updated the README asset tree and this handoff. `npm run build`, Prettier checks, `git diff --check`,
  and checks that the new assets are present in `dist/` passed.

---

## A. Project Information

| Item                | Value                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Project name        | **Bachat Book**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| Tagline             | Together We Save. Simply.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| Purpose             | Digital Bhishi / rotating savings group management for small groups (5–10 members): contributions, cycles, collections, payouts and financial history.                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| Repository          | `D:\Sanket\GitSanket\BachatBook`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Current sprint      | **Sprint 11 — Production Deployment & Launch** (Vercel target selected; SPA fix prepared locally; release deployment and production checks blocked)                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| Overall status      | Sprints 1–2.7 delivered the UI, verified schema, Neon migration and hosted database. Existing auth/session flows remain implemented; public signup, member provisioning, initial-admin setup and admin role management are implemented locally with migration 00014. Migrations 00011–00014, hosted auth/RLS tests and the real admin profile UUID/link remain unverified. The selected Vercel URL serves the app root but direct routes return 404; a rewrite fix is local only. This environment has no Vercel CLI/token or PostgreSQL client/connection, so hosted migration, account verification and deployment are blocked. |
| Sprint 1 scope rule | UI, layout, routing and documentation only. No database, auth, CRUD or financial logic.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Sprint 2 scope rule | Database schema, migrations, constraints, indexes, RLS, seed data, types and documentation only. No auth wiring, CRUD, generation or calculations.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| Sprint 2.5 rule     | Replace Supabase with Neon, adapt identity/RLS and regenerate types. No new features, no Sprint 3 auth work, no remote provisioning without approval.                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| Sprint 2.6 rule     | Cosmetic rebrand only. No schema, policy, logic or behaviour changes; SQL baselines untouched.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| Sprint 2.7 rule     | Provision the hosted Neon project (Auth + Data API), apply migrations, confirm RLS. No application auth wiring, no CRUD, no SQL changes.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| Sprint 3 rule       | Real Neon Auth authentication, session state, profile loading, role guards, onboarding and password reset only. No CRUD, no financial features, no RLS bypass, no client-trusted roles.                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Sprint 4 rule       | One small, mobile-first Bhishi workflow only. No reports, charts, exports, extra settings or advanced filters. No hard delete of financial records, no client-trusted roles, no DB credentials in the browser.                                                                                                                                                                                                                                                                                                                                                                                                                    |
| Sprint 5 rule       | Cycle drafts, manual chit ordering, confirmation activation and schedule viewing only. No automatic installment generation beyond the existing activation behaviour, no payment/payout recording changes, no reports, analytics, notifications or calendars.                                                                                                                                                                                                                                                                                                                                                                      |
| Sprint 6 rule       | Automatic monthly installment generation at cycle activation plus admin/member installment viewing and payment-derived status only. No payment/payout recording changes, reports, analytics, notifications, late fees, penalties or manual installment editing.                                                                                                                                                                                                                                                                                                                                                                   |

### Technology stack (installed)

| Layer               | Package / version                                                                          |
| ------------------- | ------------------------------------------------------------------------------------------ |
| UI framework        | `react@19.3.1`, `react-dom@19.3.1`                                                         |
| Language            | `typescript@5.9.3` (strict)                                                                |
| Build               | `vite@8.3.5`, `@vitejs/plugin-react@6.1.2`                                                 |
| Styling             | `tailwindcss@3.4.19`, `postcss@8.5.32`, `autoprefixer@10.6.2`                              |
| Routing             | `react-router-dom@7.18.5`                                                                  |
| Server state        | `@tanstack/react-query@5.105.1` (provider; cache cleared on sign-out)                      |
| Forms / validation  | `react-hook-form@7.91.0`, `@hookform/resolvers@7.0.1`, `zod@4.6.7`                         |
| Icons               | `lucide-react@1.66.0`                                                                      |
| Class helpers       | `clsx@2.1.1`, `tailwind-merge@2.6.1`                                                       |
| Lint / format       | `eslint@10.14.0`, `typescript-eslint@8.72.1`, `prettier@3.9.10`                            |
| Backend             | `@neon/neon-js@0.10.2` (Managed Better Auth + Data API); hosted project provisioned        |
| Database (verified) | Neon PostgreSQL — hosted `BachatBook` project, production branch active                    |
| Neon config         | `@neon/config@1.10.0`; declarative `neon.ts`; Auth + Data API enabled on the hosted branch |

---

## B. Sprint Progress

| #   | Sprint                                     | Status                    | Notes                                                                                                                                                                                                                                       |
| --- | ------------------------------------------ | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Project Foundation & Design System         | **Completed**             | UI, layouts, routing, auth screens, dashboard preview, docs.                                                                                                                                                                                |
| 2   | Supabase & Database Architecture           | **Completed**             | Historical baseline: schema, 7 migrations, RLS, seed, types, docs. Verified locally; never pushed to Supabase.                                                                                                                              |
| 2.5 | Supabase → Neon migration                  | **Completed**             | Neon baseline migrations, `auth.user_id()` identity mapping, RLS adaptation, types, `neon.ts`, docs. Verified locally at the time; hosted provisioning completed in 2.7.                                                                    |
| 2.6 | Rebrand: Bachify → Bachat Book             | **Completed**             | Name, package, icon asset, UI copy, PWA manifest. SQL untouched by design.                                                                                                                                                                  |
| 2.7 | Hosted Neon provisioning                   | **Completed**             | `BachatBook` project, Auth + Data API enabled, 8 migrations applied, RLS and `auth.user_id()` verified on the production branch.                                                                                                            |
| 3   | Authentication & Security                  | **In Progress**           | Real sessions, guards, onboarding, password reset implemented; authenticated hosted verification pending.                                                                                                                                   |
| 4   | Simple Bhishi Workflow                     | **Implemented**           | Groups, members, chit order, installments, payments, payouts, live dashboards and profile.                                                                                                                                                  |
| 5   | Bhishi Cycle & Chit Order                  | **Implemented**           | Draft cycle creation with snapshots, manual chit ordering, confirmation activation and schedule viewing.                                                                                                                                    |
| —   | Cycle & Chit Management                    | Delivered                 | Basic activation shipped in Sprint 4; the reviewable draft/chit-order workflow ships in Sprint 5.                                                                                                                                           |
| —   | Automatic Installment Generation           | Delivered                 | Verified in Sprint 6; generated atomically by `activate_cycle_draft()` from cycle snapshots.                                                                                                                                                |
| —   | Payment Management                         | Merged                    | Folded into Sprint 4; status derived from non-voided payments.                                                                                                                                                                              |
| —   | Payout Management                          | Merged                    | Foundation folded into Sprint 4; Sprint 8 adds trusted recording, voiding, history and member views. Migration 00013 is pending deployment.                                                                                                 |
| —   | Dashboards                                 | Merged                    | Folded into Sprint 4; admin and member homes read live data.                                                                                                                                                                                |
| —   | Reports & Audit Logs                       | Dropped                   | Deliberately out of scope; the app is kept small.                                                                                                                                                                                           |
| 6   | Automatic Installment Generation           | **In Progress**           | Generation and saved collection-day due dates are implemented; migration 00011 and PostgreSQL validation remain pending.                                                                                                                    |
| 7   | Simple Payment Recording & Tracking        | **In Progress**           | Recording/void RPCs and admin/member history implemented; migration 00012 and database/mobile verification pending.                                                                                                                         |
| 8   | Simple Payout Recording & Tracking         | **In Progress**           | Admin confirmation, payout history/voiding and member schedule views implemented; migration 00013 plus migrations 00011–00012 and PostgreSQL/RLS validation remain pending.                                                                 |
| 9   | Simple Dashboard & Mobile Navigation       | **Implemented**           | Minimal admin/member dashboards, multi-group selectors, consistent bottom navigation, admin More menu and Installments route. No database changes.                                                                                          |
| 10  | Final Testing, Security Checks & Bug Fixes | **In Progress**           | Local typecheck/lint/build/format, static security review and unauthenticated responsive smoke checks passed. Hosted database/RLS and authenticated workflows remain unverified.                                                            |
| 11  | Production Deployment & Launch             | **In Progress / Blocked** | Vercel and production URL selected; direct route refresh currently fails. Added local SPA rewrite and deployment guide. No Vercel CLI/token or database access is configured here; migrations and authenticated smoke tests remain pending. |
| 12  | Public Signup & Role Management            | **Implemented locally**   | Neon Better Auth signup, member-only profile provisioning, identity-bound initial-admin flow, admin access RPC/UI and navigation added. Migration 00014, hosted profile linking and two-account/RLS tests are pending.                      |

Legend: Not Started · In Progress · Completed · Blocked · Merged · Dropped.

---

## C. Completed Work

### Sprint 1 — Project Foundation (2026-11-01)

### 1. Tooling and configuration

- Converted the existing fresh Vite **JavaScript** template into a TypeScript project in place (no nested
  `bachify-app/` folder).
- `tsconfig.json` + `tsconfig.app.json` + `tsconfig.node.json`: strict mode, `noUnusedLocals`,
  `noUnusedParameters`, `noUncheckedIndexedAccess`, bundler resolution, `@/*` → `src/*` paths.
- `vite.config.ts`: React plugin, `@` alias, dev port 5173. The old `vite.config.js` was **deleted** — a
  leftover JS config silently won over the TS config and broke the alias.
- `eslint.config.js`: flat config with `js.configs.recommended`, `typescript-eslint` recommended,
  React Hooks and React Refresh rules.
- `.prettierrc.json`, `.gitignore`, `.env.example`, `index.html` (metadata, Inter font, manifest,
  favicon), `public/site.webmanifest`, the PNG/ICO favicon assets in `public/`, and
  `public/bachat-book-logo.png`.
- npm scripts: `dev`, `build` (`tsc -b && vite build`), `typecheck`, `lint`, `preview`, `format`,
  `format:check`.

### 2. Design system

- `src/styles/globals.css`: HSL CSS variables for background, foreground, card, popover, primary,
  secondary/navy, muted, accent, destructive, success, warning, border, input, ring, radius. Base layer
  handles focus-visible rings, selection colour and scrollbars.
- `tailwind.config.ts`: maps every token to utilities, Inter font stack, radius scale, `card` /
  `elevated` / `focus` shadows, fade/scale/slide/shimmer animations.
- `src/lib/utils.ts`: `cn()`, `formatCurrency()` (NPR), `formatNumber()`, `formatDate()`,
  `formatShortDate()`, `getInitials()`.
- `src/lib/constants.ts`: app metadata, `ROUTES` map, `queryKeys` registry, default currency.
- `src/lib/query-client.ts`: shared TanStack Query client (staleTime 30 s, retry 1, no window-focus
  refetch) ready for Sprint 2 queries.

### 3. Reusable UI kit (`src/components/ui/`)

`Button` (+ `buttonVariants` in `button-variants.ts` for link-styled buttons), `Input` (start icon / end
adornment / invalid state), `Label`, `Card` (+ Header, Title, Description, Content, Footer), `Badge`,
`Dialog` (portal, Escape to close, scroll lock, focus handling, `aria-modal`), `Dropdown` (menu button,
keyboard arrow/Home/End navigation, focus restore, separators, labels), `Table` (+ Header, Body, Row,
Head, Cell, Footer, Caption), `Avatar` (initials fallback, optional decorative mode), `Skeleton`,
`Spinner`, `Toast` (`ToastProvider` + `useToast`, four variants, auto-dismiss, max three stacked), and
`Alert` (info / success / warning / error). All are typed, accept `className` overrides and use tokens.

### 4. Shared components

- `src/components/common/logo.tsx` — mark + wordmark, light/dark variants, optional tagline.
- `src/components/common/page-header.tsx` — page title block; also sets the document title.
- `src/components/common/placeholder-page.tsx` — honest “planned for Sprint N” page with capability list.
- `src/components/feedback/page-loading.tsx` — skeleton fallback for lazy route chunks.
- `src/components/feedback/full-page-loading.tsx` — full-screen fallback outside app shells.
- `src/components/feedback/not-found-page.tsx` — 404 page.
- `src/components/feedback/route-error-page.tsx` — router `errorElement`.

### 5. Layouts

- `admin-layout.tsx`: fixed 260 px dark navy sidebar (brand, grouped nav, “Soon” chips, sprint note),
  sticky header with breadcrumb-ish label, “Dev preview” badge, profile dropdown, mobile slide-over nav
  with overlay + Escape handling, skip link, footer.
- `member-layout.tsx`: light top bar, horizontal desktop nav, profile menu, admin preview link, mobile
  bottom navigation (6 items) with safe-area padding, skip link.
- `nav-config.ts`: admin and member navigation definitions with `availableInSprint` metadata.
- `profile-menu.tsx`: shared dropdown (account settings, workspace settings, portal preview, sign out).
- `protected-route-placeholder.tsx`: deliberate pass-through; **no role checks**.

### 6. Authentication UI (no backend)

- `auth-layout.tsx`: split-screen brand panel (desktop) + form panel, mobile logo header.
- `login-page.tsx`: email + password, remember me, forgot-password link, password visibility toggle,
  RHF + Zod validation, honest “authentication is not connected” alert/toast, preview links to both
  portals.
- `forgot-password-page.tsx`: email validation and “no email was sent” notice.
- `reset-password-page.tsx`: new password + confirmation, live rule checklist via `useWatch`, mismatch
  validation, “nothing was saved” notice.
- `schemas/auth.schemas.ts`: Zod schemas + inferred form value types.
- `types/auth.types.ts`: `AuthUser`, `AuthRole`, `AuthStatus` shapes reserved for Sprint 3.
- `components/password-input.tsx`: accessible show/hide toggle.
- **No credential is sent, stored or logged; no fake logged-in state is created.**

### 7. Admin dashboard (real page)

- `dashboard-page.tsx` composes: page header with sample-data badge and “About this view” dialog, warning
  alert, six summary cards, Recharts monthly collection chart, current recipient card, recent
  transactions table, upcoming collections list.
- Components: `summary-card.tsx`, `collection-chart.tsx` (ComposedChart: area + dashed target line,
  token-coloured tooltip), `current-recipient-card.tsx` (progress + schedule), `recent-transactions.tsx`,
  `upcoming-collections.tsx`.
- `data/sample-data.ts` — single, explicitly-flagged fixture module (`isSampleData: true`, dev-only
  comment). Types live in `types/dashboard.types.ts`.
- No calculation, aggregation or payment logic: values are literals.

### 8. Routing

- `src/app/router.tsx`: `createBrowserRouter` with root `errorElement`, auth routes, a
  `ProtectedRoutePlaceholder` wrapper, nested admin/member layouts, index redirects, per-route
  placeholders, and a catch-all 404.
- Role-scoped code splitting: auth pages and the dashboard are `lazy()`-loaded with skeleton fallbacks;
  each chunk stays under the 500 kB warning threshold.
- `src/app/providers.tsx`: `QueryClientProvider` + `ToastProvider`.
- `src/app/App.tsx`: providers + `RouterProvider` + top-level `Suspense`.
- `src/app/route-placeholders.ts`: placeholder content for every non-dashboard route.

### 9. Documentation

- `README.md` (setup, scripts, routes, structure, design system, verification, limitations).
- `docs/PROJECT_STATUS.md` (this file).

### Sprint 2 — Supabase & Database Architecture (2026-11-03)

#### 1. Supabase configuration

- Installed `@supabase/supabase-js@2.118.0`.
- `src/lib/supabase.ts`: typed `SupabaseClient<Database>`, lazy singleton, `isSupabaseConfigured`,
  `getSupabaseConfigIssues()`, `getSupabaseClient()` and an ergonomic `supabase` proxy.
- Environment validation rejects missing URL/key, malformed URLs, `sb_secret_…` keys and legacy JWTs
  carrying `"role":"service_role"`.
- Key precedence: `VITE_SUPABASE_PUBLISHABLE_KEY` → `VITE_SUPABASE_ANON_KEY` (documented in
  `.env.example`).
- `src/vite-env.d.ts` types every `VITE_` variable.
- No credentials are hardcoded and no screen connects to Supabase yet.

#### 2. Database schema and migrations

Seven append-only migrations under `supabase/migrations/`:

| File                                | Contents                                                                                                                                       |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `00001_create_enums.sql`            | `user_role`, `group_status`, `cycle_status`, `membership_status`, `payment_method`                                                             |
| `00002_create_core_tables.sql`      | `set_updated_at()`; `profiles`, `bhishi_groups`, `members`, `group_members`, `cycles`, `cycle_members`                                         |
| `00003_create_financial_tables.sql` | `installments`, `contribution_obligations`, `payments`, `payouts`, `audit_logs`, void/one-payout constraints                                   |
| `00004_create_indexes.sql`          | 14 targeted indexes, skipping columns already covered by unique constraints                                                                    |
| `00005_create_helper_functions.sql` | `is_admin`, `is_group_member`, `can_access_member`, `can_access_group`, `can_access_cycle`, `can_access_installment`, privilege-change trigger |
| `00006_enable_rls.sql`              | RLS on all 11 application tables                                                                                                               |
| `00007_create_rls_policies.sql`     | 31 policies, explicit grants, anon denial, immutable financial/audit tables                                                                    |

Key integrity decisions:

- UUID primary keys; `TIMESTAMPTZ` timestamps defaulted by the database; `NUMERIC(12,2)` for money.
- `payments` has a composite FK to `contribution_obligations(installment_id, member_id)`, so a payment
  cannot reference a member/installment pair that does not exist.
- `payouts` has a composite FK to `installments(id, recipient_member_id)`, so a payout cannot go to the
  wrong recipient.
- Partial unique index allows exactly one **non-voided** payout per installment.
- Voiding requires `voided_at`, `voided_by` and a non-blank correction reason.
- Historical FKs use `ON DELETE RESTRICT`; actor/creator columns use `SET NULL`; groups and members are
  archived/deactivated instead of deleted.

#### 3. Row Level Security

- All helpers are `SECURITY DEFINER`, `STABLE`, `search_path = ''`, executable by `authenticated` only.
- Members: read own profile, groups they belong to, shared member directory, cycles, schedules,
  obligations, payments and payouts. No writes to operational or financial tables.
- Admins: read everything, manage groups/memberships/cycles, write financial records, read/write audit
  logs.
- No `DELETE` policies anywhere; `DELETE` on `payments`, `payouts` and `audit_logs` is also revoked at
  the privilege level. `audit_logs` has no `UPDATE`/`DELETE` policy or privilege.
- `profiles` has no INSERT policy; admin provisioning is a documented trusted service-role/SQL process.
- Self-promotion is blocked by `enforce_profile_privilege_change()` (SQLSTATE 42501).
- `anon` has no table privileges and no policies.

#### 4. Types, query keys and currency

- `src/types/database.types.ts`: generated from the verified local schema with the Supabase CLI;
  includes all tables, relationships, enums, functions and the `Constants` map.
- `src/lib/query-keys.ts`: structured keys for auth, profiles, groups, members, group members, cycles,
  installments, contribution obligations, payments, payouts, audit logs and dashboards. No fetchers.
- `src/lib/utils.ts`: corrected to **INR**, `en-IN`, `Asia/Kolkata`; verified output `₹1,25,000`,
  `₹12,50,000` number grouping, `12 Nov 2026` date. `DEFAULT_CURRENCY` is now `INR` and date helpers
  pin `Asia/Kolkata`.

#### 5. Seed and documentation

- `supabase/seed.sql`: deterministic development data (1 group, 8 fictional members, 1 cycle, 8
  installments, 64 obligations, 6 payments, 1 payout); idempotent; creates no auth users/profiles.
- `supabase/config.toml`, `supabase/functions/README.md`, `.env.example`, `.gitignore`.
- `docs/DATABASE_ARCHITECTURE.md`: tables, relationships, financial model, RLS matrix, helper
  functions, migration/type-generation commands, environment, admin provisioning and verification.

---

### Sprint 2.5 — Supabase → Neon Backend Migration (2026-11-03)

Backend target changed from Supabase to **Neon PostgreSQL + Managed Better Auth + Neon Data API**. This
was a migration/configuration task, not a feature sprint. Sprint 1 UI was not redesigned and Sprint 3
was not started.

#### 1. Dependencies and removal

- Removed `@supabase/supabase-js` and the entire `supabase/` directory.
- Added `@neon/neon-js@0.10.2` (runtime, current official package).
- Added `@neon/config@1.10.0` (dev, declarative `neon.ts`).
- Deleted `src/lib/supabase.ts`; no Supabase client, env import, function or policy remains.
- `@supabase/auth-js` still appears in `package-lock.json` only as a transitive dependency of Neon's own
  `@neon/auth` package. It is not a direct dependency and is not used for Supabase integration.

#### 2. Neon migration baseline (`db/migrations/`)

- Archived the seven Supabase migrations, seed and `config.toml` under
  `db/legacy/sprint-2-supabase-baseline/` with a "do not apply" README. They were never applied to a
  hosted Supabase project, so no server migration history was broken.
- Rewrote `00001`–`00007` for Neon and added `00008_add_neon_auth_profile_provisioning.sql`.
- `profiles.id` remains an application UUID PK. `profiles.auth_user_id text unique` maps the Neon Auth
  JWT `sub`; there is no FK into the managed `neon_auth` schema and no UUID assumption about auth ids.
- Helpers use `auth.user_id()` through `current_profile_id()`; `is_admin`, `is_group_member`,
  `can_access_member`, `can_access_group`, `can_access_cycle` and `can_access_installment` were adapted.
- RLS targets the Neon Data API `authenticated` role; `anonymous` is denied. `00007` raises a clear
  exception if the Data API has not been enabled (role missing).
- `ensure_own_profile(full_name, phone, email)` lets a signed-in user create exactly one member profile;
  the role is hard-coded to `member`, repeated calls are idempotent, and only `authenticated` may execute
  it. Administrators remain a trusted manual provision.
- The profile trigger now also blocks changes to `id` and `auth_user_id`, in addition to non-admin
  changes to `role` / `is_active`.
- `db/seed.sql` is unchanged in data and still creates no auth users or profiles.

#### 3. Neon configuration and client

- `neon.ts` declares `auth: true` and `dataApi: true`. It provisions nothing until `neon deploy` is
  explicitly approved and the project is linked.
- `src/lib/neon/config.ts` validates `VITE_NEON_AUTH_URL` and `VITE_NEON_DATA_API_URL` without printing
  values; `isNeonConfigured` and `getNeonConfigIssues()` are exported.
- `src/lib/neon/client.ts` lazily creates one shared `createClient<Database>()` instance for Auth and
  Data API, so the Data API automatically uses the Auth JWT. Importing the module is side-effect free.
- `src/lib/neon/auth.ts` and `data-api.ts` expose `getNeonAuth()` and `getNeonDataApi()`; `index.ts`
  re-exports the public surface.
- `DATABASE_URL` is server-side only, documented in `.env.example`, and deliberately absent from
  `src/vite-env.d.ts`.
- `scripts/generate-types.mjs` + `npm run generate-types` run the official Neon generator against
  `DATABASE_URL`.
- `.env.example`, `.gitignore`, `package.json` and `tsconfig.node.json` were updated for Neon.

#### 4. Documentation

- `README.md` and `docs/DATABASE_ARCHITECTURE.md` rewritten for Neon (architecture, env, migrations,
  identity mapping, RLS, type generation, admin provisioning, verification, limitations).
- Outstanding balance documented as
  `GREATEST(expected_amount - SUM(non_voided_payments), 0)`.

### Sprint 2.6 — Project Rebrand (Bachify → Bachat Book) (2026-11-03)

#### 1. Project rebrand — Bachify → Bachat Book

- Display name is now **Bachat Book** everywhere it is shown to users: `APP_NAME` (which drives the logo
  wordmark, document titles and loading label), login and forgot-password copy, admin/member layouts,
  footer and copyright lines, `index.html` title and meta description, the PWA manifest, and the
  `VITE_APP_NAME` default in `.env.example`.
- Package name `bachify` → `bachat-book` in `package.json` and `package-lock.json`.
- Asset `public/icons/bachify-mark.svg` → `public/icons/bachat-book-mark.svg` (`git mv`; manifest and logo
  reference updated). The SVG artwork itself is unchanged.
- Internal identifiers renamed for consistency: `BachifyNeonClient` → `BachatBookNeonClient`,
  `BachifyNeonAuth` → `BachatBookNeonAuth`, and the SVG gradient id `bachify-collected` →
  `bachat-book-collected`.
- The demo admin address `aashish@bachify.app` became `aashish@bachatbook.app`.
- **SQL was deliberately not touched.** Migration and seed headers still contain the word "Bachify" in
  comments only; no schema object, policy, function or grant carries the brand. Rewriting an applied
  baseline for a cosmetic comment would invalidate the verified chain, so it stays as-is. `db/legacy/`
  is likewise preserved verbatim as an archive.
- Historical mentions in this document (for example the `bachify-app/` folder that was considered but
  never created) are preserved verbatim so the Sprint 1 record remains accurate.

#### 2. Stale Supabase copy removed

- The forgot-password and reset-password screens still promised "Supabase" for Sprint 3; both now say
  **Neon Auth**. These were the only user-visible Supabase references left after the migration.
- Stale Supabase wording in `dashboard-page.tsx` and `sample-data.ts` now refers to the Neon Data API.
- `src/types/database.types.ts` still contains the generator-emitted
  `Omit<Database, "__InternalSupabase">` helper alias. It is type-only, unused by application code and
  re-added by the generator on every run, so it is intentionally left in place.

---

### Sprint 2.7 — Hosted Neon Provisioning (2026-11-03)

The hosted environment now exists. This sprint provisioned and verified the database platform only; no
application code, environment values, SQL migrations or database configuration were changed.

#### 1. Hosted project

- Neon project **BachatBook** created; the **production** branch is active.
- **Neon Auth** and the **Neon Data API** are enabled on the production branch, which provides the
  `authenticated` / `anonymous` roles and `auth.user_id()` that the migrations depend on.
- All **8 migrations** (`00001`–`00008`) were executed successfully against the hosted production branch.

#### 2. Hosted database verification

| Check              | Result                           |
| ------------------ | -------------------------------- |
| Application tables | ✅ 11 created                    |
| RLS enabled        | ✅ 11 / 11 application tables    |
| RLS policies       | ✅ 31 total; 0 `DELETE` policies |
| `auth.user_id()`   | ✅ executes successfully         |

These results match the local pre-flight verification recorded under Sprint 2.5, so the schema and policy
set applied remotely are the same ones that were validated locally.

#### 3. Still pending (not claimed as done)

- Real Neon Auth sign-up and sign-in testing.
- Admin user and profile provisioning.
- Hosted JWT forwarding and authenticated RLS testing (per-role visibility through the Data API).
- Password reset and email delivery.
- Application authentication integration (session provider, guards, auth UI wiring).

---

### Sprint 3 — Authentication & Security (2026-11-03)

Sprint 3 replaces the UI-only auth preview with real Managed Better Auth sessions and role-aware
navigation. It adds no CRUD or financial features, creates no administrator account and changes no SQL
migration, RLS policy or grant.

#### 1. Auth client and data access

- Reuses the single shared `createClient<Database>({ auth, dataApi })` client from Sprint 2.5; there is
  still one auth/JWT state for both Auth and the Data API.
- `src/features/auth/api/auth-api.ts` wraps the calls the UI needs:
  - `fetchOwnProfile(authUserId)` → `profiles` selected with `.eq('auth_user_id', …).maybeSingle()`.
  - `createOwnProfile()` → `rpc('ensure_own_profile', …)`.
  - `requestPasswordResetEmail()` → `auth.requestPasswordReset({ email, redirectTo })`.
  - `resetPasswordWithToken()` → `auth.resetPassword({ newPassword, token })`.
  - Error normalization for rate limits, 5xx responses, Data API permission errors and expired JWTs.
- No role, profile id or `auth_user_id` is ever written from browser input. `DATABASE_URL` remains
  server-side only.

#### 2. Session provider and state machine

`src/features/auth/components/auth-provider.tsx` is mounted once in `src/app/providers.tsx`.

| Phase             | Meaning                                                         |
| ----------------- | --------------------------------------------------------------- |
| `loading`         | Restoring the Neon Auth session and/or loading the profile      |
| `unauthenticated` | No Neon Auth session                                            |
| `needs-profile`   | Valid session, but no `public.profiles` row yet                 |
| `authenticated`   | Valid session plus an active profile; role read from `profiles` |
| `inactive`        | Valid session, but the profile has `is_active = false`          |
| `unconfigured`    | Browser-safe Neon URLs are missing or invalid                   |
| `error`           | Session or profile request failed for another reason            |

- Subscribes to `auth.useSession` (nanostore atom) so cross-tab sign-in/sign-out, focus refreshes and
  token expiry all update the UI without a full reload.
- Ignores repeated session notifications for the same identity so token refreshes do not re-query the
  profile.
- Clears the TanStack Query cache on sign-out or session loss so a different account cannot read the
  previous user's cached data.
- In-flight profile requests are invalidated by a request counter, preventing a slow response from
  overwriting a newer sign-in/sign-out.
- Expired Data API JWTs transition the app to `unauthenticated` with an actionable message instead of a
  blank or broken screen.

#### 3. Route guards and redirects

`src/app/router.tsx` now uses:

| Guard            | Routes                  | Behaviour                                                                                               |
| ---------------- | ----------------------- | ------------------------------------------------------------------------------------------------------- |
| `HomeRedirect`   | `/`                     | Role dashboard, `/complete-profile`, or `/login` based on auth phase                                    |
| `RequireRole`    | `/admin/*`, `/member/*` | Redirects unauthenticated users to `/login` with a `from` path; renders a 403 screen for the wrong role |
| `RequireSession` | `/complete-profile`     | Requires a session; sends completed users to their dashboard                                            |

- `/admin` and `/member` index routes still redirect to their dashboards.
- A signed-in member opening an admin URL sees an explicit “You do not have access to this area” screen
  rather than being silently bounced.
- Guards are navigation aids only. Every row and mutation is still authorized by PostgreSQL RLS.
- `protected-route-placeholder.tsx` was deleted.

#### 4. Sign-in, sign-out and profile menu

- `login-page.tsx` calls `auth.signIn.email()` with email, password and `rememberMe`.
- Redirects are driven by render-phase auth state, not by the immediate sign-in result, so a slow profile
  fetch cannot bounce the user to the wrong portal.
- A valid session with no profile goes to `/complete-profile`; a completed user returns to the originally
  requested same-role path when present.
- `profile-menu.tsx` reads the real session profile and calls `auth.signOut()`. Hardcoded preview names,
  email addresses and cross-portal “preview” links were removed.
- Admin and member layouts now read the active identity from the provider instead of shipping sample
  identities.

#### 5. Member onboarding

- `complete-profile-page.tsx` collects full name and optional phone.
- Submitting calls `ensure_own_profile(profile_full_name, profile_phone, profile_email)`.
- Migration `00008` already derives the identity from `auth.user_id()`, forces `role = 'member'` and is
  idempotent; no new migration was required.
- There is still no public sign-up screen. Administrator accounts remain a trusted provisioning task.

#### 6. Password reset

- `/forgot-password` calls `requestPasswordReset({ email, redirectTo: <origin>/reset-password })` and
  always shows the same “if an account exists” confirmation.
- `/reset-password` reads the `token` query parameter appended by Managed Better Auth.
- A missing/used token renders an incomplete-link state; a rejected token renders the server message
  (for example “Invalid or expired session token”).
- Reset links are documented as single-use and expiring.

#### 7. Copy and cleanup

- Removed Sprint 1 “preview” wording from the admin/member shells, dashboard notice, placeholder page,
  navigation comments and auth footer where it would now be inaccurate.
- Updated `src/lib/query-client.ts` to document that auth state is owned by `AuthProvider` and the cache is
  cleared on session loss.

#### 8. Documentation

- Added `docs/AUTHENTICATION.md` with the auth architecture, phases, route guards, onboarding, password
  reset, configuration and hosted-verification checklist.
- Updated `README.md` and this handoff document.

---

### Sprint 4 — Simple Bhishi Workflow (2026-11-03)

Sprint 4 turns the authenticated shell into a small, complete Bhishi app for non-technical family
members. The guiding rule was to add nothing that a 5–10 person group does not need: no reports, charts,
exports, advanced filters or extra settings.

#### 1. Reduced scope and navigation

- Admin destinations reduced to **Home, Groups, Payments, Payouts**; member destinations to **Home, My
  Group, Payments**. Profile is reached from the header profile menu (`/admin/profile`, `/member/profile`).
- One shared mobile-first `AppShell` serves both roles: compact header plus bottom tabs on phones, and the
  same destinations in the header on desktop.
- Deleted the placeholder system (`route-placeholders.ts`, `placeholder-page.tsx`), the old dashboard
  components/data/types, and every route that only showed a planned-feature screen.
- Removed the `recharts` dependency and its focus-outline CSS; the app no longer ships a chart library.
- Added `.prettierignore` so append-only SQL migrations, build output and local `favicon-data/` are not
  reformatted.

#### 2. Typed Bhishi data layer

- `src/features/bhishi/types.ts` — row aliases from the generated database types plus view models for
  groups, members, cycles, installments, obligations, payments, payouts and the flattened record-dialog
  options.
- `src/features/bhishi/api/bhishi-api.ts` — typed Data API queries for all eleven tables, insert mutations
  for groups, members, payments and payouts, member/profile linking, own-profile update, and the
  `activate_cycle(...)` RPC. No `DATABASE_URL` and no service key reaches the browser.
- `src/features/bhishi/lib/derive.ts` — one normalization pass that:
  - derives payment status from non-voided payments against each obligation;
  - derives installment status, paid and collected totals;
  - finds the current/next installment and the current payout recipient;
  - flattens pending payment and payout choices for the two record dialogs.
- `src/features/bhishi/hooks/use-bhishi.ts` — TanStack Query hooks around one compact snapshot key
  (`queryKeys.bhishi.snapshot(profileId)`); every successful mutation invalidates that key.
- `src/features/bhishi/lib/dates.ts` — local-date helpers used by the dialogs.

#### 3. Shared UI and dialogs

- Added `Field`, `Select`, `EmptyState`, `StatusBadge`, `PayoutBadge`, `DataError`, `GroupCard`,
  `InstallmentList` and `MemberList`.
- Added dialog forms: create group, add member, start cycle, record payment, record payout and link login.
- Dialog forms now mount only while open, so their state resets on every open without a reset `useEffect`
  (this also satisfies `react-hooks/set-state-in-effect`).
- All primary actions use large touch targets and short labels; lists and cards replace wide tables.

#### 4. Admin workflow

- **Home** — current installment, payout recipient, collected/pending totals, group cards and quick
  actions to create a group or record a payment.
- **Groups** — group list plus create-group dialog.
- **Group detail** — members, active/inactive membership, optional login linking, chit order, every
  installment with its obligations, payment shortcuts and previous cycles (historical data stays visible).
- **Payments** — outstanding contributions first, then recent payments; record-payment dialog preselects
  the chosen obligation.
- **Payouts** — installments still needing a payout, then recent payouts; record-payout dialog enforces the
  chit-order recipient.

#### 5. Member workflow

- **Home** — this month's contribution status, amount paid/pending, payout recipient and a link to the
  group.
- **My Group** — group details, own chit number, current installment with per-member status, chit order and
  the full installment schedule.
- **My Payments** — pending contributions and personal payment history (including voided entries).
- **Profile** — shared screen for name/phone updates and sign-out.

#### 6. Database migration `00009_add_cycle_activation.sql`

- Adds `activate_cycle(target_group_id, cycle_name, cycle_start_date, chit_order jsonb)` as one
  `SECURITY DEFINER` transaction. It validates the admin role, group state and chit order, creates the
  cycle, `cycle_members`, monthly `installments` and `contribution_obligations`, marks the group active and
  writes an audit-log entry. A half-generated schedule cannot be committed.
- Relies on the existing `members_profile_id_key` partial unique index from `00004`, so a login can be
  linked to at most one member.
- Applied to the hosted Neon production branch; the function was verified, and
  `src/types/database.types.ts` was regenerated to include the new RPC.

#### 7. Documentation

- Updated `README.md` (status, routes, structure, data flow, roadmap, verification, limitations) and
  `db/migrations/README.md` (migration `00009`).
- Updated this handoff document.

---

### Sprint 5 — Bhishi Cycle & Chit Order Management (2026-11-03)

Sprint 5 makes cycle setup an explicit, reviewable workflow. The admin first creates a draft, arranges the
recipient order, then confirms activation. Members only ever see activated cycles. The existing Sprint 4
activation behaviour (generating installments and obligations) is reused, because the payment and payout
screens depend on those rows; it is not new Sprint 5 scope.

#### 1. Database migration `00010_add_cycle_drafts.sql`

- Added partial unique indexes `cycles_one_active_per_group` and `cycles_one_draft_per_group`, so a group can
  have at most one active and one draft cycle at a time. Completed/cancelled history is unaffected.
- Added `create_cycle_draft(target_group_id, cycle_name, cycle_start_date, contribution_amount,
collection_day)`. Admin-only, locks the group, rejects archived groups, duplicate active/draft cycles,
  invalid name/date/amount/day and fewer than two active members. It stores the contribution and
  collection-day snapshots and inserts every active member with a provisional alphabetical chit order.
- Added `set_cycle_chit_order(target_cycle_id, chit_order jsonb)`. Admin-only and draft-only. It validates
  that the JSON covers exactly the participating members with unique member ids and chit numbers 1..N, then
  saves the whole order in one statement pair using a temporary offset to avoid unique-constraint
  collisions.
- Added `activate_cycle_draft(target_cycle_id)`. Admin-only. It locks the group then the cycle, re-validates
  the draft status, no other active cycle, participating members still active, and a complete 1..N order;
  then inserts the monthly installments and contribution obligations from the cycle snapshots, marks the
  cycle and group active, and appends an audit entry — all in one transaction.
- All three functions are `SECURITY DEFINER` with `search_path = ''`; `EXECUTE` is revoked from `PUBLIC` and
  granted only to `authenticated`. The Sprint 4 `activate_cycle(...)` function is left untouched for
  backward compatibility.
- Applied to the hosted Neon production branch and verified; `src/types/database.types.ts` was regenerated
  with all three RPCs.

#### 2. Data layer and derived views

- `GroupView` now exposes `draftCycle`; `latestCycle` excludes draft cycles, so members never see an
  unactivated cycle as their current cycle.
- Added `chitPosition(cycle, memberId)` and `cycleProgress(cycle)` helpers.
- Added `createCycleDraft`, `setCycleChitOrder` and `activateDraftCycle` API wrappers plus
  `useCreateCycleDraft`, `useSetCycleChitOrder` and `useActivateDraftCycle` hooks. The old `activateCycle`
  browser path was removed.
- Added date helpers for the current month and for converting a start month plus collection day into a
  concrete `start_date`, clamping the day to the month's last valid day.

#### 3. Admin UI

- **Group detail** now separates three states: no cycle, draft, and active.
  - The header only offers **Create cycle** when the group has neither an active nor a draft cycle.
  - The summary card shows the cycle's snapshot contribution and collection day once a cycle exists.
- **Create cycle dialog** collects the cycle name, start month, monthly contribution and collection day,
  shows the confirmed active-member list, and saves a draft. The participating members are all active group
  members at creation time; the admin confirms the list but cannot deselect people, keeping the form short.
- **Chit order editor** is a mobile list with large up/down buttons. Each tap saves the whole order through
  the RPC, so duplicate positions can never be persisted. It is only shown for a draft and is replaced by a
  read-only list after activation.
- **Activate cycle dialog** shows the group name, member count, contribution, collection day, start date and
  full recipient order before activation.
- **Cycle schedule** reuses the existing installment list, now showing each recipient's chit position. A
  compact progress summary shows months collected and payouts recorded.
- Previous cycles remain visible in collapsible sections, excluding drafts.

#### 4. Member UI

- Members see only the active or latest non-draft cycle.
- **My Group** shows the cycle's snapshot contribution and collection day, the member count for that cycle,
  their own chit position, the read-only chit order, and the schedule with each recipient's chit position.
- Members have no create, reorder or activate controls.

#### 5. Documentation

- Updated this handoff document, `docs/DATABASE_ARCHITECTURE.md`, `db/migrations/README.md` and `README.md`
  for migration `00010` and the draft workflow.

---

### Sprint 6 — Automatic Monthly Installment Generation (2026-11-03)

Sprint 6 closes the gap between “cycle activated” and “schedule usable”. The generation step already
existed inside `activate_cycle_draft()` from Sprints 4–5, so it was verified against the requested
8-member January 2027 example rather than rebuilt. The new work is the read-only installment detail that
admins and members need to understand the generated schedule.

#### 1. Generation behaviour (reused and verified)

- Activating a draft generates one installment per participating member for the complete cycle. The
  example cycle (8 members, ₹10,000 monthly, January 2027) produces 8 installments and 64 contribution
  obligations.
- Each installment stores the month's due date, expected contribution amount and recipient. The recipient
  is the member holding the chit number equal to the installment number.
- Every participating member — including that month's recipient — receives exactly one obligation per
  installment.
- Amounts come from `cycles.contribution_amount_snapshot`; later edits to the group do not rewrite the
  schedule. Migration `00011` calculates each date from the saved start month and collection-day snapshot,
  clamping to month-end when needed.
- Generation runs inside the existing `SECURITY DEFINER` function transaction: a failure rolls back the
  installments, obligations, cycle/group status changes and audit entry together.
- Duplicate protection is already enforced by `installments_unique_number (cycle_id, installment_number)`,
  `contribution_obligations_unique_member (installment_id, member_id)` and the draft-only activation check.
- Migration `00011` updates both activation functions and adds a date helper; no applied migration, table,
  constraint or RLS policy is changed.

#### 2. Admin installment viewing

- The existing installment cards now label the monthly total as **Expected collection** and show how much
  has actually been collected against it.
- Each card exposes a native expandable **Members & status** section listing every participating member
  with their paid amount, expected amount, remaining amount and Paid/Pending status.
- A partial payment remains Pending until valid payments meet the expected contribution.
- No manual installment creation, editing, deletion or regeneration controls were added. Payment and
  payout actions remain the existing Sprint 4 controls on screens that already pass those callbacks.

#### 3. Member installment viewing

- **My Group** now presents the full **Monthly installments** list with each month's due date, recipient
  and chit position, the member's own contribution amount, and their own paid/pending status and
  remaining amount.
- The current-installment badge on that page now reflects the member's own obligation status instead of
  the aggregate installment status.
- **My Payments** lists the complete monthly schedule (paid and pending months) alongside personal payment
  history, with the member's own amount, due date, recipient and status.
- Members remain read-only. They cannot create, edit or regenerate installments or obligations.

#### 4. Payment-derived status

- Paid/Pending states and outstanding amounts come from non-voided `payments` rows, never from a stored
  editable status. Any total below the expected contribution is Pending.
- Outstanding is `GREATEST(expected_amount - SUM(valid_payments), 0)`. Overpayments do not produce a
  negative balance, and voided payments are ignored.
- There are no late fees, penalties or automatic charges; an unpaid obligation is simply pending.

#### 5. Verification

- 79 rollback-only SQL assertions passed against the hosted Neon branch using the existing deployed
  functions and identity mocks.
- Static checks (`typecheck`, `lint`, `build`, `format:check`) passed after the UI changes.
- Full details are recorded in section I. Hosted authenticated UI verification is still blocked on test
  credentials.

---

## D. Pending Work

Everything below is intentionally **not** implemented, or is implemented but not verified:

- **Authenticated hosted verification:** successful Neon Auth sign-in, session persistence across reloads,
  profile loading, `ensure_own_profile()` success, role-based dashboard routing, hosted JWT forwarding and
  authenticated Data API/RLS evaluation. These need a provisioned test account.
- **Hosted end-to-end Bhishi flow:** creating a group, adding members, creating and activating a cycle
  draft, reordering the chit order, recording a payment/payout, and reading the generated installment
  schedule back as an admin and a linked member have not been exercised against the hosted project.
- **Cycle lifecycle gaps:** there is still no UI to complete/close an active cycle or discard a draft. A
  draft can be activated but not deleted; a group with an active cycle cannot start the next one from the app.
- **Cycle and installment verification scope:** the RPCs and generation rules were verified with SQL
  assertions inside a rollback-only hosted transaction using mocked identity helpers. Real authenticated
  invocation and installment viewing through the Data API remain unverified.
- **Admin provisioning:** the dummy `aashish@bachatbook.app` account is not confirmed linked to
  `public.profiles`; create/link it through the trusted direct-SQL procedure.
- **Member login linking:** the admin “Link login” action exists, but no real member profile has been linked
  and used to sign in.
- **Password-reset email delivery:** the request/reset calls are wired and invalid-token handling was
  verified, but no reset email has been delivered or consumed end-to-end.
- **Edit and archive flows:** group details, member details, membership status and member login unlinking
  are not editable from the UI yet (archive/deactivate paths are available in the schema).
- **Payment correction UI:** the database supports voiding with an actor, time and reason, but no screen
  exposes voiding yet.
- **Automated tests (unit / integration / E2E), CI pipeline, deployment configuration.**
- Dark mode, i18n, offline/PWA service worker (a manifest exists; no service worker is registered).
- Accessibility audit with a dedicated tool (only manual/keyboard checks were performed).
- Reports, exports, advanced analytics, audit-log UI and extra settings are **deliberately out of scope**,
  not pending work. Manual installment editing/regeneration is also deliberately out of scope.

---

## E. Technical Decisions

1. **Converted the existing repo in place.** The folder already contained a fresh Vite React template and
   a git repo; creating `bachify-app/` would have nested a project for no benefit. Template JS files were
   replaced, not layered on top.
2. **Tailwind 3.4 instead of Tailwind 4.** The requested CSS-variable token model maps directly to
   `tailwind.config.ts`; v3 avoids the v4 PostCSS/plugin migration and is stable for later sprints.
3. **No shadcn/ui dependency.** Required primitives were hand-built with Tailwind so behaviour, ARIA and
   props stay fully controlled. `clsx` + `tailwind-merge` provide the `cn()` helper.
4. **TypeScript pinned to `~5.9.3`.** `typescript-eslint@8` supports `<6.1.0`, while npm’s `latest` is
   TypeScript 7 — pinning avoids an unusable lint toolchain.
5. **Single source of colour truth.** HSL variables in `globals.css`, mapped once in `tailwind.config.ts`.
   No component declares raw hex/rgb values; components consume the same CSS variables.
6. **Feature-based structure** (`features/auth`, `features/dashboard`) with shared layers in
   `components/`, `lib/`, `hooks/`, `types/`. New sprints add a feature folder rather than growing pages.
7. **Sample data isolation (superseded in Sprint 4).** All fixtures originally lived in one typed module
   with an `isSampleData: true` discriminator and a removal comment. Sprint 4 deleted that module and
   replaced it with live Data API queries, exactly as planned.
8. **Honest auth UI.** Forms validate locally and say so. No mock session, no fake redirect, no stored
   credentials — this keeps Sprint 3 free of cleanup work and avoids misleading behaviour.
9. **Route-level code splitting.** Auth screens and dashboard are lazy-loaded; layout-level `Suspense`
   shows skeletons rather than a blank screen. This removed the >500 kB single-chunk build warning.
10. **Placeholder guard is explicit (superseded in Sprint 3).** `ProtectedRoutePlaceholder` rendered
    `<Outlet />` and was documented in code and docs; Sprint 3 replaced exactly one component with
    `RequireRole`/`RequireSession`.
11. **Admin vs. member shells are separate (superseded in Sprint 4).** The dark sidebar and light top nav
    originally signalled different roles. Sprint 4 replaced both with one shared mobile-first `AppShell`;
    the role is shown in the profile menu and access is still enforced by guards and RLS.
12. **`vite.config.js` removed.** Two configs coexisted and vite resolved the JS one; deleting it fixed
    the `@` alias in dev.
13. **Added `Alert`** beyond the required component list because every auth screen and the dashboard needs
    a consistent notice surface. No other speculative components were added.

### Sprint 2 decisions

14. **PostgreSQL enums for every closed set.** `user_role`, `group_status`, `cycle_status`,
    `membership_status` and `payment_method` are real types, not text columns with comments, so invalid
    values are rejected by the database and generated TypeScript unions stay exact.
15. **`profiles` and `members` are separate.** A login account is not required to owe contributions.
    `members.profile_id` is nullable and unique when present, allowing a member to exist before (or
    without) an account.
16. **Composite foreign keys for financial integrity.** `payments → contribution_obligations` and
    `payouts → installments` enforce pairing and recipient matching at the database level. A simple
    trigger would leave a window for bad data; a composite FK cannot be bypassed by application bugs.
17. **Cycle snapshots.** `contribution_amount_snapshot` and `collection_day_snapshot` are copied into
    each cycle. Group edits therefore never rewrite historical schedules.
18. **Void, never delete.** Correction fields plus check constraints preserve who voided what and why.
    A partial unique index allows one valid payout per installment while retaining voided history.
19. **`SECURITY DEFINER` helpers with `search_path = ''`.** Policies read `profiles` and memberships
    through these functions, avoiding recursive RLS evaluation. `EXECUTE` is revoked from `PUBLIC` and
    granted to `authenticated` only.
20. **No DELETE policies.** Financial and audit tables also have `DELETE` revoked at the privilege
    level. Archiving/deactivation is the only supported removal path.
21. **Role changes guarded by a trigger.** RLS cannot compare `OLD`/`NEW` columns, so a
    `BEFORE UPDATE` trigger blocks non-admin changes to `role`/`is_active`.
22. **Generated types, not hand-written.** `database.types.ts` was produced by the Supabase CLI from the
    verified local schema, so the client cannot drift from the SQL.
23. **Lazy typed Supabase client.** Importing `src/lib/supabase.ts` does not throw; the first real call
    does, with a readable configuration error. This keeps the Sprint 1 UI runnable without `.env` while
    still failing loudly when Sprint 3 needs the client.
24. **Currency corrected to INR.** `formatCurrency` uses `en-IN`/`INR`; date helpers pin
    `Asia/Kolkata`. Dashboard fixtures are unchanged, so no Sprint 1 UI was disturbed.
25. **Seed creates no auth users.** Fake logins would undermine the honest-auth rule from Sprint 1.
    Auth-dependent columns stay `NULL` and are documented.

### Sprint 2.5 decisions (Neon migration)

26. **One shared Neon client.** `createClient<Database>({ auth, dataApi })` is created once. Auth and Data
    API therefore share one JWT/session state; a second client would risk divergent auth state and
    duplicate token refresh.
27. **`auth_user_id` text mapping, not `profiles.id = auth user id`.** Neon Auth ids are not assumed to be
    UUIDs, and the managed `neon_auth` schema must not be coupled to application FKs. A unique immutable
    text column gives a safe one-to-one mapping while keeping profile ids application-owned.
28. **`auth.user_id()` + `current_profile_id()`.** Every helper resolves identity through one function, so
    the text-vs-UUID detail is isolated and no policy casts a Neon Auth id.
29. **Definer helper functions stay `search_path = ''`.** They read RLS-protected tables without recursive
    policy evaluation; `EXECUTE` is revoked from `PUBLIC` and granted only to `authenticated`.
30. **`ensure_own_profile()` is the only self-service provisioning path.** It forces `role = 'member'`,
    takes no role parameter and is idempotent. Admin provisioning remains manual and trusted.
31. **Neon baseline rather than silent rewrites.** The Supabase files were never applied to a hosted
    database, so the seven files were rewritten for Neon and the originals archived under `db/legacy/`.
    The history and replacement mapping are documented; from `00008` onward the Neon chain is append-only.
32. **`neon.ts` is declarative only.** It records the intended `auth` + `dataApi` services but does not
    provision or deploy them. No `neon deploy` / `neon config apply` / `neon db push` was run.
33. **`DATABASE_URL` is not a Vite variable.** Keeping it unprefixed prevents accidental browser exposure;
    the type generator rejects a `VITE_DATABASE_URL`.
34. **Official generator via a separate package.** `@neon/neon-js` does not bundle `gen-types`; Neon's docs
    direct users to `@neondatabase/neon-js`. The wrapper pins the workflow (not the runtime SDK) and the
    generated file is compatible with `@neon/neon-js`.

### Sprint 3 decisions (authentication)

35. **One shared client remains the auth authority.** Session JWTs and Data API requests share the same
    Neon client, so the Data API always sees the token Managed Better Auth issued. No second client and no
    manual token handling were introduced.
36. **`public.profiles` is the only role source.** The provider reads `role` and `is_active` from the
    profile row returned under RLS. Sign-in forms, route state, local storage and query strings never
    supply a role.
37. **Explicit profile filter for admins.** `fetchOwnProfile()` filters by `auth_user_id` before using
    `.maybeSingle()`, because an administrator's RLS policy can see every profile row.
38. **Session atom, not polling.** The provider subscribes to `auth.useSession` (nanostore) rather than
    polling `getSession()`, gaining cross-tab updates, focus refreshes and expiry handling from the SDK.
39. **Request generation guard.** A monotonically increasing request id prevents a stale profile response
    from a previous session from overwriting the current auth state.
40. **Auth state lives outside TanStack Query.** Session lifecycle is a provider concern; TanStack Query is
    only cleared on sign-out so future data caches cannot leak between accounts.
41. **Guards are navigation aids.** `RequireRole` is documented in code as non-authoritative; PostgreSQL
    RLS remains the security boundary. Wrong-role users get an explicit 403 screen instead of a silent
    redirect, which makes provisioning mistakes visible.
42. **Self-service onboarding is member-only.** `/complete-profile` calls the existing
    `ensure_own_profile()` RPC. It cannot request a role, and no new migration or admin sign-up path was
    added.
43. **Render-phase redirects after sign-in.** The login page does not navigate from the immediate
    `signIn.email()` result; it lets the provider settle the profile phase and redirect from render. This
    avoids a race where a slow profile fetch sends a user to the wrong portal.
44. **Password reset uses the emailed token.** `requestPasswordReset` includes the current origin's
    `/reset-password` URL; the reset page reads `?token=`. Missing tokens render an incomplete-link state
    rather than a form that cannot succeed.
45. **No new migration.** Migration `00008` already provides the only required database capability
    (`ensure_own_profile`). Applied migrations were left untouched.

### Sprint 4 decisions (simple Bhishi workflow)

46. **Drastically reduced scope.** The app keeps only Dashboard, Groups, Members/Chit Order/Installments
    (inside group detail), Payments, Payouts and Profile. Reports, charts, exports, advanced filters and
    settings were removed rather than hidden, because every extra screen makes the app harder for a
    non-technical member.
47. **Members, Chit Order and Installments live inside the group screen.** A separate screen per concept
    added navigation without adding information. The group detail page now shows the whole small-group
    picture in one scroll.
48. **One compact snapshot query.** All eleven tables are fetched in parallel under a single TanStack Query
    key and normalized once. This keeps the number of round trips low on ordinary phones and makes every
    screen consistent after a mutation.
49. **Financial status is always derived, never stored.** Paid amounts, remaining amounts, installment
    status and collection totals are computed from non-voided payments against
    `contribution_obligations.expected_amount`. No running total is written by the browser and no stale
    aggregate can drift.
50. **Cycle activation is atomic in PostgreSQL.** `activate_cycle(...)` performs validation, cycle creation,
    chit assignment, installment generation, obligation generation, group activation and audit logging in
    one transaction. Doing this in several browser requests could leave a partial schedule behind.
51. **One login per member enforced by the database.** The existing `members_profile_id_key` partial index
    makes the “link login” action safe even if two admins attempt it concurrently. No duplicate index was
    added.
52. **Status from the database, not the UI.** Route guards remain navigation aids; RLS still authorizes every
    read and write. A member cannot record a payment even if a UI control were exposed.
53. **Dialogs mount only while open.** Form components are rendered conditionally, so their local state is
    fresh on every open without a reset effect. This removes a class of cascading-render bugs and satisfies
    the `react-hooks/set-state-in-effect` rule.
54. **One shared shell for both roles.** Mobile gets a bottom tab bar with large touch targets and desktop
    gets the same destinations in the header. Role differences are communicated by the profile menu and the
    screens themselves, not by a second navigation system.
55. **Recharts removed.** The only chart was a sample-data preview. Live dashboards use plain cards and
    numbers, which are easier to read on a phone and remove a large dependency from the bundle.
56. **No new runtime dependencies.** The workflow is built with the existing React, Router, TanStack Query,
    Lucide and Neon packages; only `recharts` was removed.

### Sprint 5 decisions (cycle drafts and chit order)

57. **Draft → review → activate, instead of one-shot creation.** Separating the draft lets the admin check
    the member list and arrange the order on a phone without racing the schedule creation. The draft is
    invisible to members until activation.
58. **Three small RPCs instead of browser orchestration.** `create_cycle_draft`, `set_cycle_chit_order` and
    `activate_cycle_draft` each perform their validation and writes in PostgreSQL. Reordering and activation
    cannot leave partial state, and the database still authorizes every step.
59. **Draft membership is fixed to all active group members.** Letting the admin deselect members would add
    a form, validation and a second source of truth for participation. Groups are small; the admin confirms
    the list and adds/removes members at the group level.
60. **Whole-order saves for chit reordering.** Moving a member uses a temporary `chit_number + 1000000`
    offset inside the function so the unique `(cycle_id, chit_number)` constraint is never violated mid-save.
    The client never sends a partial order.
61. **Two partial unique indexes enforce one draft and one active cycle per group.** The rules are enforced
    even if two admins act concurrently, not just in the UI.
62. **Cycle snapshots are the source for activation.** Installments and obligations are generated from the
    cycle's stored contribution and collection day, never from the current group values, so history is
    immutable after activation.
63. **The Sprint 4 activation behaviour is reused.** Installments and obligations are still generated at
    activation because the payment and payout screens depend on them; Sprint 5 does not add new financial
    calculations.
64. **Chit order is editable only while `draft`.** Once activated, only a read-only list is shown and the RPC
    rejects reordering, protecting historical schedules.
65. **One new migration, no edits to applied files.** `00010_add_cycle_drafts.sql` is additive; migrations
    `00001`–`00009` were left untouched.

### Sprint 6 decisions (automatic installments and viewing)

66. **Generation stays inside the activation transaction.** Both activation functions generate the
    complete schedule and one obligation per participating member; existing unique constraints prevent
    duplicate installment numbers and member obligations.
67. **Collection day is the due date.** Migration `00011_collection_day_due_dates.sql` makes both
    activation paths use the cycle's saved collection-day snapshot, clamping dates such as the 31st to
    the final day of shorter months. Previously applied migrations remain unchanged.
68. **Installment detail stays in the existing card.** A native expandable `<details>` section shows the
    member/status list without a new route, dialog or page state. For an 8-person group this is faster to
    scan on a phone and avoids duplicating the schedule UI.
69. **Payment status remains derived in the data layer.** Paid/Pending and outstanding amounts are
    computed from non-voided payment rows against each obligation; incomplete totals remain Pending.
    No stored status or running total was introduced.
70. **Members see their own picture inside the shared schedule.** The member schedule shows the recipient
    for each month, their own contribution/status and the group context, but no other member's payment
    details beyond what the existing RLS policy exposes. All member controls remain read-only.
71. **No manual schedule maintenance.** The admin cannot create, edit, delete or regenerate an installment.
    Activation is the only generation path, which protects historical records and keeps the app small.

Sprint 6 validation: the due-date migration and UI were reviewed in code. Migration `00011` has not been
applied to the hosted database; its SQL and due-date behavior remain unverified. Earlier typecheck/lint/build
results are historical and do not validate the current code.

### Sprint 7 implementation (2026-11-03)

- Reused the existing payment, installment and obligation rows; no applied migration or payment table
  definition was changed.
- Added pending migration `00012_secure_payment_operations.sql`: admin-only `record_payment` and
  `void_payment` RPCs, obligation row locking for serialized partial payments, an overpayment guard,
  payment audit entries, no direct Data API payment inserts/updates, and member reads limited to their own
  payment transactions.
- Routed the existing record-payment form through the transactional RPC, added a review/confirm step,
  and restricted new payment methods to Cash, UPI and Bank Transfer. Voiding asks for a reason and a
  second confirmation; transaction rows remain in history.
- Admin payment screen shows pending amount/status, full payment history, actor and void reason, plus
  per-member record actions from installment details. Member schedule shows expected, paid and
  outstanding amounts; personal payment history remains read-only.
- Existing payments remain multiple partial transactions. The database rejects amounts above the
  outstanding balance; voided rows do not count toward the balance.

**Sprint 6 dependency:** `00011_collection_day_due_dates.sql` has not been applied or validated. Apply and
verify `00011` before `00012`, then verify due dates and the payment workflow against PostgreSQL. Sprint 7
typecheck, lint and build passed on 2026-11-03. Database transaction/RLS tests and mobile-browser tests
remain pending. Authenticated hosted behavior also requires provisioned admin/member test accounts.

### Sprint 8 implementation (2026-11-03)

- Reused the existing payout table, recipient foreign key, partial unique index, void fields and RLS
  read policy; no previously applied migration or table definition was changed.
- Added pending migration `00013_secure_payout_operations.sql`. Admin-only `record_payout` locks the
  installment, derives the recipient from its saved schedule, validates the actual amount/date/method,
  prevents duplicate active payouts, and writes an audit row in the same transaction. `void_payout`
  requires a reason, preserves the payout and audit history, and allows a corrected payout as a new row.
- Revoked direct Data API inserts/updates on payouts; trusted RPCs are the write path. Existing member
  RLS reads are preserved and continue to limit visibility to permitted group schedules.
- Admins can view all installment payout statuses and the full payout history, record after a review
  step, and void a payout with a reason. Members see scheduled recipients, recorded amounts and dates,
  or a pending indicator; member controls remain read-only.
- Actual payout amount is entered independently; it is not prefilled from expected collection. No fees
  or contribution deductions are calculated.

**Sprint 5–7 dependencies:** Sprint 5 migration `00010` is applied, but Sprint 6 migration `00011`
and Sprint 7 migration `00012` remain pending. Apply and validate `00011`, then `00012`, then `00013`
in order before considering the payout workflow live.

Sprint 8 validation on 2026-11-03: typecheck, lint, production build and format check passed.
PostgreSQL execution of migrations `00011`–`00013`, transaction/RLS scenarios with real admin/member
sessions, and a mobile-browser walkthrough remain pending. No hosted database changes were made.

### Sprint 9 implementation (2026-11-03)

- Admin home shows active group count and, for the selected active group, its active cycle,
  contribution snapshot, current installment month, collected and outstanding contributions,
  scheduled recipient and payout status. Multiple active groups have a simple selector.
- Member home shows the selected active group, contribution amount, own payment status/outstanding
  balance, next due date, recipient and own chit position. Multiple active groups have a selector;
  all member controls remain read-only.
- Mobile navigation now has four admin destinations (Home, Groups, Payments, More) and three member
  destinations (Home, My Groups, Profile). Admin More opens Installments, Payouts and Profile.
- Added the admin Installments route using the existing RLS-filtered query and installment cards.
  Existing role guards and database policies remain the access boundary; no financial calculations,
  queries, or schema were added.

Sprint 9 validation on 2026-11-03: typecheck, lint, production build, format check and diff whitespace
check passed. Authenticated admin/member workflows, real RLS behavior, and mobile-browser/responsive
visual checks remain pending because no provisioned test accounts or PostgreSQL client are available.
Migrations `00011`–`00013` from Sprints 6–8 also remain pending deployment and validation.

### Sprint 10 testing and fixes (2026-11-03)

#### Completed checks

- `npm run typecheck` — passed.
- `npm run lint` — passed.
- `npm run build` — passed.
- `npm run format:check` — passed.
- `git diff --check` — passed (Git emitted only line-ending conversion warnings).
- Test discovery: no automated test files or test runner/script are present in the repository.
- Browser smoke check: login loaded at 390 × 844 with no horizontal overflow; unauthenticated access
  to `/admin/dashboard` redirected to `/login` at 1280 × 900. This does not verify authenticated
  routing or the signed-in mobile navigation.
- Static security review: role guards are documented as navigation aids, database policies/functions
  provide authorization, RLS is enabled in the baseline for all 11 application tables, money columns
  use `NUMERIC(12,2)`, and no hard-delete policy/privilege is present. The frontend source/config scan
  found no `DATABASE_URL`, service-role or privileged database credential usage.

#### Bug identified and fixed

- Sign-out errors were ignored and the UI always reported success. The Profile page also stayed on the
  profile route after clearing local auth state and could render blank. Sign-out now returns and
  surfaces the server error, always clears local state, and navigates to login; Profile, auth-status
  and onboarding screens show a warning if remote sign-out cannot be confirmed.

#### Not performed / deployment readiness

- Admin/member login and logout against Neon, invalid credentials, session persistence/expiry, and
  password reset require valid hosted test accounts and service access; they were not run.
- Group/member mutation, cycle activation, installment generation/rollback, payment/payout transaction
  and concurrent-operation tests were not run against PostgreSQL.
- RLS/JWT permission tests require authenticated sessions. SQL migrations `00011`–`00014` are still
  pending, and `psql` is unavailable in this environment; no database migration was applied.
- Responsive screenshot/manual interaction of signed-in dashboards, forms, and bottom navigation was
  not possible without a provisioned account. Only the login viewport and unauthenticated redirect
  were checked in-browser.
- **Not ready for production verification/deployment:** apply and validate migrations `00011`–`00014`
  in order, regenerate database types from the target schema, and execute authenticated RLS, signup,
  role-management and critical financial workflow tests before relying on these features.

### Sprint 11 deployment preparation (2026-11-03)

#### Completed locally

- Read the project and database handoffs, reviewed the current environment-variable contract, Vite
  build setup, SPA routes, password-reset redirect construction, and existing PWA manifest.
- Confirmed `.env` is ignored and not tracked. Its values were not printed or copied into documentation.
  The only browser configuration is `VITE_NEON_AUTH_URL` and `VITE_NEON_DATA_API_URL`; `DATABASE_URL`
  is tooling-only and must not be added to the frontend host.
- Confirmed the repository includes a web manifest and icons, but no service worker/offline caching.
- `npm run typecheck`, `npm run lint`, and `npm run build` passed on 2026-11-03.
- `psql` is unavailable. Migration state is based on the existing handoff: `00001`–`00010` are reported
  applied to the Neon production branch; `00011`–`00013` are pending and were not applied or tested.
- The selected URL `https://bachat-book-circle.vercel.app` responds over HTTPS and serves the Bachat
  Book app shell at `/`. Direct requests to `/login`, `/forgot-password`, `/reset-password`, and
  `/admin/dashboard` returned Vercel 404s and produced browser resource errors. The local
  [`vercel.json`](../vercel.json) adds an SPA fallback, but no Vercel deployment was performed.
- At a 390px viewport, loading `/` reached the sign-in screen without horizontal overflow or browser
  console errors. This does not cover authenticated screens. The direct-route failures were confirmed
  again over HTTPS.
- No production environment variables, Neon Auth redirect settings, database state, accounts, or
  backup settings were configured or verified. The environment has no Vercel CLI/token, `psql`, or
  `DATABASE_URL` process variable; migrations were not applied. The user approved migrations after
  production target and recovery verification, but execution remains blocked by missing database
  access/tooling here.

#### Blockers and required owner actions

- Configure Vercel project access and production environment variables using the deployment guide.
- The worktree contains uncommitted Sprint 6–10 application, migration, and documentation changes.
  The selected release scope is Sprint 11 only; do not include the existing Sprint 6–10 worktree
  changes in deployment unless separately reviewed and approved. Commit the intended Sprint 11 release
  before deploying from the repository; the current branch cannot be treated as a committed release
  artifact.
- With approved Neon production access, verify the target project/branch and backup/restore retention;
  apply and validate migrations `00011`–`00013` in order, then regenerate database types.
- Configure the production application origin and `/reset-password` redirect in Neon Auth, verify
  existing admin/profile mapping, and test member provisioning and read-only access.
- Run authenticated production smoke tests without creating test financial records in real family
  data. Use a controlled test branch for end-to-end financial scenarios.
- After deploying the rewrite, recheck direct route refresh and browser console errors on the selected
  production URL.
- **Launch status: not deployed and not ready for family use.** See
  [`DEPLOYMENT.md`](./DEPLOYMENT.md) for the deployment, setup, and recovery checklist.

---

## F. Dependencies and Environment

### Runtime dependencies

`@hookform/resolvers`, `@neon/neon-js`, `@tanstack/react-query`, `clsx`, `lucide-react`, `react`,
`react-dom`, `react-hook-form`, `react-router-dom`, `tailwind-merge`, `zod`.

### Development dependencies

`@eslint/js`, `@neon/config`, `@types/node`, `@types/react`, `@types/react-dom`, `@vitejs/plugin-react`,
`autoprefixer`, `eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`, `globals`,
`postcss`, `prettier`, `tailwindcss`, `typescript`, `typescript-eslint`, `vite`.

### Environment variables (`.env.example`)

| Variable                 | Purpose                                             | Required now          |
| ------------------------ | --------------------------------------------------- | --------------------- |
| `VITE_APP_NAME`          | Display name                                        | No (defaults in code) |
| `VITE_APP_ENV`           | Environment label                                   | No                    |
| `VITE_NEON_AUTH_URL`     | Managed Better Auth URL, ending in `/auth`          | Yes                   |
| `VITE_NEON_DATA_API_URL` | Data API URL, ending in `/rest/v1`                  | Yes                   |
| `DATABASE_URL`           | Direct PostgreSQL URL for migrations/types (server) | Tooling only          |

> `DATABASE_URL` is server-side only and must never be prefixed with `VITE_`, because Vite exposes every
> `VITE_*` variable to the browser bundle. No secret values are recorded here. `.env` and `.env.*` are
> git-ignored; only `.env.example` is committed.

### Setup

### Application

```bash
npm install
cp .env.example .env        # PowerShell: Copy-Item .env.example .env
npm run dev                 # http://localhost:5173
npm run build && npm run preview
```

### Database — migrations on the hosted Neon project

The hosted **BachatBook** project exists, its **production** branch is active, and Neon Auth + Data API are
enabled. All ten migrations (`00001`–`00010`) have been applied to that branch. Use these commands when
applying future migrations or reseeding a fresh branch:

```bash
# PowerShell
Get-ChildItem db/migrations/*.sql | Sort-Object Name | ForEach-Object {
  psql $env:DATABASE_URL -v ON_ERROR_STOP=1 -f $_.FullName
  if ($LASTEXITCODE -ne 0) { throw "Migration failed: $($_.Name)" }
}

# Seed (development only)
psql $env:DATABASE_URL -v ON_ERROR_STOP=1 -f db/seed.sql

# Regenerate types from the migrated database
npm run generate-types
```

Neon Auth and the Data API are already enabled on the production branch; they provide the
`authenticated` / `anonymous` roles and `auth.user_id()`. Do not run `neon deploy`, `neon config apply` or
`neon db push` without explicit approval.

Sprint 2.5 also verified the same migration set with `psql` against a scratch PostgreSQL 18.4 cluster with
local stand-ins for the Neon roles. Exact commands and results are in `docs/DATABASE_ARCHITECTURE.md`.

Node 20.19+ is required by Vite 8 (verified on Node 24.22.1, npm 11.19.1).

---

## G. Known Issues

1. **Authentication is implemented but not verified with a successful hosted sign-in.** Guards, session
   handling and onboarding are wired; no provisioned test account exists yet. PostgreSQL RLS remains the
   security boundary.
2. **The snapshot query loads all visible rows.** This is efficient for a 5–10 person group but would need
   pagination if the app were ever used at a much larger scale.
3. **`npm audit` reports 12 moderate advisories in development tooling** (ESLint 10 → `minimatch` /
   `eslint-utils` chain). `npm audit --omit=dev` reports **0 vulnerabilities**. Do not run
   `npm audit fix --force`; it downgrades `typescript-eslint` and breaks the lint setup.
4. **Payments and payouts cannot be edited or voided from the UI yet.** The schema supports voiding with an
   actor, time and reason, but no screen exposes it.
5. **Google Fonts requires network access**; with no connection the UI falls back to system sans-serif.
6. **No automated test suite** yet (planned for Sprint 6). Verification was manual plus browser smoke tests.
7. **PWA manifest exists without a service worker**, so the app is not installable/offline yet.
8. **Session persistence depends on Managed Better Auth cookies.** The provider restores the session on
   load and reacts to the session atom, but cross-reload persistence and cross-tab behaviour were not
   exercised with a real signed-in account.
9. **`tailwind-merge` is on v2** (compatible with Tailwind 3); keep the pairing until Tailwind is
   upgraded.

### Sprint 2 issues

10. **No hosted Supabase project.** `VITE_SUPABASE_URL` and a publishable key are still required. The
    client throws a clear configuration error when first used.
11. **Migrations were not applied remotely.** They were verified against a fresh local PostgreSQL 18.4
    cluster with a stubbed `auth` schema. Hosted PostgREST policy evaluation is unverified.
12. **`database.types.ts` reflects the local verified schema**, not a hosted project. Regenerate after
    `supabase db push` and compare the diff.
13. **Seed data has no auth users or profiles**, so it cannot demonstrate an authenticated member
    session without first provisioning an account and linking `members.profile_id`.
14. **No profile provisioning trigger.** Creating an auth user does not create a profile or assign a
    role; that remains a trusted administrative step.
15. **No audit-log writers.** The append-only table and policies exist, but application mutations do
    not emit audit rows yet.
16. **Local `config.toml` enables email sign-up** for development convenience. Disable public sign-up in
    the hosted project until a controlled onboarding flow exists; sign-up alone grants no role.
17. **No automated database tests.** Verification used ad-hoc SQL assertions against a scratch cluster;
    these should become repeatable tests in Sprint 6.

### Sprint 2.5 issues (Neon migration)

18. **Hosted project is provisioned; app credentials are not wired yet.** `VITE_NEON_AUTH_URL` and
    `VITE_NEON_DATA_API_URL` must still be supplied to the client. The client throws a clear configuration
    error when first used.
19. **Hosted migrations are applied, but authenticated access is unverified.** All eight migrations ran on
    the hosted production branch. Hosted JWT forwarding and Data API policy evaluation under a real
    session have not been exercised.
20. **Hosted Auth + Data API are enabled but unused by the app.** No sign-up, sign-in, password reset or
    session handling exists yet; that is Sprint 3.
21. **`database.types.ts` still reflects the local schema.** Regenerate against the hosted branch and
    compare the diff; the table/enum/function surface is expected to match.
22. **No real Neon Auth users exist.** `ensure_own_profile()` is implemented and locally tested, but no
    sign-up/sign-in flow calls it yet; that is Sprint 3.
23. **No profile-provisioning trigger on auth user creation.** A profile is created only by
    `ensure_own_profile()` or by a trusted operator. This is deliberate: sign-up alone grants no role.
24. **Transitive `@supabase/auth-js` remains in the lockfile** inside Neon's `@neon/auth` package. It is not
    used for Supabase integration and must not be added as a direct dependency.

### Sprint 3 issues (authentication)

25. **No valid hosted test credentials.** Successful sign-in, session persistence, profile loading,
    onboarding, role routing, password-reset delivery and authenticated RLS could not be exercised. Only
    unauthenticated and rejected-credential hosted flows were verified.
26. **The dummy admin account is not confirmed provisioned.** `aashish@bachatbook.app` may exist in Neon
    Auth, but no matching `public.profiles` row was verified. Provisioning remains a trusted direct-SQL
    task; do not create a second administrator account.
27. **Hosted JWT forwarding and authenticated RLS are still unproven.** The Data API/Auth endpoints are
    reachable and the `get-session` probe returns `null` when signed out, but policy evaluation under a
    real JWT has not been observed.
28. **`database.types.ts` reflects the local schema (resolved in Sprint 4).** It was regenerated from the
    hosted branch after `00009`; the stale note is retained as Sprint 3 history.
29. **No sign-up UI.** Accounts are expected to be created by an administrator or through the Neon
    Console. Self-service onboarding applies only to an existing authenticated user with no profile.
30. **Password-reset email delivery is unverified.** Request/reset calls and invalid-token handling work,
    but no email has been received or consumed end-to-end.
31. **Guard is not a security boundary.** Route guards only choose screens; forgetting an RLS policy
    would be a real vulnerability, not a UI bug.

### Sprint 4 issues

32. **Hosted end-to-end workflow is unverified.** Group creation, member addition, cycle activation,
    payment/payout recording and member-side reads compile and are covered by the data layer, but none has
    been exercised against the hosted project with a real session.
33. **No edit or archive UI.** Group details, member details, membership status and login unlinking are
    read-only; the schema supports archive/deactivate but no screen exposes it.
34. **No cycle-close UI.** `activate_cycle()` correctly refuses a second active cycle, but there is no
    screen to complete the current cycle, so a group cannot start its next cycle from the app yet.
35. **Audit rows are written only for cycle activation.** Group, member, payment and payout mutations do not
    write audit entries in this sprint.
36. **Payment/payout corrections have no UI.** Voiding is supported by the schema but not exposed.

### Sprint 5 issues

37. **No draft discard or cycle-close UI.** An admin can create and activate a draft but cannot delete it, and
    an active cycle cannot be completed from the app. The database rejects a second active cycle, so a group
    cannot start its next cycle without a trusted SQL update.
38. **Draft visibility is resolved in the client.** RLS intentionally lets group members read all cycles so
    history stays visible; the member screens filter drafts out. A member with direct Data API access could
    still read a draft row for their group, though not change it.
39. **Hosted authenticated verification is still pending.** The new RPCs were executed and inspected on the
    hosted branch, and their logic/RLS was verified inside a rollback-only transaction with identity mocks;
    real JWT-authenticated invocation remains unproven.
40. **Cycle snapshots do not revalidate group edits after activation.** If a group's contribution changes, the
    active cycle keeps its original amount by design. The UI does not yet highlight this difference.

### Sprint 6 issues

41. **Hosted authenticated installment viewing is unverified.** The SQL rules and RLS were exercised with
    rollback-only mocks, but no real admin/member session has opened the new schedule views through the
    Data API.
42. **Generated installments are immutable.** There is no screen to edit, delete or regenerate a schedule.
    This is deliberate: corrections belong to the existing payment/payout voiding model, not to rewriting
    history.
43. **Member screens show the group schedule, not only their own row.** RLS permits group members to read all
    cycles, installments and obligations for their group, so the UI could expose other members' obligation
    amounts. It does not expose other members' payment history through the member pages, but the wider read
    permission is an existing RLS design choice rather than a Sprint 6 change.
44. **No reminders or late fees.** An unpaid contribution stays pending after the due date. Notifications,
    penalties and automatic charges are intentionally out of scope.

---

## H. Next Steps — Authentication and Deployment Verification

**Objective:** apply the local database changes safely, establish and verify the existing initial admin,
then exercise signup, roles, RLS and deployment. The local UI/build is not proof of hosted authentication
or database behavior.

Planned scope:

1. Confirm production branch identity and recovery options; review migrations `00011`–`00014` and apply
   them in order using a trusted database client.
2. Log in using the existing owner account, complete `/initial-admin-setup`, and verify the returned
   profile UUID, Auth link, active state and role against the actual hosted database.
3. Use a separate test account to exercise signup, duplicate email, password validation, email
   verification if enabled, automatic member profile creation, login/logout, session persistence,
   password reset and profile provisioning retry.
4. As Admin, test search, promotion, demotion, activation/deactivation, confirmation, audit entries,
   self-change rejection, and last-active-admin protection. Attempt direct profile role/status changes
   and confirm the database rejects them.
5. As a separate Member, test route denial and authenticated RLS isolation for profiles, groups,
   obligations, payments and payouts. Use a controlled test branch for financial workflows.
6. Regenerate database types after applying migration `00014`, then run formatting, typecheck, lint and
   build checks.
7. Deploy the reviewed release and Vercel SPA rewrite, configure Neon Auth origins/redirects and hosting
   environment values, then re-test direct route refresh and browser flows.
8. Record each result as passed, failed or not run in this handoff and
   [`AUTHENTICATION.md`](./AUTHENTICATION.md). Do not claim hosted/deployed completion until verified.

**Out of scope:** reports, exports, analytics, audit-log UI, advanced settings and filters.

**Prerequisites before starting:** apply and verify migrations `00011` and `00012`; a provisioned
administrator account linked to `public.profiles`; a linked member test account;
`VITE_NEON_AUTH_URL` and `VITE_NEON_DATA_API_URL` present in `.env`.

---

## I. Verification Results

### Sprint 1 — Project Foundation (2026-11-01)

All results below were **actually executed** on 2026-11-01 at the end of Sprint 1.

#### Static checks

| Check                       | Command                    | Result                                      |
| --------------------------- | -------------------------- | ------------------------------------------- |
| TypeScript                  | `npm run typecheck`        | ✅ Passed — 0 errors (strict mode)          |
| ESLint                      | `npm run lint`             | ✅ Passed — 0 errors, 0 warnings            |
| Production build            | `npm run build`            | ✅ Passed — 2820 modules, built in ~0.9 s   |
| Prettier config             | `.prettierrc.json` present | ✅ Applied via `npm run format` when needed |
| Production dependency audit | `npm audit --omit=dev`     | ✅ 0 vulnerabilities                        |
| Full audit                  | `npm audit`                | ⚠️ 12 moderate, development tooling only    |

Build output (largest assets): `index-*.js` 402.34 kB (gzip 125.85), `dashboard-page-*.js` 384.36 kB
(gzip 110.62), `label-*.js` 123.92 kB, auth chunks 1.3–4.2 kB, CSS 30.35 kB. **No chunk-size warning.**

#### Dev server and routing (browser, Chromium via in-app browser)

| Check                                                          | Result                                    |
| -------------------------------------------------------------- | ----------------------------------------- |
| `npm run dev` starts without errors                            | ✅ `http://localhost:5173`                |
| `/` → `/admin/dashboard`                                       | ✅ Redirect works                         |
| `/admin` → `/admin/dashboard`, `/member` → `/member/dashboard` | ✅ Redirects work                         |
| `/login`, `/forgot-password`, `/reset-password` render         | ✅ Correct titles and content             |
| All admin routes render (dashboard + 8 placeholders)           | ✅ Each shows its own heading/placeholder |
| All member routes render (6 placeholders)                      | ✅ Correct member shell                   |
| Unknown route renders 404                                      | ✅ “We couldn’t find that page”           |
| Console errors on any tested route                             | ✅ 0                                      |

#### Forms and components

| Check                                                                                 | Result                                                                   |
| ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Login: empty submit shows both field errors                                           | ✅                                                                       |
| Login: valid input shows “Input looks valid” + toast, no session created              | ✅ (toast: “Sign-in for sita@example.com will be connected in Sprint 3”) |
| Forgot password: empty → “Email is required”; invalid → “Enter a valid email address” | ✅                                                                       |
| Forgot password: valid email shows validation notice                                  | ✅                                                                       |
| Reset password: weak password errors + live rule checklist                            | ✅                                                                       |
| Reset password: mismatched confirmation error                                         | ✅                                                                       |
| Reset password: valid pair shows success notice, nothing saved                        | ✅                                                                       |
| Password visibility toggle switches type and `aria-label`                             | ✅ (`password` → `text`)                                                 |
| Dialog opens, locks body scroll, closes on Escape and restores scroll                 | ✅                                                                       |
| Profile dropdown opens, focuses first item, reports `aria-expanded`, navigates        | ✅                                                                       |
| Toast renders in the live region and dismisses                                        | ✅                                                                       |
| Skeleton/Spinner loading fallbacks render during lazy loads                           | ✅ observed                                                              |

#### Responsive behaviour

| Viewport                | Result                                                                                                                                   |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| 390 px (admin)          | ✅ Sidebar hidden, menu button visible, 1-column cards, chart 302 px wide, table scrolls horizontally, no page-level horizontal overflow |
| 390 px (member)         | ✅ Desktop nav hidden, bottom nav visible with 6 items, no horizontal overflow                                                           |
| 820 px (admin)          | ✅ Sidebar hidden, cards in 2 columns                                                                                                    |
| ≥1024 px (admin/member) | ✅ Full sidebar / horizontal nav, 3-column cards, profile name visible                                                                   |

#### Not verified

- Lighthouse/axe audit, cross-browser testing (Firefox/Safari), automated test suite, real network
  conditions. These are deferred to Sprint 6 (Testing & Deployment).

---

### Sprint 2 — Supabase & Database Architecture (2026-11-03)

All checks below were executed on 2026-11-03. Static checks ran on the project. Database checks ran
against an isolated PostgreSQL **18.4** cluster (port 55432) with a minimal stub for `auth.users`,
`auth.uid()` and the `anon` / `authenticated` / `service_role` roles. **No hosted Supabase project was
created or linked.**

#### Static checks

| Check                       | Command                 | Result                                                  |
| --------------------------- | ----------------------- | ------------------------------------------------------- |
| TypeScript                  | `npm run typecheck`     | ✅ Passed — 0 errors                                    |
| ESLint                      | `npm run lint`          | ✅ Passed — 0 errors, 0 warnings                        |
| Production build            | `npm run build`         | ✅ Passed — 2820 modules, 1.66 s, no chunk-size warning |
| Production dependency audit | `npm audit --omit=dev`  | ✅ 0 vulnerabilities                                    |
| Full audit                  | `npm audit`             | ⚠️ 12 moderate, development tooling only                |
| Dev server                  | `npm run dev` + `GET /` | ✅ HTTP 200, Bachat Book title                          |

Build output: `index-*.js` 402.49 kB (gzip 125.91), `dashboard-page-*.js` 384.36 kB (gzip 110.62),
`label-*.js` 123.92 kB, auth chunks 2.79–4.19 kB, CSS 30.35 kB.

#### Supabase client configuration

| Case                           | Result                                                                                 |
| ------------------------------ | -------------------------------------------------------------------------------------- |
| No `VITE_SUPABASE_*` variables | ✅ `isSupabaseConfigured === false`; 2 actionable issues; `getSupabaseClient()` throws |
| Publishable key                | ✅ client created, `supabase.from` available, same singleton reused                    |
| Legacy anon fallback           | ✅ used only when publishable is empty (`key source: anon`)                            |
| `sb_secret_…` / legacy JWT     | ✅ service-role keys flagged and rejected                                              |

#### Database verification

| Check                            | Result                                                                                                                 |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| 7 migrations in numeric order    | ✅ all applied, `ON_ERROR_STOP=1`                                                                                      |
| Seed twice                       | ✅ second run inserted 0 rows; 1 group / 8 members / 1 cycle / 8 installments / 64 obligations / 6 payments / 1 payout |
| RLS enabled                      | ✅ 11 / 11 application tables                                                                                          |
| Policies                         | ✅ 31; 0 DELETE policies; 0 audit UPDATE/DELETE policies                                                               |
| Money columns                    | ✅ six `NUMERIC(12,2)`; no float/double columns                                                                        |
| Foreign keys                     | ✅ 19 (1 cascade, 7 set null, 11 restrict)                                                                             |
| Payment without obligation       | ✅ rejected 23503                                                                                                      |
| Payout to wrong recipient        | ✅ rejected 23503                                                                                                      |
| Second valid payout              | ✅ rejected 23505                                                                                                      |
| Duplicate chit number            | ✅ rejected 23505                                                                                                      |
| Negative amount                  | ✅ rejected 23514                                                                                                      |
| Void without actor/time/reason   | ✅ rejected 23514                                                                                                      |
| Delete group/member with history | ✅ rejected 23001                                                                                                      |
| Helper functions                 | ✅ all SECURITY DEFINER with `search_path=""`                                                                          |
| `anon` privileges                | ✅ no table SELECT and no policies                                                                                     |

#### RLS identity tests

| Identity                         | Result                                                                                                                         |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Admin                            | ✅ `is_admin()` true; 1 group, 8 members, 3 profiles, 6 payments, 1 payout, 0 audit logs                                       |
| Member (linked to seed member 1) | ✅ 1 group, 8 shared members, own profile only, full ledger for the group                                                      |
| Member writes                    | ✅ payment/payout insert denied 42501; group and chit updates 0 rows; self-promotion denied 42501; payment delete denied 42501 |
| Member self-service              | ✅ own `phone` update succeeded (1 row)                                                                                        |
| Outsider                         | ✅ 0 groups, 0 members, 0 cycles, 0 payments; own profile only                                                                 |

#### Currency

| Expression                 | Result                          |
| -------------------------- | ------------------------------- |
| `formatCurrency(125000)`   | ✅ `₹1,25,000`                  |
| `formatCurrency(5000.5)`   | ✅ `₹5,000.5`                   |
| `formatNumber(1250000)`    | ✅ `12,50,000`                  |
| `formatDate('2026-11-12')` | ✅ `12 Nov 2026` (Asia/Kolkata) |

#### Not verified

- Hosted Supabase project creation/linking and `supabase db push`.
- PostgREST/JWT evaluation of the policies on a hosted project.
- Docker-based `supabase start` / `db reset` (Docker unavailable; `psql` was used instead).
- Authentication, protected routes, CRUD, installment generation and financial calculations — later
  sprints.

---

### Sprint 2.5 — Supabase → Neon Migration (2026-11-03)

All checks below were executed on 2026-11-03. Static checks ran on the project. Database checks ran
against an isolated PostgreSQL **18.4** cluster (port 55432) with local stand-ins for the Neon Data API:
`authenticated` / `anonymous` roles, an `auth` schema and `auth.user_id()` reading
`request.jwt.claim.sub`. At the time no hosted Neon project had been created or linked; that was
superseded by Sprint 2.7, which applied the same migrations to the hosted production branch.

#### Static checks

| Check                       | Command                | Result                                                  |
| --------------------------- | ---------------------- | ------------------------------------------------------- |
| TypeScript                  | `npm run typecheck`    | ✅ Passed — 0 errors                                    |
| ESLint                      | `npm run lint`         | ✅ Passed — 0 errors, 0 warnings                        |
| Production build            | `npm run build`        | ✅ Passed — 2820 modules, 1.42 s, no chunk-size warning |
| Production dependency audit | `npm audit --omit=dev` | ✅ 0 vulnerabilities                                    |
| Full audit                  | `npm audit`            | ⚠️ 12 moderate, development tooling only                |

Build output: `index-*.js` 402.49 kB (gzip 125.91), `dashboard-page-*.js` 384.36 kB (gzip 110.62),
`label-*.js` 123.92 kB, auth chunks 2.79–4.19 kB, CSS 30.35 kB.

#### Neon client and environment

Runtime checks used Vite's `ssrLoadModule` with controlled environments:

| Case                                 | Result                                                                                    |
| ------------------------------------ | ----------------------------------------------------------------------------------------- |
| No `VITE_NEON_*` variables           | ✅ `isNeonConfigured === false`; 2 actionable issues; `getNeonClient()` throws            |
| Valid Auth + Data API URLs           | ✅ configured; trailing slashes trimmed; singleton client; `auth.getSession()` and `from` |
| Invalid URL / credentials / query    | ✅ flagged as invalid absolute URL, embedded credentials and query string/fragment        |
| `DATABASE_URL` missing (type script) | ✅ fails with instructions; never exposed to Vite                                         |
| `VITE_DATABASE_URL` set              | ✅ type script warns to remove it                                                         |

#### Database verification

| Check                              | Result                                                                                                                 |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| 8 migrations in numeric order      | ✅ all applied, `ON_ERROR_STOP=1`                                                                                      |
| Seed twice                         | ✅ second run inserted 0 rows; 1 group / 8 members / 1 cycle / 8 installments / 64 obligations / 6 payments / 1 payout |
| RLS enabled                        | ✅ 11 / 11 application tables                                                                                          |
| Policies                           | ✅ 31; 0 DELETE policies; 0 audit UPDATE/DELETE policies                                                               |
| Functions                          | ✅ 10 (`set_updated_at`, helpers, guard trigger, `ensure_own_profile`)                                                 |
| Money columns                      | ✅ six `NUMERIC(12,2)`; no float/double columns                                                                        |
| Foreign keys                       | ✅ 18 (0 cascade, 7 set null, 11 restrict); no FK into `neon_auth`                                                     |
| `ensure_own_profile()`             | ✅ forces `member`; idempotent; not executable by `anonymous`                                                          |
| Payment without obligation         | ✅ rejected 23503                                                                                                      |
| Payout to wrong recipient          | ✅ rejected 23503                                                                                                      |
| Second valid payout                | ✅ rejected 23505                                                                                                      |
| Void without actor/time/reason     | ✅ rejected 23514                                                                                                      |
| Helper / trigger privileges        | ✅ helpers executable by `authenticated` only; trigger function not callable                                           |
| No DELETE grant for Data API roles | ✅ 0 grants for `authenticated` / `anonymous`                                                                          |
| Type generation                    | ✅ official Neon generator wrote `src/types/database.types.ts`                                                         |

#### RLS identity tests

| Identity                         | Result                                                                                         |
| -------------------------------- | ---------------------------------------------------------------------------------------------- |
| Admin                            | ✅ `is_admin()` true; all groups/members/profiles visible; payment + audit insert allowed      |
| Member (linked to seed member 1) | ✅ 1 group, 8 shared members, own profile only, group payments/payout visible; audit invisible |
| Member writes                    | ✅ payment insert denied 42501; self-promotion and `auth_user_id` change denied 42501          |
| Member self-service              | ✅ own `phone` update succeeded (1 row)                                                        |
| Outsider                         | ✅ 0 groups, 0 members, 0 payments, 0 profiles                                                 |
| `anonymous`                      | ✅ no table access (`permission denied`)                                                       |
| Audit history                    | ✅ admin `UPDATE` / `DELETE` denied; row count unchanged                                       |

#### Final re-verification (post-documentation)

Re-run after all files, docs and formatting were finalised, to confirm nothing drifted:

| Check                     | Result                                                                                    |
| ------------------------- | ----------------------------------------------------------------------------------------- |
| `npm run typecheck`       | ✅ Passed — 0 errors                                                                      |
| `npm run lint`            | ✅ Passed — 0 errors, 0 warnings                                                          |
| `npm run build`           | ✅ Passed — 936 ms, same output sizes, no chunk-size warning                              |
| Direct Supabase package   | ✅ `npm ls @supabase/supabase-js` → empty                                                 |
| Neon packages             | ✅ `@neon/neon-js@0.10.2`, `@neon/config@1.10.0` resolved                                 |
| Residual Supabase strings | ✅ only historical docs, `db/legacy/`, and one generator-typed `__InternalSupabase` alias |
| Scratch cluster           | ✅ stopped and left clean (`pg_ctl stop`, port 55432)                                     |
| `.env` in working tree    | ✅ absent; only `.env.example` is tracked                                                 |

#### Not verified at the time (superseded where noted)

- Hosted Neon project creation/linking, Auth/Data API enablement and `neon deploy` — **resolved by
  Sprint 2.7**.
- Hosted migration application — **resolved by Sprint 2.7**.
- Hosted JWT forwarding and Data API policy evaluation under an authenticated session — still pending.
- Real Neon Auth sign-up/sign-in, admin provisioning, email delivery, password reset and protected
  routes — still pending (Sprint 3).
- CRUD, installment generation and financial calculations — later sprints.

---

### Sprint 2.7 — Hosted Neon Provisioning (2026-11-03)

Verified on the hosted Neon project. These results supersede the earlier "local-only" state recorded for
Sprint 2.5. No SQL migration, application file, environment value or database setting was changed to
produce this record.

#### Verified

| Check                        | Result                                          |
| ---------------------------- | ----------------------------------------------- |
| Hosted Neon project          | ✅ **BachatBook** exists                        |
| Production branch            | ✅ Active                                       |
| Neon Auth                    | ✅ Enabled on the production branch             |
| Neon Data API                | ✅ Enabled on the production branch             |
| Migrations executed remotely | ✅ All 8 (`00001`–`00008`) applied successfully |
| Application tables           | ✅ 11 created                                   |
| RLS enabled                  | ✅ 11 / 11 application tables                   |
| RLS policies                 | ✅ 31 total; 0 `DELETE` policies                |
| `auth.user_id()`             | ✅ Executes successfully                        |

#### Pending (explicitly not verified yet)

| Item                                      | Status  |
| ----------------------------------------- | ------- |
| Real Neon Auth sign-up / sign-in testing  | Pending |
| Admin user and profile provisioning       | Pending |
| Hosted JWT forwarding + authenticated RLS | Pending |
| Password reset and email delivery         | Pending |
| Application authentication integration    | Pending |

The hosted policy count matches the local pre-flight verification, so the same 31 policies (with no
`DELETE` policies) are present remotely. What remains unproven is runtime behaviour under a real session:
JWT forwarding from Managed Better Auth through the Data API, and per-role visibility.

---

### Sprint 3 — Authentication & Security (2026-11-03)

All checks below were executed on 2026-11-03. Static checks ran against the final code. Browser checks
used the Vite dev server on `http://localhost:5174` (port 5173 was already occupied) against the hosted
Neon Auth/Data API endpoints. **No successful hosted sign-in was possible**, so authenticated behaviour is
explicitly recorded as unverified rather than passed.

#### Static checks

| Check                       | Command                | Result                                                              |
| --------------------------- | ---------------------- | ------------------------------------------------------------------- |
| TypeScript                  | `npm run typecheck`    | ✅ Passed — 0 errors                                                |
| ESLint                      | `npm run lint`         | ✅ Passed — 0 errors, 0 warnings                                    |
| Production build            | `npm run build`        | ✅ Passed — 3006 modules, no chunk-size warning                     |
| Prettier (changed files)    | `npx prettier --check` | ✅ Changed auth/app/layout/dashboard files formatted                |
| Production dependency audit | `npm audit --omit=dev` | ✅ 0 vulnerabilities (12 moderate dev-tooling advisories unchanged) |

Pre-existing Prettier warnings remain in unrelated files (`page-header.tsx`, `card.tsx`, `dropdown.tsx`,
`input.tsx`, `toast.tsx`, `button-variants.ts`, `upcoming-collections.tsx`, `database.types.ts`).

#### Hosted authentication probes

| Check                                                     | Result                                                                                                               |
| --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Hosted `GET /get-session` while signed out                | ✅ HTTP 200, body `null`                                                                                             |
| CORS for the dev origin                                   | ✅ `http://localhost:5174` accepted                                                                                  |
| Invalid email/password (`nobody.sprint3@example.invalid`) | ✅ HTTP 401 `INVALID_EMAIL_OR_PASSWORD`; UI shows “Could not sign in / Invalid email or password”                    |
| Missing reset token (`/reset-password`)                   | ✅ “This reset link is incomplete” state                                                                             |
| Bogus reset token (`?token=…`)                            | ✅ Form renders; submit returns HTTP 400 “Invalid or expired session token”, shown as “Could not reset the password” |
| Forgot-password page                                      | ✅ Renders email field and requests a reset email through Managed Better Auth                                        |

#### Route guards (unauthenticated)

| Route               | Result                   |
| ------------------- | ------------------------ |
| `/`                 | ✅ Redirects to `/login` |
| `/admin`            | ✅ Redirects to `/login` |
| `/admin/dashboard`  | ✅ Redirects to `/login` |
| `/member/dashboard` | ✅ Redirects to `/login` |
| `/complete-profile` | ✅ Redirects to `/login` |

No application console errors were observed on the tested routes.

#### Not verified (requires a provisioned account)

- Successful hosted sign-in and sign-out, and the resulting `authenticated` phase.
- Session persistence across reloads and cross-tab sign-in/sign-out.
- Profile loading from `public.profiles` and role-based dashboard routing.
- `ensure_own_profile()` success and the `needs-profile` → `authenticated` transition.
- Inactive-profile handling with a real deactivated account.
- Password-reset email delivery, link consumption and successful password change.
- Hosted JWT forwarding from Managed Better Auth through the Data API.
- Authenticated RLS evaluation (member vs. admin vs. outsider visibility).
- Time-based session expiry and refresh with a real session.

These are blocking verification items, not implementation claims. The code paths exist and compile, but
they have not been proven against a real hosted session.

---

### Sprint 4 — Simple Bhishi Workflow (2026-11-03)

All checks below were executed on 2026-11-03 against the final code. Hosted authenticated behaviour remains
unverified for the same reason as Sprint 3: no valid test credentials.

#### Static checks

| Check                       | Command                | Result                                                              |
| --------------------------- | ---------------------- | ------------------------------------------------------------------- |
| TypeScript                  | `npm run typecheck`    | ✅ Passed — 0 errors                                                |
| ESLint                      | `npm run lint`         | ✅ Passed — 0 errors, 0 warnings                                    |
| Production build            | `npm run build`        | ✅ Passed — 2450 modules, no chunk-size warning                     |
| Prettier                    | `npx prettier --check` | ✅ All source, docs and config files formatted                      |
| Production dependency audit | `npm audit --omit=dev` | ✅ 0 vulnerabilities (12 moderate dev-tooling advisories unchanged) |

Build output: `index.html` 1.12 kB, CSS 27.76 kB (gzip 6.51 kB), route chunks split per page, and the
largest shared chunk 468.77 kB (gzip 146.77 kB) — below the 500 kB warning threshold. Removing Recharts
and the sample dashboard substantially reduced the bundle compared with Sprint 3.

The React 19 `react-hooks/set-state-in-effect` rule flagged the first dialog implementations. Dialogs now
render their form component only while open, so local state resets without a reset effect.

#### Database migration `00009`

| Check                                          | Result                                                         |
| ---------------------------------------------- | -------------------------------------------------------------- |
| Applied to hosted Neon production branch       | ✅ Completed without error                                     |
| `public.activate_cycle(...)` exists            | ✅ 1 function                                                  |
| `members_profile_id_key` unique index retained | ✅ Existing partial unique index; no duplicate added           |
| `src/types/database.types.ts` regenerated      | ✅ Contains `activate_cycle` args and return type              |
| Function executable by `authenticated` only    | ✅ `EXECUTE` revoked from `PUBLIC`, granted to `authenticated` |
| No destructive statements                      | ✅ Additive migration only; no table or data removal           |

#### Scope and route checks

| Check                                                          | Result                                                      |
| -------------------------------------------------------------- | ----------------------------------------------------------- |
| Admin routes: dashboard, groups, groups/:id, payments, payouts | ✅ Present in `router.tsx`; profile via header menu         |
| Member routes: dashboard, groups, payments                     | ✅ Present in `router.tsx`; profile via header menu         |
| Placeholder modules removed                                    | ✅ No imports of `route-placeholders` or `placeholder-page` |
| Sample dashboard components/data/types removed                 | ✅ `features/dashboard` contains only the two live pages    |
| `recharts` removed                                             | ✅ Absent from `package.json` and the bundle                |
| One shared mobile-first shell                                  | ✅ `AppShell` used by both `AdminLayout` and `MemberLayout` |
| Dialogs reset state without effects                            | ✅ ESLint reports no `set-state-in-effect` errors           |

#### Not verified (requires a provisioned account)

- Successful hosted sign-in and the authenticated phase.
- Creating a group, adding members and linking a member login on the hosted project.
- Starting a cycle and confirming the generated chit order, installments and obligations.
- Recording a payment/payout and seeing derived status update for admin and member.
- Member home, My Group and My Payments against real linked data.
- Authenticated RLS visibility (admin vs. member vs. outsider) and JWT forwarding.
- Payment voiding and cycle closing, which have no UI yet (see Known Issues).

---

### Sprint 5 — Bhishi Cycle & Chit Order Management (2026-11-03)

All checks below were executed on 2026-11-03 against the final code. Hosted authenticated behaviour remains
unverified for the same reason as Sprints 3–4: no valid test credentials.

#### Static checks

| Check                       | Command                | Result                                                              |
| --------------------------- | ---------------------- | ------------------------------------------------------------------- |
| TypeScript                  | `npm run typecheck`    | ✅ Passed — 0 errors                                                |
| ESLint                      | `npm run lint`         | ✅ Passed — 0 errors, 0 warnings                                    |
| Production build            | `npm run build`        | ✅ Passed — 2452 modules, no chunk-size warning                     |
| Prettier                    | `npm run format:check` | ✅ All source, docs and config files formatted                      |
| Production dependency audit | `npm audit --omit=dev` | ✅ 0 vulnerabilities (12 moderate dev-tooling advisories unchanged) |

Build output: `index.html` 1.12 kB, CSS 27.76 kB (gzip 6.51 kB), route chunks split per page, largest shared
chunk 468.77 kB (gzip 146.76 kB) — below the 500 kB warning threshold.

#### Database migration `00010`

| Check                                        | Result                                                         |
| -------------------------------------------- | -------------------------------------------------------------- |
| Applied to hosted Neon production branch     | ✅ Completed without error                                     |
| `create_cycle_draft(...)` exists             | ✅ `create_cycle_draft(uuid,text,date,numeric,integer)`        |
| `set_cycle_chit_order(uuid,jsonb)` exists    | ✅ Present                                                     |
| `activate_cycle_draft(uuid)` exists          | ✅ Present                                                     |
| `cycles_one_active_per_group` index exists   | ✅ Present                                                     |
| `cycles_one_draft_per_group` index exists    | ✅ Present                                                     |
| `src/types/database.types.ts` regenerated    | ✅ Contains all three RPCs with args and return types          |
| Functions executable by `authenticated` only | ✅ `EXECUTE` revoked from `PUBLIC`, granted to `authenticated` |
| No destructive statements                    | ✅ Additive migration; previous migrations untouched           |

#### SQL logic and RLS verification (rollback-only, hosted)

Executed with a temporary `pg` script inside a transaction that was rolled back, so the hosted database was
unchanged. Because a direct connection has no Neon Data API JWT, `current_profile_id()` and `is_admin()`
were replaced **inside that transaction only** with GUC-backed mocks; the real helpers were confirmed
restored after rollback. **39 assertions passed**, covering:

| Area                    | Result                                                                                           |
| ----------------------- | ------------------------------------------------------------------------------------------------ |
| Draft creation          | ✅ Returns a draft cycle, stores contribution/day/member-count snapshots, provisional order 1..N |
| Duplicate draft         | ✅ Rejected with “already has a draft cycle”                                                     |
| Too few members         | ✅ Rejected below two active members                                                             |
| Chit reorder persists   | ✅ Saved order matches the admin selection                                                       |
| Duplicate positions     | ✅ Rejected; saved order unchanged                                                               |
| Missing member          | ✅ Rejected (“exactly one chit position”)                                                        |
| Out-of-range numbers    | ✅ Rejected (“must run from 1”)                                                                  |
| Inactive member         | ✅ Activation rejected                                                                           |
| Atomic activation       | ✅ Cycle active, 3 installments, 9 obligations, correct recipients/dates/snapshot amounts        |
| Double activation       | ✅ Rejected; reorder after activation rejected                                                   |
| Active-cycle draft      | ✅ Creating another draft rejected                                                               |
| Historical preservation | ✅ Snapshots unchanged after group edits; previous order and schedule unchanged after next cycle |
| Member read access      | ✅ Member reads both cycles and the schedule; updates affect 0 rows                              |
| Member RPC calls        | ✅ All three functions reject non-admins; direct cycle insert denied by RLS                      |
| Cleanup                 | ✅ Transaction rolled back; no verification rows or mocks left in the hosted database            |

#### UI and scope checks

| Check                                              | Result                                                               |
| -------------------------------------------------- | -------------------------------------------------------------------- |
| Create cycle form uses group defaults              | ✅ Contribution and collection day prefilled from the group          |
| Draft hidden from member “current cycle”           | ✅ `latestCycle` excludes drafts; only admin cards show a draft hint |
| Chit reorder is draft-only and mobile-friendly     | ✅ Large up/down buttons (44 px); read-only list after activation    |
| Activation confirmation shows all required details | ✅ Group, members, contribution, collection day, start date, order   |
| Schedule shows month, recipient and chit position  | ✅ Admin and member views                                            |
| Member screens are read-only                       | ✅ No member create/reorder/activate controls                        |
| Previous cycles exclude drafts                     | ✅ Completed/cancelled cycles remain visible with their own orders   |

#### Not verified (requires a provisioned account)

- Creating, reordering and activating a cycle draft through the hosted Data API under a real admin JWT.
- Member-side visibility of an activated cycle through a real linked login.
- Real RLS behaviour for drafts under authenticated sessions.
- Mobile browser walkthrough of the new dialogs and ordering controls.

---

### Sprint 6 — Automatic Monthly Installment Generation (2026-11-03)

The checks below were recorded for the implementation before migration `00011` and the current UI/status
updates. They cover the existing transaction and generation behavior, but do not validate the new saved-day
date calculation or current frontend changes. Hosted authenticated behaviour remains unverified.

#### Static checks

| Check                       | Command                | Result                                                              |
| --------------------------- | ---------------------- | ------------------------------------------------------------------- |
| TypeScript                  | `npm run typecheck`    | ✅ Passed — 0 errors                                                |
| ESLint                      | `npm run lint`         | ✅ Passed — 0 errors, 0 warnings                                    |
| Production build            | `npm run build`        | ✅ Passed — 2452 modules, no chunk-size warning                     |
| Prettier                    | `npm run format:check` | ✅ All source, docs and config files formatted                      |
| Production dependency audit | `npm audit --omit=dev` | ✅ 0 vulnerabilities (12 moderate dev-tooling advisories unchanged) |

Build output: `index.html` 1.12 kB, CSS 27.76 kB (gzip 6.51 kB), route chunks split per page, largest shared
chunk 468.77 kB (gzip 146.77 kB) — below the 500 kB warning threshold. The new installment detail is small
enough that it stays in the existing `installment-list` chunk.

#### Database verification

| Check                                            | Result                                                 |
| ------------------------------------------------ | ------------------------------------------------------ |
| New migration required                           | ✅ `00011` adds saved collection-day due dates         |
| Hosted migrations                                | ✅ `00001`–`00010` applied; `00011` pending            |
| `installments_unique_number` present             | ✅ `(cycle_id, installment_number)`                    |
| `contribution_obligations_unique_member` present | ✅ `(installment_id, member_id)`                       |
| `activate_cycle_draft(uuid)` present             | ✅ Existing function; replaced by pending `00011`      |
| `src/types/database.types.ts` regenerated        | ✅ Pending migration application and type regeneration |
| Existing table, constraint and RLS definitions   | ✅ Unchanged                                           |

#### SQL logic and RLS verification (rollback-only, hosted)

Executed with a temporary `pg` script inside a transaction that was rolled back, so the hosted database was
unchanged. Because a direct connection has no Neon Data API JWT, `current_profile_id()` and `is_admin()`
were replaced **inside that transaction only** with GUC-backed mocks; the real helpers were confirmed
restored after rollback. **79 assertions passed**, covering:

| Area                  | Result                                                                                                  |
| --------------------- | ------------------------------------------------------------------------------------------------------- |
| Draft for 8 members   | ✅ Snapshots ₹10,000, collection day 10, 8 members and 8 months; every active member participates       |
| Saved chit order      | ✅ Rotation order saved exactly (Member 8 first, then Members 1–7)                                      |
| Forced failure        | ✅ Activation rejected mid-generation; cycle/group stay draft, 0 installments and 0 obligations survive |
| Atomic generation     | ✅ 8 installments, 64 obligations, correct recipients, Jan–Aug 2027 dates and ₹10,000 snapshot amounts  |
| Group edits           | ✅ Group changed to ₹20,000/day 20 before activation; generated schedule still used the draft snapshot  |
| Obligation coverage   | ✅ Exactly 8 obligations per installment and 8 per member, including each recipient                     |
| Retry                 | ✅ Second activation rejected as “Only a draft cycle”; still 8 installments and 64 obligations          |
| Duplicate constraints | ✅ Direct duplicate installment and obligation inserts rejected; existing rows unchanged                |
| Payment totals        | ✅ Paid, overpaid, voided and unpaid cases; outstanding never below zero                                |
| Collection totals     | ✅ Only non-voided payments counted                                                                     |
| Member reads          | ✅ Member reads 8 installments, 64 obligations and their own ₹10,000 contribution                       |
| Member writes         | ✅ Updates affect 0 rows; inserts denied by RLS; deletes denied by privileges; payments read-only       |
| Member RPC            | ✅ `activate_cycle_draft` rejects non-admins                                                            |
| Historical cycles     | ✅ Completed cycle keeps its 8 installments, 64 obligations, ₹10,000 amounts, payment history and order |
| Next cycle            | ✅ A later cycle generates its own 8 installments and ₹12,000 snapshot without touching the first       |
| Cleanup               | ✅ Transaction rolled back; no verification rows, functions or triggers left in the hosted database     |

#### UI and scope checks

| Check                                       | Result                                                           |
| ------------------------------------------- | ---------------------------------------------------------------- |
| Admin sees expected collection per month    | ✅ Label and amount on every installment card                    |
| Admin sees participating members and status | ✅ Expandable list with paid/expected/remaining and Paid/Pending |
| Admin sees recipient and chit position      | ✅ Existing card fields retained                                 |
| Member sees monthly schedule                | ✅ My Group and My Payments list every installment               |
| Member sees own amount and status           | ✅ Own obligation amount, paid/pending status and remaining      |
| Member sees recipient                       | ✅ Recipient name and chit position per month                    |
| No manual installment controls              | ✅ No create, edit, delete or regenerate action                  |
| No late fees/penalties                      | ✅ Unpaid stays pending                                          |
| Mobile layout                               | ✅ Existing single-column cards/lists and 44 px touch targets    |
| Payment/payout workflows unchanged          | ✅ No new recording or correction controls                       |

#### Not verified (requires a provisioned account)

- Opening the admin installment cards and member schedules through the hosted Data API under real JWTs.
- Real RLS visibility for installments, obligations and payments with an authenticated admin/member.
- Mobile browser walkthrough of the expandable member list and the member schedule.
- End-to-end activation → payment recording → derived status refresh in the browser.

Current Sprint 6 changes were not revalidated in this session: typecheck, lint, production build,
PostgreSQL execution of migration `00011`, and mobile-browser checks remain pending.
