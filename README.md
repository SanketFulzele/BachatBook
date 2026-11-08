# Bachat Book

**Together We Save. Simply.**

Bachat Book is a digital Bhishi / rotating savings group management application. It helps small groups of
5–10 people organise monthly contributions, chit order, collections, payouts and financial history in
one clear place.

> **Current status: Sprint 5 — Bhishi cycle drafts and manual chit order (implemented; hosted sign-in
> verification pending).**
> Neon Auth sessions, profile loading, role-aware route guards, member onboarding and password reset are
> wired. Admins can create groups, add members, create a cycle draft, arrange the chit order, confirm and
> activate it, then record payments and payouts. Members can see their activated cycle, own chit position,
> monthly contribution status, payout recipient and payment history. Dashboards read real database rows
> through the Neon Data API.
>
> The backend target is **Neon PostgreSQL + Neon Managed Better Auth + Neon Data API**. The schema was
> verified against a real local PostgreSQL 18.4 instance and all ten migrations have been applied to the
> hosted project. Successful hosted sign-in and authenticated RLS evaluation still need a provisioned test
> account. See [`docs/PROJECT_STATUS.md`](docs/PROJECT_STATUS.md) for sprint history,
> [`docs/AUTHENTICATION.md`](docs/AUTHENTICATION.md) for the auth design and
> [`docs/DATABASE_ARCHITECTURE.md`](docs/DATABASE_ARCHITECTURE.md) for the database reference.

---

## Architecture

```text
React 19 + Vite
      │
      │  @neon/neon-js (one shared client)
      ├──────────────► Neon Managed Better Auth  ──► neon_auth schema (managed by Neon)
      │                        │
      │                        │ JWT (sub, role=authenticated)
      │                        ▼
      └──────────────► Neon Data API (PostgREST)  ──► PostgreSQL RLS ──► public schema
                                                          │
                                                          └─ PostgreSQL functions for atomic
                                                             financial workflows (later sprints)
```

- The browser never receives a PostgreSQL connection string.
- The Data API derives the database role from the JWT: `authenticated` for signed-in users and
  `anonymous` otherwise. PostgreSQL RLS is the authority, not React route guards.
- `public.profiles.auth_user_id` stores the Neon Auth JWT `sub` as `text`. Application profile ids stay
  independent UUIDs, and the managed `neon_auth` schema is never modified by application migrations.

---

## Tech stack

| Area         | Choice                                                  |
| ------------ | ------------------------------------------------------- |
| Framework    | React 19 + TypeScript 5.9 (strict mode)                 |
| Build tool   | Vite 8                                                  |
| Styling      | Tailwind CSS 3.4 + CSS-variable design tokens           |
| Routing      | React Router 7 (data router, nested layouts)            |
| Server state | TanStack Query 5 (provider; cache cleared on sign-out)  |
| Forms        | React Hook Form 7 + Zod 4                               |
| Icons        | Lucide React                                            |
| Backend      | `@neon/neon-js` 0.10.2 — Managed Better Auth + Data API |
| Database     | Neon PostgreSQL; locally verified on PostgreSQL 18.4    |
| Quality      | ESLint 10, typescript-eslint, Prettier                  |

---

## Quick start

**Prerequisites:** Node.js 20.19+ (developed on Node 24) and npm 11+.

```bash
npm install
cp .env.example .env      # Windows PowerShell: Copy-Item .env.example .env
npm run dev
```

Open <http://localhost:5173>. Unauthenticated visits redirect to `/login`; after sign-in the app routes to
the dashboard for the role stored in `public.profiles`.

Authentication requires the two `VITE_NEON_*` variables. Without them the app runs but shows a
configuration screen instead of pretending to be signed in.

### Environment variables

| Variable                 | Required     | Notes                                                             |
| ------------------------ | ------------ | ----------------------------------------------------------------- |
| `VITE_APP_NAME`          | No           | Defaults in code                                                  |
| `VITE_APP_ENV`           | No           | e.g. `development`                                                |
| `VITE_NEON_AUTH_URL`     | Yes          | Managed Better Auth URL, ending in `/auth`                        |
| `VITE_NEON_DATA_API_URL` | Yes          | Data API URL, ending in `/rest/v1`                                |
| `DATABASE_URL`           | Tooling only | Direct PostgreSQL URL for migrations/types. **Server-side only.** |

