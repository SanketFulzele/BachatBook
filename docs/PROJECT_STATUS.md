# Bachify — Project Status

> **This file is the handoff document between sprints.** Read it before starting any new sprint.
> Update it at the end of every sprint. Never delete previous sprint history, never mark unfinished work
> as done, and never record secret values.

Last updated: **2026-11-01 (end of Sprint 1)**

---

## A. Project Information

| Item | Value |
| --- | --- |
| Project name | **Bachify** |
| Tagline | Together We Save. Simply. |
| Purpose | Digital Bhishi / rotating savings group management for small groups (5–10 members): contributions, cycles, collections, payouts and financial history. |
| Repository | `D:\Sanket\GitSanket\BachatBook` |
| Current sprint | **Sprint 1 — Project Foundation & Design System** (completed) |
| Overall status | Foundation and UI complete. No backend, database or authentication exists yet. App runs entirely on static data. |
| Sprint 1 scope rule | UI, layout, routing and documentation only. No Supabase, DB, auth, CRUD or financial logic. |

### Technology stack (installed)

| Layer | Package / version |
| --- | --- |
| UI framework | `react@19.3.1`, `react-dom@19.3.1` |
| Language | `typescript@5.9.3` (strict) |
| Build | `vite@8.3.5`, `@vitejs/plugin-react@6.1.2` |
| Styling | `tailwindcss@3.4.19`, `postcss@8.5.32`, `autoprefixer@10.6.2` |
| Routing | `react-router-dom@7.18.5` |
| Server state | `@tanstack/react-query@5.105.1` (provider only) |
| Forms / validation | `react-hook-form@7.91.0`, `@hookform/resolvers@7.0.1`, `zod@4.6.7` |
| Icons | `lucide-react@1.66.0` |
| Charts | `recharts@3.10.1` |
| Class helpers | `clsx@2.1.1`, `tailwind-merge@2.6.1` |
| Lint / format | `eslint@10.14.0`, `typescript-eslint@8.72.1`, `prettier@3.9.10` |
| Backend | Supabase — **not installed** (Sprint 2) |

---

## B. Sprint Progress

| # | Sprint | Status | Notes |
| --- | --- | --- | --- |
| 1 | Project Foundation & Design System | **Completed** | UI, layouts, routing, auth screens, dashboard preview, docs. |
| 2 | Supabase & Database Architecture | Not Started | Client, schema, migrations, RLS. |
| 3 | Authentication & Security | Not Started | Real sessions, protected routes, password reset. |
| 4 | Group & Member Management | Not Started | CRUD for groups + members. |
| 5 | Cycle & Chit Management | Not Started | Cycle rules and chit order. |
| 6 | Automatic Installment Generation | Not Started | Per-cycle installment rows. |
| 7 | Payment Management | Not Started | Contribution recording and status. |
| 8 | Payout Management | Not Started | Payout recording tied to collections. |
| 9 | Dashboards | Not Started | Replace sample data with live queries. |
| 10 | Reports & Audit Logs | Not Started | Exports, audit trail, settings. |
| 11 | Testing & Deployment | Not Started | Automated tests, CI, production deploy. |

Legend: Not Started · In Progress · Completed · Blocked.

---

## C. Completed Work (Sprint 1)

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

---

## D. Pending Work

Everything below is intentionally **not** implemented:

- Supabase project, client, environment wiring, schema, migrations, seed data, RLS policies.
- Real authentication: session provider, sign-in/out, password reset, email delivery, protected routes,
  role-based redirects.
- Group, member, cycle, installment, payment and payout CRUD or data fetching.
- Chit order rules, installment generation, financial calculations, running balances.
- Live dashboards (replacing `sample-data.ts`), member dashboard.
- Reports, exports, audit logging, settings persistence.
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

---

## F. Dependencies and Environment

### Runtime dependencies

`@hookform/resolvers`, `@tanstack/react-query`, `clsx`, `lucide-react`, `react`, `react-dom`,
`react-hook-form`, `react-router-dom`, `recharts`, `tailwind-merge`, `zod`.

### Development dependencies

`@eslint/js`, `@types/node`, `@types/react`, `@types/react-dom`, `@vitejs/plugin-react`, `autoprefixer`,
`eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`, `globals`, `postcss`, `prettier`,
`tailwindcss`, `typescript`, `typescript-eslint`, `vite`.

### Environment variables (`.env.example`)

| Variable | Purpose | Required now |
| --- | --- | --- |
| `VITE_APP_NAME` | Display name | No (defaults in code) |
| `VITE_APP_ENV` | Environment label | No |
| `VITE_SUPABASE_URL` | Supabase project URL | No — Sprint 2 |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key | No — Sprint 2 |

> No secret values are recorded here. `.env` and `.env.*` are git-ignored; only `.env.example` is
> committed.

### Setup

