# Bachify

**Together We Save. Simply.**

Bachify is a digital Bhishi / rotating savings group management application. It helps small groups of
5–10 people organise monthly contributions, chit order, collections, payouts and financial history in
one clear place.

> **Current status: Sprint 2 — Database Architecture (completed, migrated to Neon).**
> The UI is still UI-only: there is no authentication, CRUD or financial calculation yet, and the
> dashboard shows clearly-labelled sample data. Sprint 2 adds the complete PostgreSQL schema,
> versioned migrations, Row Level Security, development seed data, generated TypeScript types and a
> typed Neon client.
>
> The backend target is **Neon PostgreSQL + Neon Managed Better Auth + Neon Data API**. The schema was
> verified against a real local PostgreSQL 18.4 instance with local stand-ins for the Data API roles.
> **No hosted Neon project exists yet, so no migration has been applied remotely and no hosted RLS or
> auth flow has been verified.** See [`docs/PROJECT_STATUS.md`](docs/PROJECT_STATUS.md) for sprint
> history and [`docs/DATABASE_ARCHITECTURE.md`](docs/DATABASE_ARCHITECTURE.md) for the database
> reference.

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
| Server state | TanStack Query 5 (query keys prepared, no fetchers yet) |
| Forms        | React Hook Form 7 + Zod 4                               |
| Icons        | Lucide React                                            |
| Charts       | Recharts 3                                              |
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

Open <http://localhost:5173>. The root URL redirects to `/admin/dashboard`.

The UI runs without Neon credentials. `src/lib/neon/client.ts` is lazy: it only throws a clear
configuration error when a feature actually calls the client (Sprint 3 and later).

### Environment variables

| Variable                 | Required          | Notes                                                             |
| ------------------------ | ----------------- | ----------------------------------------------------------------- |
| `VITE_APP_NAME`          | No                | Defaults in code                                                  |
| `VITE_APP_ENV`           | No                | e.g. `development`                                                |
| `VITE_NEON_AUTH_URL`     | Yes from Sprint 3 | Managed Better Auth URL, ending in `/auth`                        |
| `VITE_NEON_DATA_API_URL` | Yes from Sprint 3 | Data API URL, ending in `/rest/v1`                                |
| `DATABASE_URL`           | Tooling only      | Direct PostgreSQL URL for migrations/types. **Server-side only.** |

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

There is intentionally no public path to `admin`. A signed-in user can create only a **member** profile
through `ensure_own_profile()`; administrators are provisioned deliberately by an operator with the
direct connection.

1. Create the account through Neon Auth (sign-up screen in Sprint 3, or the Neon Console).
2. Read the managed user id (read-only access to the managed schema):
   `select id, email from neon_auth.user where email = 'admin@example.com';`
3. Insert the application profile with the direct connection:

```sql
insert into public.profiles (auth_user_id, full_name, email, role)
values ('<neon-auth-user-id>', 'Administrator Name', 'admin@example.com', 'admin')
on conflict (auth_user_id) do update
set role = 'admin', is_active = true;
```

The id and `auth_user_id` columns are immutable after creation. See the database architecture document
for details.

### Development seed

`db/seed.sql` contains a fictional group, eight members, one cycle, eight installments, 64 obligations,
six payments and one payout. It is idempotent and creates **no** Neon Auth users and **no** profiles, so
it never creates a fake login. Every auth-dependent column is `NULL`.

---

## Routes