`DATABASE_URL` must never be prefixed with `VITE_`, because Vite exposes every `VITE_*` variable to the
browser bundle. `src/lib/neon/config.ts` validates the two browser-safe URLs and reports problems
without printing their values.

### Available scripts

| Script                   | Purpose                                                      |
| ------------------------ | ------------------------------------------------------------ |
| `npm run dev`            | Start the Vite dev server with HMR                           |
| `npm run build`          | Type-check, then create a production build                   |
| `npm run preview`        | Serve the built `dist/` folder locally                       |
| `npm run typecheck`      | Run TypeScript in build mode without emitting                |
| `npm run lint`           | Run ESLint over the repository                               |
| `npm run generate-types` | Regenerate `src/types/database.types.ts` from `DATABASE_URL` |
| `npm run format`         | Format the repository with Prettier                          |
| `npm run format:check`   | Verify formatting without writing changes                    |

---

## Database & Neon

### Layout

```text
db/
├── migrations/
│   ├── 00001_create_enums.sql
│   ├── 00002_create_core_tables.sql
│   ├── 00003_create_financial_tables.sql
│   ├── 00004_create_indexes.sql
│   ├── 00005_create_helper_functions.sql
│   ├── 00006_enable_rls.sql
│   ├── 00007_create_rls_policies.sql
│   ├── 00008_add_neon_auth_profile_provisioning.sql
│   ├── 00009_add_cycle_activation.sql
│   ├── 00010_add_cycle_drafts.sql
│   └── README.md                 # per-file history and apply commands
├── legacy/sprint-2-supabase-baseline/   # archived, never applied, do not run
└── seed.sql                      # deterministic development seed

neon.ts                           # declarative Auth + Data API config (not applied)
```

### Tables

`profiles`, `bhishi_groups`, `members`, `group_members`, `cycles`, `cycle_members`, `installments`,
`contribution_obligations`, `payments`, `payouts`, `audit_logs`.

- UUID primary keys, `TIMESTAMPTZ` timestamps, `NUMERIC(12,2)` for every monetary column.
- Cycles snapshot the contribution amount and collection day so later group edits cannot rewrite
  history.
- `payments` is linked to `contribution_obligations` by a composite foreign key, and `payouts` to the
  installment's designated recipient, so invalid financial rows are rejected by PostgreSQL.
- At most one non-voided payout exists per installment; corrections void the old row.
- Historical relationships use `ON DELETE RESTRICT`; groups are archived and members deactivated rather
  than deleted.
- Outstanding balance is always computed as
  `GREATEST(expected_amount - SUM(non_voided_payments), 0)` — never as a stored running total and never
  below zero.
- A member login is linked by setting `members.profile_id` to a `profiles.id`; a unique partial index
  allows at most one member record per login. Members without a link cannot see a group.
- `activate_cycle(...)` runs as one transaction: it validates the chit order, creates the cycle, chit
  assignments, monthly installments and contribution obligations, marks the group active and writes an
  audit entry. A half-generated schedule cannot be left behind.
- The Sprint 5 draft workflow uses three smaller functions: `create_cycle_draft(...)` saves the cycle shell
  with every active member, `set_cycle_chit_order(...)` reorders a draft with duplicate/missing checks, and
  `activate_cycle_draft(...)` re-validates and activates atomically. Partial unique indexes allow at most
  one draft and one active cycle per group.

### Row Level Security

RLS is enabled on every table. All policies target the Neon Data API `authenticated` role;
`anonymous` has no table privileges.

- **Members** can read their own profile, their groups, shared member details, cycles, schedules,
  obligations, payments and payouts — and cannot write to any operational or financial table.
- **Admins** can read all records, manage groups/memberships/cycles, write financial records and read
  or append audit logs.
- There are **no DELETE policies**; `DELETE` is also revoked at the privilege level. `audit_logs` is
  append-only and cannot be updated.
- Role self-promotion is blocked by a database trigger, not only by the UI.
- Identity helpers use `auth.user_id()` (text) through `public.current_profile_id()`, so no UUID
  assumption is made about Neon Auth user ids.

