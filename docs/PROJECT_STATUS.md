# Bachify — Project Status

> **This file is the handoff document between sprints.** Read it before starting any new sprint.
> Update it at the end of every sprint. Never delete previous sprint history, never mark unfinished work
> as done, and never record secret values.

Last updated: **2026-11-03 (Supabase → Neon backend migration complete and re-verified; Sprint 3 not
started, awaiting review)**

---

## A. Project Information

| Item                | Value                                                                                                                                                                                                                |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Project name        | **Bachify**                                                                                                                                                                                                          |
| Tagline             | Together We Save. Simply.                                                                                                                                                                                            |
| Purpose             | Digital Bhishi / rotating savings group management for small groups (5–10 members): contributions, cycles, collections, payouts and financial history.                                                               |
| Repository          | `D:\Sanket\GitSanket\BachatBook`                                                                                                                                                                                     |
| Current sprint      | **Sprint 2.5 — Supabase → Neon backend migration** (configuration preparation complete)                                                                                                                              |
| Overall status      | Sprint 1 UI is complete. Sprint 2 produced a verified PostgreSQL schema; Sprint 2.5 migrated it to Neon PostgreSQL + Managed Better Auth + Data API. No hosted Neon project exists, and no screen uses the database. |
| Sprint 1 scope rule | UI, layout, routing and documentation only. No database, auth, CRUD or financial logic.                                                                                                                              |
| Sprint 2 scope rule | Database schema, migrations, constraints, indexes, RLS, seed data, types and documentation only. No auth wiring, CRUD, generation or calculations.                                                                   |
| Sprint 2.5 rule     | Replace Supabase with Neon, adapt identity/RLS and regenerate types. No new features, no Sprint 3 auth work, no remote provisioning without approval.                                                                |

### Technology stack (installed)

| Layer               | Package / version                                                                           |
| ------------------- | ------------------------------------------------------------------------------------------- |
| UI framework        | `react@19.3.1`, `react-dom@19.3.1`                                                          |
| Language            | `typescript@5.9.3` (strict)                                                                 |
| Build               | `vite@8.3.5`, `@vitejs/plugin-react@6.1.2`                                                  |
| Styling             | `tailwindcss@3.4.19`, `postcss@8.5.32`, `autoprefixer@10.6.2`                               |
| Routing             | `react-router-dom@7.18.5`                                                                   |
| Server state        | `@tanstack/react-query@5.105.1` (provider only)                                             |
| Forms / validation  | `react-hook-form@7.91.0`, `@hookform/resolvers@7.0.1`, `zod@4.6.7`                          |
| Icons               | `lucide-react@1.66.0`                                                                       |
| Charts              | `recharts@3.10.1`                                                                           |
| Class helpers       | `clsx@2.1.1`, `tailwind-merge@2.6.1`                                                        |
| Lint / format       | `eslint@10.14.0`, `typescript-eslint@8.72.1`, `prettier@3.9.10`                             |
| Backend             | `@neon/neon-js@0.10.2` (Managed Better Auth + Data API); PostgreSQL schema/migrations ready |
| Database (verified) | PostgreSQL 18.4 (local scratch cluster); targets Neon PostgreSQL                            |
| Neon config         | `@neon/config@1.10.0`; declarative `neon.ts` (not deployed)                                 |

---

## B. Sprint Progress

| #   | Sprint                             | Status        | Notes                                                                                                                                |
| --- | ---------------------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Project Foundation & Design System | **Completed** | UI, layouts, routing, auth screens, dashboard preview, docs.                                                                         |
| 2   | Supabase & Database Architecture   | **Completed** | Historical baseline: schema, 7 migrations, RLS, seed, types, docs. Verified locally; never pushed to Supabase.                       |
| 2.5 | Supabase → Neon migration          | **Completed** | Neon baseline migrations, `auth.user_id()` identity mapping, RLS adaptation, types, `neon.ts`, docs. Locally verified; not deployed. |
| 3   | Authentication & Security          | Not Started   | Real sessions, protected routes, password reset.                                                                                     |
| 4   | Group & Member Management          | Not Started   | CRUD for groups + members.                                                                                                           |
| 5   | Cycle & Chit Management            | Not Started   | Cycle rules and chit order.                                                                                                          |
| 6   | Automatic Installment Generation   | Not Started   | Per-cycle installment rows.                                                                                                          |
| 7   | Payment Management                 | Not Started   | Contribution recording and status.                                                                                                   |
| 8   | Payout Management                  | Not Started   | Payout recording tied to collections.                                                                                                |
| 9   | Dashboards                         | Not Started   | Replace sample data with live queries.                                                                                               |
| 10  | Reports & Audit Logs               | Not Started   | Exports, audit trail, settings.                                                                                                      |
| 11  | Testing & Deployment               | Not Started   | Automated tests, CI, production deploy.                                                                                              |