| Route                | State                                    |
| -------------------- | ---------------------------------------- |
| `/`                  | Redirects to `/admin/dashboard`          |
| `/login`             | Auth UI (validates locally, no session)  |
| `/forgot-password`   | Auth UI (no email is sent)               |
| `/reset-password`    | Auth UI (no password is changed)         |
| `/admin`             | Redirects to `/admin/dashboard`          |
| `/admin/dashboard`   | **Real page** — admin dashboard preview  |
| `/admin/groups`      | Clearly-labelled placeholder (Sprint 4)  |
| `/admin/members`     | Clearly-labelled placeholder (Sprint 4)  |
| `/admin/cycles`      | Clearly-labelled placeholder (Sprint 5)  |
| `/admin/collections` | Clearly-labelled placeholder (Sprint 7)  |
| `/admin/payouts`     | Clearly-labelled placeholder (Sprint 8)  |
| `/admin/reports`     | Clearly-labelled placeholder (Sprint 10) |
| `/admin/audit-logs`  | Clearly-labelled placeholder (Sprint 10) |
| `/admin/settings`    | Clearly-labelled placeholder (Sprint 10) |
| `/member`            | Redirects to `/member/dashboard`         |
| `/member/dashboard`  | Clearly-labelled placeholder (Sprint 9)  |
| `/member/groups`     | Clearly-labelled placeholder (Sprint 4)  |
| `/member/payments`   | Clearly-labelled placeholder (Sprint 7)  |
| `/member/schedule`   | Clearly-labelled placeholder (Sprint 6)  |
| `/member/payouts`    | Clearly-labelled placeholder (Sprint 8)  |
| `/member/profile`    | Clearly-labelled placeholder (Sprint 3)  |
| `*`                  | Custom 404 page                          |

`ProtectedRoutePlaceholder` (`src/components/layout/protected-route-placeholder.tsx`) is still an
intentional pass-through. Role-based protection arrives with real authentication in Sprint 3; RLS is
already enforced by the database.

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
│   └── DATABASE_ARCHITECTURE.md   # Tables, RLS, migrations, provisioning
├── public/
│   ├── favicon.svg
│   ├── manifest.webmanifest
│   └── icons/bachify-mark.svg
├── scripts/
│   └── generate-types.mjs         # Neon type generator wrapper
├── src/
│   ├── app/                       # App shell, providers, router, placeholder config
│   ├── components/
│   │   ├── ui/                    # Reusable design-system primitives
│   │   ├── common/                # Logo, page header, placeholder page
│   │   ├── layout/                # Admin & member shells, nav config, profile menu
│   │   └── feedback/              # Loading, error and 404 states
│   ├── features/
│   │   ├── auth/                  # components / pages / schemas / types
│   │   └── dashboard/             # components / data / pages / types
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

### Sample data

All dashboard numbers come from `src/features/dashboard/data/sample-data.ts`, which exports
`isSampleData: true` and carries a development-only header comment. Delete or replace that single file
when real queries land. No component fetches or calculates financial values yet; the query-key registry
in `src/lib/query-keys.ts` is ready for Sprint 4+.

---

## Sprint roadmap

| Sprint | Scope                              | Status      |
| ------ | ---------------------------------- | ----------- |
| 1      | Project foundation & design system | Completed   |
| 2      | Database architecture (Neon)       | Completed   |
| 3      | Authentication & security          | Not started |
| 4      | Group & member management          | Not started |
| 5      | Cycle & chit management            | Not started |
| 6      | Automatic installment generation   | Not started |
| 7      | Payment management                 | Not started |
| 8      | Payout management                  | Not started |
| 9      | Dashboards                         | Not started |
| 10     | Reports & audit logs               | Not started |
| 11     | Testing & deployment               | Not started |

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
`neon deploy` was run.

---

## Notes & limitations

- Authentication is UI only: submitting a form validates input and shows an honest “not connected until
  Sprint 3” message. No credential is stored, transmitted or logged.
- No hosted Neon project is linked yet. Migrations have not been applied remotely, and `neon.ts` has not
  been deployed.
- `database.types.ts` was generated from the locally verified schema; regenerate after the first hosted
  migration with `npm run generate-types`.
- The seed has no auth users/profiles, so it cannot demonstrate a logged-in member until an account is
  provisioned and linked through `members.profile_id`.
- Sign-out in the profile menu is a UI-only action that returns to `/login`.
- `npm audit` reports 12 moderate advisories in the ESLint 10 toolchain (development dependencies only);
  none affect the shipped bundle. Do not run `npm audit fix --force`.