Full access matrix and helper functions are documented in
[`docs/DATABASE_ARCHITECTURE.md`](docs/DATABASE_ARCHITECTURE.md).

### Apply migrations

Migrations are applied with `psql`, not from browser code. `DATABASE_URL` must be the **direct**
(non-pooled) Neon connection string.

```bash
# Bash
for file in db/migrations/*.sql; do
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$file" || exit 1
done
```

```powershell
# PowerShell
Get-ChildItem db/migrations/*.sql | Sort-Object Name | ForEach-Object {
  psql $env:DATABASE_URL -v ON_ERROR_STOP=1 -f $_.FullName
  if ($LASTEXITCODE -ne 0) { throw "Migration failed: $($_.Name)" }
}
```

`neon.ts` declares the intended hosted configuration but provisions nothing. Do **not** run
`neon deploy`, `neon config apply` or `neon db push` until the repository is linked to a Neon project
and the change has been explicitly approved.

### Generate types

```bash
npm run generate-types
```

The script reads `DATABASE_URL` (or `.env`), runs the official Neon type generator and overwrites
`src/types/database.types.ts`. The generator is shipped separately from `@neon/neon-js`; Neon's docs
point to `@neondatabase/neon-js` for the CLI, and the generated file works with the current SDK.
Never hand-edit the generated file.

### Provision the first administrator

Public signup can create **member** profiles only. The first administrator uses the website's
`/initial-admin-setup` flow, backed by migration `00014_auth_signup_and_role_management.sql`. Its
database function is bound to the existing owner-approved Neon Auth user ID, links the single existing
matching application profile, and permanently disables setup after the first claim. Apply and verify
pending migrations before using this route; see
[`docs/AUTHENTICATION.md`](docs/AUTHENTICATION.md) and
[`docs/DATABASE_ARCHITECTURE.md`](docs/DATABASE_ARCHITECTURE.md).

### Development seed

`db/seed.sql` contains a fictional group, eight members, one cycle, eight installments, 64 obligations,
six payments and one payout. It is idempotent and creates **no** Neon Auth users and **no** profiles, so
it never creates a fake login. Every auth-dependent column is `NULL`.

---

## Routes

| Route                    | Screen                                                                      |
| ------------------------ | --------------------------------------------------------------------------- |
| `/`                      | Auth-aware redirect to a role dashboard, onboarding or `/login`             |
| `/login`                 | Managed Better Auth sign-in                                                 |
| `/sign-up`               | Public Managed Better Auth signup; new profiles are members                 |
| `/initial-admin-setup`   | One-time, database-restricted setup for the existing initial admin          |
| `/forgot-password`       | Requests a reset email                                                      |
| `/reset-password`        | Completes a reset with the emailed `?token=`                                |
| `/complete-profile`      | Member onboarding via `ensure_own_profile()`                                |
| `/admin`                 | Admin-only; redirects to `/admin/dashboard`                                 |
| `/admin/dashboard`       | Admin home: current installment, recipient, pending payments, quick actions |
| `/admin/groups`          | Group list and create group                                                 |
| `/admin/members`         | Admin view of group members                                                 |
| `/admin/user-management` | Search accounts and manage roles/access                                     |
| `/admin/groups/:id`      | Members, login linking, draft cycle, chit order, activation, schedule       |
| `/admin/payments`        | Outstanding contributions and recent payments                               |
| `/admin/payouts`         | Payout-due installments and recent payouts                                  |
| `/admin/profile`         | Shared profile screen                                                       |
| `/member`                | Member-only; redirects to `/member/dashboard`                               |
| `/member/dashboard`      | Member home: contribution status, totals, payout recipient                  |
| `/member/groups`         | My group, chit order and full installment schedule                          |
| `/member/installments`   | Personal installment obligations and payment status                         |
| `/member/payments`       | Full monthly schedule and personal payment history                          |
| `/member/profile`        | Shared profile screen                                                       |
| `*`                      | Custom 404 page                                                             |

`RequireRole` protects `/admin/*` and `/member/*`. A signed-in user with the wrong role sees an explicit
access-denied screen. **The guard chooses a screen; it is not the security boundary.** PostgreSQL RLS
authorizes every row and mutation. See [`docs/AUTHENTICATION.md`](docs/AUTHENTICATION.md).