```bash
npm install
cp .env.example .env        # PowerShell: Copy-Item .env.example .env
npm run dev                 # http://localhost:5173
npm run build && npm run preview
```

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

---

## H. Next Sprint — Sprint 2: Supabase & Database Architecture

**Objective:** introduce the Supabase project and the database foundation that every later feature
depends on. No product UI changes beyond wiring the client and reading configuration.

Suggested scope:

1. Create the Supabase project and install `@supabase/supabase-js`.
2. Add `src/lib/supabase.ts` (typed client, env validation, clear error if variables are missing).
3. Define the initial schema: `profiles`, `groups`, `group_members`, `cycles`, `installments`,
   `payments`, `payouts`, `audit_logs` — with enums, foreign keys and timestamps.
4. Write SQL migrations (versioned files under `supabase/migrations/` or `docs/database/`).
5. Add Row Level Security policies per table and document the access model.
6. Generate TypeScript database types (`database.types.ts`) and wire them into the client.
7. Extend `src/lib/query-client.ts` / add a query-key structure aligned with the schema.
8. Update `.env.example` documentation, `README.md` and this status file.

**Out of scope for Sprint 2:** auth UI wiring (Sprint 3), CRUD screens, business/installment logic,
financial calculations.

**Prerequisite checks before starting:** confirm Supabase project access and credentials with the project
owner; never commit keys.

---

## I. Verification Results

All results below were **actually executed** on 2026-11-01 at the end of Sprint 1.

### Static checks

| Check | Command | Result |
| --- | --- | --- |
| TypeScript | `npm run typecheck` | ✅ Passed — 0 errors (strict mode) |
| ESLint | `npm run lint` | ✅ Passed — 0 errors, 0 warnings |
| Production build | `npm run build` | ✅ Passed — 2820 modules, built in ~0.9 s |
| Prettier config | `.prettierrc.json` present | ✅ Applied via `npm run format` when needed |
| Production dependency audit | `npm audit --omit=dev` | ✅ 0 vulnerabilities |
| Full audit | `npm audit` | ⚠️ 12 moderate, development tooling only |

Build output (largest assets): `index-*.js` 402.34 kB (gzip 125.85), `dashboard-page-*.js` 384.36 kB
(gzip 110.62), `label-*.js` 123.92 kB, auth chunks 1.3–4.2 kB, CSS 30.35 kB. **No chunk-size warning.**

### Dev server and routing (browser, Chromium via in-app browser)

| Check | Result |
| --- | --- |
| `npm run dev` starts without errors | ✅ `http://localhost:5173` |
| `/` → `/admin/dashboard` | ✅ Redirect works |
| `/admin` → `/admin/dashboard`, `/member` → `/member/dashboard` | ✅ Redirects work |
| `/login`, `/forgot-password`, `/reset-password` render | ✅ Correct titles and content |
| All admin routes render (dashboard + 8 placeholders) | ✅ Each shows its own heading/placeholder |
| All member routes render (6 placeholders) | ✅ Correct member shell |
| Unknown route renders 404 | ✅ “We couldn’t find that page” |
| Console errors on any tested route | ✅ 0 |

### Forms and components

| Check | Result |
| --- | --- |
| Login: empty submit shows both field errors | ✅ |
| Login: valid input shows “Input looks valid” + toast, no session created | ✅ (toast: “Sign-in for sita@example.com will be connected in Sprint 3”) |
| Forgot password: empty → “Email is required”; invalid → “Enter a valid email address” | ✅ |
| Forgot password: valid email shows validation notice | ✅ |
| Reset password: weak password errors + live rule checklist | ✅ |
| Reset password: mismatched confirmation error | ✅ |
| Reset password: valid pair shows success notice, nothing saved | ✅ |
| Password visibility toggle switches type and `aria-label` | ✅ (`password` → `text`) |
| Dialog opens, locks body scroll, closes on Escape and restores scroll | ✅ |
| Profile dropdown opens, focuses first item, reports `aria-expanded`, navigates | ✅ |
| Toast renders in the live region and dismisses | ✅ |
| Skeleton/Spinner loading fallbacks render during lazy loads | ✅ observed |

### Responsive behaviour

| Viewport | Result |
| --- | --- |
| 390 px (admin) | ✅ Sidebar hidden, menu button visible, 1-column cards, chart 302 px wide, table scrolls horizontally, no page-level horizontal overflow |
| 390 px (member) | ✅ Desktop nav hidden, bottom nav visible with 6 items, no horizontal overflow |
| 820 px (admin) | ✅ Sidebar hidden, cards in 2 columns |
| ≥1024 px (admin/member) | ✅ Full sidebar / horizontal nav, 3-column cards, profile name visible |

### Not verified

- Lighthouse/axe audit, cross-browser testing (Firefox/Safari), automated test suite, real network
  conditions. These are deferred to Sprint 11.