Legend: Not Started · In Progress · Completed · Blocked.

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
  favicon), `public/manifest.webmanifest`, `public/icons/bachify-mark.svg`, `public/favicon.svg`.
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

---

## D. Pending Work

Everything below is intentionally **not** implemented:

- Hosted Neon project provisioning, enabling Auth + Data API, linking the repo and applying migrations
  (no credentials; `neon deploy`/remote apply need explicit approval).
- Neon Auth wiring: session provider, sign-in/out, password reset, email delivery, protected routes,
  role-based redirects.
- Group, member, cycle, installment, payment and payout CRUD or data fetching.
- Chit assignment rules, installment generation, financial calculations, running balances.
- Live dashboards (replacing `sample-data.ts`), member dashboard.
- Reports, exports, audit-log emission from application mutations, settings persistence.
- Atomic PostgreSQL functions for multi-row financial workflows (payment + audit, cycle generation).
- Automated tests (unit / integration / E2E), CI pipeline, deployment configuration.
- Dark mode, i18n, offline/PWA service worker (a manifest exists; no service worker is registered).
- Accessibility audit with a dedicated tool (only manual/keyboard checks were performed).

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
   No component declares raw hex/rgb values (Recharts accepts `hsl(var(--…))` strings).
6. **Feature-based structure** (`features/auth`, `features/dashboard`) with shared layers in
   `components/`, `lib/`, `hooks/`, `types/`. New sprints add a feature folder rather than growing pages.
7. **Sample data isolation.** All fixtures live in one typed module with an `isSampleData: true`
   discriminator and a removal comment, so Sprint 9 can swap in queries file-by-file.
8. **Honest auth UI.** Forms validate locally and say so. No mock session, no fake redirect, no stored
   credentials — this keeps Sprint 3 free of cleanup work and avoids misleading behaviour.
9. **Route-level code splitting.** Auth screens and dashboard are lazy-loaded; layout-level `Suspense`
   shows skeletons rather than a blank screen. This removed the >500 kB single-chunk build warning.
10. **Placeholder guard is explicit.** `ProtectedRoutePlaceholder` renders `<Outlet />` and is documented
    in code and docs; Sprint 3 replaces exactly one component.
11. **Admin vs. member shells are separate** (dark sidebar vs. light top nav) to signal different roles
    without implementing authorization.
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

---

## F. Dependencies and Environment

### Runtime dependencies

`@hookform/resolvers`, `@neon/neon-js`, `@tanstack/react-query`, `clsx`, `lucide-react`, `react`,
`react-dom`, `react-hook-form`, `react-router-dom`, `recharts`, `tailwind-merge`, `zod`.

### Development dependencies

`@eslint/js`, `@neon/config`, `@types/node`, `@types/react`, `@types/react-dom`, `@vitejs/plugin-react`,
`autoprefixer`, `eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`, `globals`,
`postcss`, `prettier`, `tailwindcss`, `typescript`, `typescript-eslint`, `vite`.

### Environment variables (`.env.example`)

| Variable                 | Purpose                                             | Required now          |
| ------------------------ | --------------------------------------------------- | --------------------- |
| `VITE_APP_NAME`          | Display name                                        | No (defaults in code) |
| `VITE_APP_ENV`           | Environment label                                   | No                    |
| `VITE_NEON_AUTH_URL`     | Managed Better Auth URL, ending in `/auth`          | Yes from Sprint 3     |
| `VITE_NEON_DATA_API_URL` | Data API URL, ending in `/rest/v1`                  | Yes from Sprint 3     |
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

### Database — apply migrations to Neon (once a project and data source exist)

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

Prerequisite: enable Neon Auth and the Data API on the branch first; the Data API creates the
`authenticated` / `anonymous` roles and `auth.user_id()`. `neon.ts` declares both services but does not
provision them. Do not run `neon deploy`, `neon config apply` or `neon db push` without explicit approval.

Sprint 2.5 migrations were verified with `psql` against a scratch PostgreSQL 18.4 cluster with local
stand-ins for the Neon roles because no hosted project exists. Exact commands and results are in
`docs/DATABASE_ARCHITECTURE.md`.