Navigation is mobile-first. Admins have Dashboard, Groups, Members and User Management, with secondary
destinations and Profile under More. Members have Dashboard, My Groups, My Installments, My Payments and
Profile. PostgreSQL RLS remains the authorization boundary.

---

## Project structure

```text
.
├── db/
│   ├── migrations/                # Versioned Neon PostgreSQL migrations
│   ├── legacy/                    # Archived Supabase baseline (do not apply)
│   └── seed.sql
├── docs/
│   ├── PROJECT_STATUS.md          # Sprint history — read this first
│   ├── AUTHENTICATION.md          # Sessions, guards, onboarding, password reset
│   └── DATABASE_ARCHITECTURE.md   # Tables, RLS, migrations, provisioning
├── public/
│   ├── favicon.ico
│   ├── favicon-16x16.png
│   ├── favicon-32x32.png
│   ├── apple-touch-icon.png
│   ├── android-chrome-192x192.png
│   ├── android-chrome-512x512.png
│   ├── bachat-book-logo.png
│   └── site.webmanifest
├── scripts/
│   └── generate-types.mjs         # Neon type generator wrapper
├── src/
│   ├── app/                       # App shell, providers, router
│   ├── components/
│   │   ├── ui/                    # Reusable design-system primitives
│   │   ├── common/                # Logo, page header
│   │   ├── layout/                # Shared AppShell, nav config, profile menu
│   │   └── feedback/              # Loading, error and 404 states
│   ├── features/
│   │   ├── auth/                  # provider, guards, api, pages, schemas, types
│   │   ├── bhishi/                # shared data layer, dialogs, cards, status UI
│   │   ├── dashboard/             # admin and member home pages
│   │   ├── groups/                # admin groups, group detail, member group
│   │   ├── payments/              # admin payments, member payments
│   │   ├── payouts/               # admin payouts
│   │   └── profile/               # shared profile screen
│   ├── hooks/
│   ├── lib/
│   │   ├── neon/                  # config, client, auth, data-api entry points
│   │   └── ...                    # constants, query client, query keys, utils
│   ├── styles/globals.css         # Design tokens & base styles
│   ├── types/                     # Generated database types + domain types
│   ├── vite-env.d.ts              # Typed VITE_ environment variables
│   └── main.tsx
├── .env.example
├── eslint.config.js
├── index.html
├── neon.ts                        # Declarative Neon services (Auth + Data API)
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── vite.config.ts
```

The `@/*` path alias maps to `src/*` in both TypeScript and Vite.

### Brand and favicon assets

The browser favicon variants, Apple touch icon, Android install icons, and `site.webmanifest` are served
from `public/`. The shared `Logo` component uses `public/bachat-book-logo.png` (the supplied
`favicon-data/BachatBook.png`) throughout the app. The older standalone SVG favicon and SVG logo mark
have been removed.

---

## Design system

- **Tokens:** colours are declared once as HSL CSS variables in `src/styles/globals.css` and mapped to
  Tailwind utilities in `tailwind.config.ts` (`bg-primary`, `text-muted-foreground`, `border-border`, …).
  Components never hardcode hex values.
- **Palette:** deep emerald primary, dark navy secondary, soft off-white background, white cards, dark
  slate text, plus success / warning / error tones.
- **Typography:** Inter (loaded from Google Fonts) with tight, consistent heading scale.
- **Reusable components:** Button, Input, Label, Card (with header/content/footer parts), Badge, Dialog,
  Dropdown, Table, Avatar, Skeleton, Spinner, Toast, plus Alert and shared loading/error states.
- **Currency:** INR (`₹`), locale `en-IN`, timezone `Asia/Kolkata`. `formatCurrency(125000)` returns
  `₹1,25,000`; `formatNumber(1250000)` returns `12,50,000`.

### Data flow

All screens read from one compact snapshot query (`queryKeys.bhishi.snapshot(profileId)`), which fetches
the eleven tables in parallel through the Neon Data API. RLS filters the rows before they arrive.

`src/features/bhishi/lib/derive.ts` builds the small view models used by the screens:

