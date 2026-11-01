# Bachify

**Together We Save. Simply.**

Bachify is a digital Bhishi / rotating savings group management application. It helps small groups of
5–10 people organise monthly contributions, chit order, collections, payouts and financial history in
one clear place.

> **Current status: Sprint 1 — Project Foundation & Design System (UI only).**
> There is no Supabase connection, authentication backend, database, CRUD or financial calculation yet.
> Dashboard figures are clearly-labelled static sample data. See
> [`docs/PROJECT_STATUS.md`](docs/PROJECT_STATUS.md) for the full sprint history.

---

## Tech stack

| Area          | Choice                                       |
| ------------- | -------------------------------------------- |
| Framework     | React 19 + TypeScript 5.9 (strict mode)      |
| Build tool    | Vite 8                                       |
| Styling       | Tailwind CSS 3.4 + CSS-variable design tokens |
| Routing       | React Router 7 (data router, nested layouts) |
| Data layer    | TanStack Query 5 (provider only in Sprint 1) |
| Forms         | React Hook Form 7 + Zod 4                    |
| Icons         | Lucide React                                 |
| Charts        | Recharts 3                                   |
| Quality       | ESLint 10, typescript-eslint, Prettier        |
| Backend       | Supabase (planned — **Sprint 2/3**)          |

---

## Quick start

**Prerequisites:** Node.js 20.19+ (developed on Node 24) and npm 11+.

```bash
npm install
cp .env.example .env      # Windows PowerShell: Copy-Item .env.example .env
npm run dev
```

Open <http://localhost:5173>. The root URL redirects to `/admin/dashboard`.

The app runs without a `.env` file today because no service is connected yet. Environment variables
listed in `.env.example` are reserved for Sprint 2 and must never be committed with real values.

### Available scripts

| Script                  | Purpose                                        |
| ----------------------- | ---------------------------------------------- |
| `npm run dev`           | Start the Vite dev server with HMR             |
| `npm run build`         | Type-check, then create a production build      |
| `npm run preview`       | Serve the built `dist/` folder locally          |
| `npm run typecheck`     | Run TypeScript in build mode without emitting   |
| `npm run lint`          | Run ESLint over the repository                  |
| `npm run format`        | Format the repository with Prettier             |
| `npm run format:check`  | Verify formatting without writing changes       |

---

## Routes

| Route                    | Sprint 1 state                             |
| ------------------------ | ------------------------------------------ |
| `/`                      | Redirects to `/admin/dashboard`            |
| `/login`                 | Auth UI (validates locally, no session)    |
| `/forgot-password`       | Auth UI (no email is sent)                 |
| `/reset-password`        | Auth UI (no password is changed)           |
| `/admin`                 | Redirects to `/admin/dashboard`            |
| `/admin/dashboard`       | **Real page** — admin dashboard preview    |
| `/admin/groups`          | Clearly-labelled placeholder (Sprint 4)    |
| `/admin/members`         | Clearly-labelled placeholder (Sprint 4)    |
| `/admin/cycles`          | Clearly-labelled placeholder (Sprint 5)    |
| `/admin/collections`     | Clearly-labelled placeholder (Sprint 7)    |
| `/admin/payouts`         | Clearly-labelled placeholder (Sprint 8)    |
| `/admin/reports`         | Clearly-labelled placeholder (Sprint 10)   |
| `/admin/audit-logs`      | Clearly-labelled placeholder (Sprint 10)   |
| `/admin/settings`        | Clearly-labelled placeholder (Sprint 10)   |
| `/member`                | Redirects to `/member/dashboard`           |
| `/member/dashboard`      | Clearly-labelled placeholder (Sprint 9)    |
| `/member/groups`         | Clearly-labelled placeholder (Sprint 4)    |
| `/member/payments`       | Clearly-labelled placeholder (Sprint 7)    |
| `/member/schedule`       | Clearly-labelled placeholder (Sprint 6)    |
| `/member/payouts`        | Clearly-labelled placeholder (Sprint 8)    |
| `/member/profile`        | Clearly-labelled placeholder (Sprint 3)    |
| `*`                      | Custom 404 page                            |

`ProtectedRoutePlaceholder` (`src/components/layout/protected-route-placeholder.tsx`) is an
intentional pass-through. Role-based protection arrives with real authentication in Sprint 3.

---

## Project structure

```text
.
├── docs/
│   └── PROJECT_STATUS.md          # Sprint history — read this first
├── public/
│   ├── favicon.svg
│   ├── manifest.webmanifest
│   └── icons/bachify-mark.svg
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
│   ├── lib/                       # constants, query client, utils
│   ├── styles/globals.css         # Design tokens & base styles
│   ├── types/
│   └── main.tsx
├── .env.example
├── eslint.config.js
├── index.html
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

### Sample data

All dashboard numbers come from `src/features/dashboard/data/sample-data.ts`, which exports
`isSampleData: true` and carries a development-only header comment. Delete or replace that single file
when real queries land; no component fetches or calculates financial values in Sprint 1.

---

## Sprint roadmap

| Sprint | Scope                                        | Status      |
| ------ | -------------------------------------------- | ----------- |
| 1      | Project foundation & design system           | Completed   |
| 2      | Supabase & database architecture             | Not started |
| 3      | Authentication & security                    | Not started |
| 4      | Group & member management                    | Not started |
| 5      | Cycle & chit management                      | Not started |
| 6      | Automatic installment generation             | Not started |
| 7      | Payment management                           | Not started |
| 8      | Payout management                            | Not started |
| 9      | Dashboards                                   | Not started |
| 10     | Reports & audit logs                         | Not started |
| 11     | Testing & deployment                         | Not started |

---

## Verified in Sprint 1

Executed on the development machine:

- `npm run typecheck` — passed, 0 errors.
- `npm run lint` — passed, 0 errors / 0 warnings.
- `npm run build` — passed; largest chunks ≈ 402 kB and 384 kB (no size warning).
- `npm audit --omit=dev` — 0 vulnerabilities in production dependencies.
- Browser smoke test — every route renders, forms validate, dialog/dropdown/toast work, no console
  errors, and the admin/member layouts adapt at 390 px, 820 px and desktop widths.

---

## Notes & limitations

- Authentication is UI only: submitting a form validates input and shows an honest “not connected until
  Sprint 3” message. No credential is stored, transmitted or logged.
- Sign-out in the profile menu is a UI-only action that returns to `/login`.
- No Supabase client, migrations, RLS policies or CRUD exist yet.
- `npm audit` reports moderate advisories in the ESLint 10 toolchain (development dependencies only);
  none affect the shipped bundle. Revisit when the upstream toolchain ships a fix.