Node 20.19+ is required by Vite 8 (verified on Node 24.22.1, npm 11.19.1).

---

## G. Known Issues

1. **No authentication.** All admin/member routes are publicly reachable; the guard is a pass-through by
   design until Sprint 3.
2. **Dashboard uses static fixtures.** Figures are not derived from any data and will not change.
3. **`npm audit` reports 12 moderate advisories in development tooling** (ESLint 10 → `minimatch` /
   `eslint-utils` chain). `npm audit --omit=dev` reports **0 vulnerabilities**. Do not run
   `npm audit fix --force`; it downgrades `typescript-eslint` and breaks the lint setup.
4. **Placeholder routes are intentionally empty** and may look “unfinished” — that is the expected
   Sprint 1 state, labelled on-screen.
5. **Google Fonts requires network access**; with no connection the UI falls back to system sans-serif.
6. **No automated test suite** yet (Sprint 11). Verification was manual plus browser smoke tests.
7. **PWA manifest exists without a service worker**, so the app is not installable/offline yet.
8. **Sidebar/route state resets on full reload** — expected, since there is no persisted session.
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
    these should become repeatable tests in Sprint 11.

### Sprint 2.5 issues (Neon migration)

18. **No hosted Neon project.** `VITE_NEON_AUTH_URL` and `VITE_NEON_DATA_API_URL` are still required. The
    client throws a clear configuration error when first used.
19. **Migrations were not applied remotely.** They were verified against a fresh local PostgreSQL 18.4
    cluster with local stand-ins for `auth.user_id()`, `authenticated` and `anonymous`. Hosted Data API
    JWT forwarding and policy evaluation are unverified.
20. **`neon.ts` has not been deployed.** Auth and Data API do not exist until the project is linked and the
    config is applied with explicit approval.
21. **`database.types.ts` reflects the local verified schema**, not a hosted Neon branch. Regenerate after
    the first remote migration and compare the diff.
22. **No real Neon Auth users exist.** `ensure_own_profile()` is implemented and locally tested, but no
    sign-up/sign-in flow calls it yet; that is Sprint 3.
23. **No profile-provisioning trigger on auth user creation.** A profile is created only by
    `ensure_own_profile()` or by a trusted operator. This is deliberate: sign-up alone grants no role.
24. **Transitive `@supabase/auth-js` remains in the lockfile** inside Neon's `@neon/auth` package. It is not
    used for Supabase integration and must not be added as a direct dependency.

---

## H. Next Sprint — Sprint 3: Authentication & Security

**Objective:** turn the auth UI into real authentication backed by Neon Managed Better Auth and enforce
role-aware route access. No CRUD or financial features yet.

Planned scope:

1. Create/link the hosted Neon project with explicit approval, enable Auth + Data API, apply the
   migrations, regenerate `database.types.ts` and provision the first administrator through the trusted
   direct-SQL process.
2. Add an auth session provider (`getSession`, auth state), sign-in, sign-out and password-reset flows
   using `getNeonAuth()` from `src/lib/neon/auth.ts`.
3. Replace `ProtectedRoutePlaceholder` with real guards for `/admin/*` and `/member/*`, plus role-based
   redirects and an unauthorised page.
4. Call `ensure_own_profile()` after sign-up and load the signed-in user's `profiles` row and role; never
   trust a client-supplied role.
5. Persist sessions safely, handle expired sessions and surface actionable auth errors.
6. Verify hosted RLS: member/admin/outsider visibility, JWT forwarding and Data API role selection.
7. Update `README.md`, `docs/PROJECT_STATUS.md` and the auth documentation.

**Out of scope:** group/member CRUD, cycle or installment logic, payment/payout recording — all remain
in Sprints 4–8.

**Prerequisites before starting:** a Neon project linked to the repository; Neon Auth and Data API
enabled; `VITE_NEON_AUTH_URL` and `VITE_NEON_DATA_API_URL` supplied; migrations applied and verified;
an existing administrator Neon Auth user + profile.

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
  conditions. These are deferred to Sprint 11.

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
| Dev server                  | `npm run dev` + `GET /` | ✅ HTTP 200, Bachify title                              |

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
`request.jwt.claim.sub`. **No hosted Neon project was created or linked, and `neon.ts` was not deployed.**

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

#### Not verified

- Hosted Neon project creation/linking, Auth/Data API enablement and `neon deploy`.
- Hosted JWT forwarding and Data API policy evaluation.
- Real Neon Auth sign-up/sign-in, email delivery, password reset and protected routes.
- CRUD, installment generation and financial calculations — later sprints.