- payment status is derived from non-voided payments against each obligation;
- installment status and collected totals are derived the same way;
- the current recipient and the next installment are selected for the home screens;
- pending payment and payout choices are flattened for the two record dialogs.

Mutations insert a group, a member, a payment or a payout, save a cycle draft's chit order, create a draft
or call `activate_cycle_draft`. Every successful mutation invalidates the snapshot key. No financial value
is stored as a running total in the browser.

---

## Sprint roadmap

| Sprint | Scope                                                                                                     | Status                                    |
| ------ | --------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| 1      | Project foundation & design system                                                                        | Completed                                 |
| 2      | Database architecture (Neon)                                                                              | Completed                                 |
| 3      | Authentication & security                                                                                 | In progress (hosted verification pending) |
| 4      | Simple Bhishi workflow: groups, members, chit order, installments, payments, payouts, dashboards, profile | Implemented (hosted verification pending) |
| 5      | Cycle drafts, manual chit order, confirmation activation and schedule viewing                             | Implemented (hosted verification pending) |
| 6      | Automatic monthly installment generation and read-only admin/member installment viewing                   | Implemented (hosted verification pending) |
| 7      | Testing & deployment                                                                                      | Not started                               |

Reports, exports, audit-log UI, advanced analytics, settings and broad filters are deliberately **not**
planned. They are not required to run a small Bhishi group and would make the app harder to use.

---

## Verified

### Sprint 1 (2026-11-01)

- `npm run typecheck` — passed, 0 errors.
- `npm run lint` — passed, 0 errors / 0 warnings.
- `npm run build` — passed; largest chunks ≈ 402 kB and 384 kB (no size warning).
- `npm audit --omit=dev` — 0 vulnerabilities in production dependencies.
- Browser smoke test — every route renders, forms validate, dialog/dropdown/toast work, no console
  errors, and the admin/member layouts adapt at 390 px, 820 px and desktop widths.

### Sprint 2 (2026-11-03)

- `npm run typecheck` — passed, 0 errors.
- `npm run lint` — passed, 0 errors / 0 warnings.
- `npm run build` — passed; 2,820 modules, no chunk-size warning.
- `npm audit --omit=dev` — 0 vulnerabilities.
- Seven migrations applied in order to an isolated PostgreSQL 18.4 cluster with
  `ON_ERROR_STOP=1`; seed applied twice without duplicates.
- RLS enabled on 11/11 tables; 31 policies; no DELETE policies; audit logs append-only.
- Composite foreign keys, void rules, one-payout-per-installment and RESTRICT behaviour exercised with
  expected SQLSTATEs.
- Simulated admin/member/outsider identities confirmed row visibility and write denial.
- INR/date formatting verified in Node: `₹1,25,000`, `₹5,000.5`, `12 Nov 2026`.

### Neon migration (2026-11-03)

- Eight Neon migrations applied in order to an isolated PostgreSQL 18.4 cluster with local stand-ins for
  `auth.user_id()`, `authenticated` and `anonymous`; seed applied twice without duplicates.
- RLS enabled on 11/11 tables; 31 policies; no DELETE grants for either Data API role.
- `ensure_own_profile()` forced `role = 'member'`, was idempotent, and could not be executed by
  `anonymous`.
- Member/outsider/admin visibility, write denial, self-promotion blocking, identity immutability, audit
  append-only behaviour, composite foreign keys, void rules and one-payout-per-installment were all
  exercised with expected results.
- `src/types/database.types.ts` was regenerated from that verified schema with the official Neon
  generator.

**Not verified:** a hosted Neon project, hosted Auth/Data API endpoints, JWT forwarding through the
Data API, hosted RLS policy evaluation, email delivery and real browser sign-in. No remote migration or
`neon deploy` was run. _(The hosted project, migrations and endpoint reachability were resolved by
Sprint 2.7; authenticated behaviour remained pending entering Sprint 3.)_

### Sprint 3 (2026-11-03)

- `npm run typecheck` — passed, 0 errors.
- `npm run lint` — passed, 0 errors / 0 warnings.
- `npm run build` — passed; 3,006 modules, no chunk-size warning.
- Unauthenticated requests to `/`, `/admin`, `/admin/dashboard`, `/member/dashboard` and
  `/complete-profile` redirect to `/login`; no console app errors.
- Hosted `GET /get-session` returns 200 with body `null` while signed out; CORS accepts the dev origin.
- Invalid credentials return hosted 401 `INVALID_EMAIL_OR_PASSWORD` and the UI shows
  “Could not sign in / Invalid email or password”.
- `/reset-password` without a token shows the incomplete-link state; a bogus token renders the form and
  submission returns the hosted “Invalid or expired session token” error.
- `/forgot-password` renders and submits through Managed Better Auth.

**Not verified:** successful sign-in/sign-out, session persistence, profile loading, onboarding,
role-based dashboards, password-reset email delivery, hosted JWT forwarding and authenticated RLS. These
need a provisioned test account.

### Sprint 4 (2026-11-03)

- `npm run typecheck` — passed, 0 errors.
- `npm run lint` — passed, 0 errors / 0 warnings.
- `npm run build` — passed; lazily split page chunks, no chunk-size warning.
- Prettier — all source, docs and config files formatted.
- `npm run generate-types` — regenerated from the hosted schema after `00009`; includes `activate_cycle`.
- `00009_add_cycle_activation.sql` — applied to the hosted Neon database; the `activate_cycle` function was
  verified, and login-to-member uniqueness remains enforced by the existing `members_profile_id_key` index.
- Admin navigation reduced to Home, Groups, Payments and Payouts; member navigation to Home, My Group
  and Payments.
- Placeholder pages, sample-data dashboard components and the Recharts dependency removed.

**Not verified:** hosted end-to-end flows. Creating a group, adding members, starting a cycle, recording a
payment/payout and reading them back as a member still need a provisioned test account. The seed contains
no auth users, so no logged-in demo member exists until an account is linked through `members.profile_id`.

### Sprint 5 (2026-11-03)

- `npm run typecheck` — passed, 0 errors.
- `npm run lint` — passed, 0 errors / 0 warnings.
- `npm run build` — passed; 2,452 modules, no chunk-size warning.
- Prettier — all source, docs and config files formatted.
- `00010_add_cycle_drafts.sql` — applied to the hosted Neon database; both partial unique indexes and all
  three RPCs (`create_cycle_draft`, `set_cycle_chit_order`, `activate_cycle_draft`) exist.
- `npm run generate-types` — regenerated from the hosted schema after `00010`; includes all three RPCs.
- 39 SQL assertions passed inside a rollback-only hosted transaction with mocked identity helpers: draft
  validation, reorder persistence, duplicate/missing/out-of-range rejection, inactive-member rejection,
  atomic activation, snapshot immutability and member read-only behaviour.
- Member "current cycle" views exclude drafts; the admin group screen shows the draft and its editor.

**Not verified:** authenticated invocation of the new RPCs through the hosted Data API, and the mobile
browser walkthrough of the new dialogs. These need a provisioned admin/member test account.

---

## Notes & limitations

- Signup, initial-admin setup, and role management are implemented locally. Migration `00014` is pending
  hosted deployment, and authenticated RLS behavior has **not** been verified with two real accounts.
- The admin and member screens are real and read the database, but they have not yet been exercised
  end-to-end against the hosted project for the same reason.
- The seed has no auth users/profiles, so it cannot demonstrate a logged-in member until an account is
  provisioned and linked through `members.profile_id`. The group detail screen includes an admin-only
  “Link login” action for that link.
- The existing initial administrator's complete application profile UUID and Auth link have not been
  verified against the hosted database in this execution. Do not create another administrator account.
- Route guards are navigation aids. PostgreSQL RLS remains the only authorization boundary.
- `database.types.ts` reflects local RPC signatures but not a generator run against migration `00014`;
  regenerate after the hosted migration is applied with `npm run generate-types`.
- There is no UI yet to discard a cycle draft or close an active cycle, so a group cannot start its next
  cycle from the app. Use the trusted direct-SQL process until a later sprint adds these controls.
- `npm audit` reports 12 moderate advisories in the ESLint 10 toolchain (development dependencies only);
  none affect the shipped bundle. Do not run `npm audit fix --force`.
