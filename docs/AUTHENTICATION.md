# Bachat Book — Authentication & Security

This document describes the Bachat Book authentication and role-management implementation. It covers
public signup, Neon Better Auth sessions, member profile provisioning, initial administrator setup,
role/access management, password reset, configuration and hosted checks still pending.

> **Security rule in one line:** the browser may _display_ a role, but only PostgreSQL Row Level Security
> decides what data a session can read or write. Route guards are navigation aids, not authorization.

---

## 1. Architecture

```text
React (Vite)
   │
   │  useAuth()  ← AuthProvider  ← auth.useSession (nanostore atom)
   │                    │
   │                    └── Data API read: public.profiles
   │
   └── @neon/neon-js — one shared client
            │
            ├── Neon Managed Better Auth
            │      signUp.email / signIn.email / signOut / getSession
            │      requestPasswordReset / resetPassword
            │      session cookie + JWT
            │
            └── Neon Data API (PostgREST)
                   Authorization: Bearer <JWT>
                          │
                          └── PostgreSQL RLS → public schema
```

- There is exactly **one** client: `createClient<Database>({ auth, dataApi })` in
  `src/lib/neon/client.ts`. Auth and the Data API therefore share the same JWT.
- `src/lib/neon/auth.ts` and `src/lib/neon/data-api.ts` are thin entry points over that client.
- `DATABASE_URL` is never part of the browser bundle. Only `VITE_NEON_AUTH_URL` and
  `VITE_NEON_DATA_API_URL` are exposed to Vite.
- The original session/onboarding flow uses
  `db/migrations/00008_add_neon_auth_profile_provisioning.sql`; migration 00014 tightens provisioning
  and adds the signup/role-management database operations.

### Relevant files

| File                                                   | Responsibility                                                 |
| ------------------------------------------------------ | -------------------------------------------------------------- |
| `src/features/auth/components/auth-provider.tsx`       | Session atom subscription, profile loading, auth state machine |
| `src/features/auth/api/auth-api.ts`                    | Neon Auth calls, profile query, provisioning and access RPCs   |
| `src/features/auth/components/require-auth.tsx`        | `HomeRedirect`, `RequireRole`, `RequireSession`                |
| `src/features/auth/components/auth-status-screen.tsx`  | Config, inactive, error and 403 screens                        |
| `src/features/auth/pages/login-page.tsx`               | Sign-in form                                                   |
| `src/features/auth/pages/sign-up-page.tsx`             | Public email/password signup                                   |
| `src/features/auth/pages/initial-admin-setup-page.tsx` | Restricted initial-admin claim                                 |
| `src/features/auth/pages/complete-profile-page.tsx`    | Member onboarding                                              |
| `src/features/users/pages/user-management-page.tsx`    | Admin user search and access controls                          |
| `src/features/auth/pages/forgot-password-page.tsx`     | Password-reset request                                         |
| `src/features/auth/pages/reset-password-page.tsx`      | Token-based password reset                                     |
| `src/app/router.tsx`                                   | Route structure and guard placement                            |
| `src/app/providers.tsx`                                | Mounts `AuthProvider` once                                     |
| `src/components/layout/profile-menu.tsx`               | Real identity display and sign-out                             |

---

## 2. Configuration

| Variable                 | Required | Notes                                            |
| ------------------------ | -------- | ------------------------------------------------ |
| `VITE_NEON_AUTH_URL`     | Yes      | Managed Better Auth URL, ending in `/auth`       |
| `VITE_NEON_DATA_API_URL` | Yes      | Data API URL, ending in `/rest/v1`               |
| `DATABASE_URL`           | Tooling  | Server-side only; migrations and type generation |

Copy `.env.example` to `.env` and fill in the two `VITE_NEON_*` values. Restart the dev server after
changing them.

If either browser-safe URL is missing or invalid, `getNeonConfigIssues()` reports safe problem
descriptions and the app enters the `unconfigured` phase. Auth screens show a configuration alert and
disable submission; protected routes show the configuration status screen. Invalid endpoint values (for
example embedded credentials or query strings) are rejected without printing the value.

**Never** add a `VITE_DATABASE_URL`. Vite inlines every `VITE_*` value into the client bundle.

---

## 3. Auth phases

`AuthProvider` exposes one `phase` value through `useAuth()`:

| Phase             | Meaning                                              | Typical screen                        |
| ----------------- | ---------------------------------------------------- | ------------------------------------- |
| `loading`         | Restoring the session and/or loading the profile     | Full-page loader                      |
| `unauthenticated` | No Neon Auth session                                 | `/login`                              |
| `needs-profile`   | Valid session, but no `public.profiles` row          | `/complete-profile`                   |
| `authenticated`   | Valid session plus an active profile                 | Role dashboard                        |
| `inactive`        | Valid session, but `profiles.is_active = false`      | Inactive-account screen with sign-out |
| `unconfigured`    | Browser-safe Neon URLs are missing or invalid        | Configuration screen / form alert     |
| `error`           | Session or profile request failed for another reason | Error screen with retry and sign-out  |

`useAuth()` also exposes:

```ts
interface AuthContextValue extends AuthState {
  signIn(input: SignInInput): Promise<SignInResult>
  signUp(input: SignUpInput): Promise<SignUpResult>
  signOut(): Promise<string | null>
  completeProfile(input: CompleteProfileInput): Promise<CompleteProfileResult>
  refreshProfile(): Promise<void>
}
```

`AuthState` carries `user` (the application profile), `sessionEmail`, `sessionName`, a safe `error`
message and `configIssues`. It never carries a raw token or the Neon Auth user id.

---

## 4. Session lifecycle

### Startup

1. `AuthProvider` checks `getNeonConfigIssues()`.
2. If configured, it subscribes to `auth.useSession`, a nanostore atom exposed by Managed Better Auth.
3. The first subscription triggers a `get-session` request.
4. When a session user appears, the provider queries `public.profiles` for that identity and resolves the
   phase from the result.

Using the atom instead of polling provides cross-tab sign-in/sign-out, focus refreshes and expiry handling
from the SDK.

### Profile lookup

```ts
getNeonDataApi()
  .from('profiles')
  .select('id, auth_user_id, full_name, email, phone, role, is_active')
  .eq('auth_user_id', authUserId)
  .maybeSingle()
```

- The explicit `auth_user_id` filter keeps the result to one row even for administrators, whose RLS policy
  can read every profile.
- RLS still prevents a member from reading anyone else's row.
- `role` and `is_active` come from this row. Nothing in the client can supply or override them.

### Repeated notifications

The session atom can emit several updates for the same identity (focus refresh, token refresh). The
provider compares the identity with the last loaded identity and skips redundant profile queries.

### Stale responses

A monotonically increasing request id guards profile loads. If the user signs out or signs in as someone
else while a request is in flight, the older response is discarded instead of overwriting current state.

### Sign-out and cache clearing

`signOut()` calls Managed Better Auth, then clears local state and `queryClient.clear()`. Clearing the
TanStack Query cache ensures a different account can never read the previous user's cached rows. Local
state is cleared even if the network call fails; server-side expiry still applies and RLS never trusts the
client.

### Expired or rejected sessions

- Data API errors that indicate a missing/expired JWT (`PGRST301`, `PGRST302`, JWT/token messages) resolve
  to `unauthenticated` with “Your session has expired. Please sign in again.”
- A session atom error with status 401/403 also resets to `unauthenticated`.
- Other failures resolve to `error`, which offers retry and sign-out.

---

## 5. Role authority and route guards

### Role source

`AuthUser.role` is the `user_role` enum value read from `public.profiles`. The `AuthUser.id` is the
application profile id, **not** the Neon Auth user id. The Neon Auth id lives only in
`profiles.auth_user_id`.

### Guard placement

| Guard              | Applies to             | Behaviour                                                                                            |
| ------------------ | ---------------------- | ---------------------------------------------------------------------------------------------------- |
| `HomeRedirect`     | `/`                    | Sends authenticated users to their role dashboard, `needs-profile` to onboarding, others to `/login` |
| `RequireRole`      | `/admin/*`             | Requires `admin`; unauthenticated → `/login` with `state.from`; wrong role → 403 screen              |
| `RequireRole`      | `/member/*`            | Requires `member`; same redirect and 403 behaviour                                                   |
| `RequireSession`   | `/complete-profile`    | Requires a session; `needs-profile` renders onboarding; completed users go to their dashboard        |
| Initial setup page | `/initial-admin-setup` | Session required by the page; database RPC independently restricts the approved Auth identity        |

- Unauthenticated users are redirected with the attempted path in `location.state.from`. After sign-in,
  the login page returns to that path only when it begins with the user's own role prefix, preventing an
  open-redirect or a cross-portal jump.
- A wrong-role request renders “You do not have access to this area” with the user's role and a link to
  their own dashboard. It is not a silent redirect, so provisioning mistakes are visible.
- `RequireRole` comments and this document both state that guards are **not** a security boundary. If a
  policy were missing, the database — not the route — would be the vulnerable layer.

### Root redirect

`/` no longer assumes an admin. It resolves from the auth phase and, when authenticated, from the role in
`public.profiles`.

---

## 6. Sign-in and sign-out

### Sign-in

1. `login-page.tsx` validates email/password with Zod and React Hook Form.
2. It calls `auth.signIn.email({ email, password, rememberMe })`.
3. Managed Better Auth creates the session cookie and JWT.
4. The provider calls `getSession()`, then loads the profile.
5. The login page lets the provider settle the phase and redirects during render:
   - `authenticated` → same-role `from` path or role dashboard;
   - `needs-profile` → `/complete-profile`;
   - error → inline alert with a safe message.

The page deliberately does not navigate from the immediate `signIn.email()` result. A slow profile fetch
would otherwise race the redirect and send a member to an admin path or vice versa.

### Error messages

`describeAuthError()` maps failures to safe text:

| Condition         | Message                                                      |
| ----------------- | ------------------------------------------------------------ |
| HTTP 429          | “Too many attempts. Please wait a moment and try again.”     |
| HTTP 5xx          | “The authentication service is unavailable right now…”       |
| Better Auth error | The server message (for example “Invalid email or password”) |
| Unknown           | “We could not complete that request. Please try again.”      |

Better Auth returns the same response for unknown accounts and wrong passwords, so the message does not
disclose whether an account exists.

### Sign-out

The profile menu calls `auth.signOut()`. It shows no hardcoded preview identity; the name, email and role
come from the loaded profile. After sign-out the provider enters `unauthenticated`, the query cache is
cleared and the user is sent to `/login`.

### Public signup

`/sign-up` accepts full name, email, password and password confirmation. Zod validates the email, a
minimum eight-character password with lower/uppercase letters and a number, and matching passwords.
Both password fields use the shared visibility toggle. Signup calls only
`getNeonAuth().signUp.email({ name, email, password })`; there is no role field in the form or API.

After signup, an available Neon Auth session triggers `ensure_own_profile()` immediately. If Neon
requires email verification and has not issued a session yet, the page asks the user to verify and sign
in. On the first authenticated session the provider provisions the profile from the Auth session's
name/email. The database function derives the Auth id from `auth.user_id()`, always writes `member`,
and rejects an email already linked to another application identity. That conflict protects the
existing initial-admin profile from accidental duplicate linking.

Duplicate-account errors provide a sign-in/password-reset path. The exact verification email and
redirect behavior depend on the Managed Better Auth project's settings and must be confirmed on the
hosted project.

---

## 7. Member onboarding (`ensure_own_profile`)

A user can authenticate successfully and still have no application profile. That is the `needs-profile`
phase.

`/complete-profile` is protected by `RequireSession` and:

1. Prefills the full name from the session name when available.
2. Collects full name (required) and phone (optional).
3. Calls the Data API RPC:

   ```ts
   getNeonDataApi().rpc('ensure_own_profile', {
     profile_full_name,
     profile_phone,
     profile_email,
   })
   ```

4. Re-reads the profile and routes to the member dashboard.

`public.ensure_own_profile(...)` (migration `00014` replaces the original function body):

- derives the Neon Auth identity from `auth.user_id()`;
- hard-codes `role = 'member'`;
- accepts no role parameter;
- requires a name and email and returns the existing profile id on repeat calls;
- rejects a conflicting email link rather than creating a duplicate account profile;
- is executable by `authenticated` only.

---

## 8. Password reset

### Request

`/forgot-password` calls:

```ts
auth.requestPasswordReset({
  email,
  redirectTo: `${window.location.origin}/reset-password`,
})
```

The UI always shows the same confirmation (“If an account exists for that address, a reset link has been
sent”), so it does not disclose account existence.

### Completion

Managed Better Auth appends the reset token to the redirect URL as `?token=…`.

`/reset-password`:

1. Reads `token` from the query string.
2. Without a token, renders an incomplete-link state (missing, already used or expired).
3. With a token, renders the new-password form with the same strength rules as sign-up.
4. Calls `auth.resetPassword({ newPassword, token })`.
5. On success, shows a completion state and a link to `/login`.
6. On failure, displays the server message (for example “Invalid or expired session token”).

Reset links are single-use and expire. Managed Better Auth's installed default is 3600 seconds; the
hosted project can override it. The app does not store the token anywhere beyond the URL.

---

## 9. Initial administrator setup

The website's `/initial-admin-setup` page calls `public.claim_initial_admin()` with no identity or
email parameters. Migration `00014` binds the function server-side to the project owner's supplied
existing Neon Auth user ID and the existing profile email. It:

1. Verifies the authenticated JWT subject is exactly the configured existing Auth user ID.
2. Requires exactly one matching application profile and refuses to steal an Auth identity linked to
   another profile.
3. Preserves the profile UUID and existing name/contact details while linking the Auth id, setting
   `role = 'admin'` and activating the profile.
4. Refuses the claim if any other application admin already exists.
5. Writes an audit row and inserts a private completion marker. The marker permanently disables the
   initial-setup path, even if the first admin is later demoted.

When migration `00014` is applied, it seeds this marker from an already-existing Admin profile. That
prevents the setup route from being re-enabled later if an established Admin is demoted or deactivated.

Signup users cannot supply the configured Auth id to this RPC. A user-supplied email comparison in
React is not used as authorization. The database verifies the signed Neon Auth identity and gates the
operation. The completed profile UUID is returned by the RPC and shown in the success toast.

The hosted database was inspected on 2026-11-08: exactly one application profile row exists, it is the
owner's configured existing profile (profile `518d403a-a5eb-4f7d-afbb-a600f8923afa` ↔ Auth
`25c8d456-…99c`), role `admin`, `is_active = true`. Migration `00014` seeded the `initial_admin_setup`
marker with this pairing
so the claim flow is permanently disabled; the completed profile UUID was returned by the seeded marker
rather than by a website claim. Do not perform the claim or attempt setup through the route again.

---

## 10. Admin user management and role changes

`/admin/user-management` is behind the admin route guard and reads profile names, email, phone, role and
active status. RLS permits the listing only to active admins. The page searches by name/email and asks
for confirmation before access changes. Account deactivation is supported through the existing
`profiles.is_active` column; it does not delete the Neon Auth user or any financial history.

All changes call `public.update_user_access(profile_id, role, is_active)`; the authenticated caller's
identity and admin role are read from the JWT/profile, never from form data. One database transaction:

- rejects non-admin callers, unknown targets and self-role/status changes;
- serializes access changes, prevents demoting/deactivating the last active admin;
- updates role/status and appends the acting profile, target, previous/new values and timestamp to
  `audit_logs`.

Migration `00014` revokes direct `UPDATE` on profile protected columns and grants only own-contact
column updates through the Data API. A trigger also rejects role/status/identity changes outside the
trusted database operation. The audit table no longer accepts client inserts. PostgreSQL RLS remains
the authorization boundary; the route guard and disabled UI buttons are supplementary.

Role changes take effect for subsequent database requests. Existing Browser UI sessions are not
forcibly revoked by this feature; database checks use the current profile role/active state on every
request, and refresh/re-login updates the visible navigation.

---

## 11. Security checklist

- [x] One shared Neon client; no duplicate auth state.
- [x] `DATABASE_URL` absent from browser code and bundle.
- [x] Role read only from `public.profiles` under RLS.
- [x] No role accepted from forms, URLs, local storage or query state.
- [x] Guards documented as navigation aids, not authorization.
- [x] Sign-out clears local state and the query cache.
- [x] Expired JWTs resolve to a clear sign-in prompt.
- [x] Signup/provisioning uses `ensure_own_profile()`, which forces `member`.
- [x] Initial-admin RPC is bound to the exact approved Auth subject and permanently one-time.
- [x] Role/status changes use an audited database RPC; direct protected-column updates are revoked.
- [x] Existing profile RLS and financial-data policies remain in force.
- [ ] Hosted JWT forwarding observed under a real session.
- [ ] Two-account signup/login, profile provisioning and role-management tests passed in the browser
      against hosted Neon (database/RPC level is verified; the UI walkthrough is not).
- [x] Initial-admin profile UUID and role verified from the actual hosted database:
      profile `518d403a-a5eb-4f7d-afbb-a600f8923afa` ↔ Auth id `25c8d456-…99c`, role `admin`,
      `is_active = true`; migration `00014` seeded the `initial_admin_setup` marker with this
      pairing, so the one-time claim flow is permanently disabled as designed.
- [x] Migration `00014` verified against the hosted Neon branch: 18 structural + 90 behavioural
      rollback-only checks passed — signup provisioning forces `member` and is idempotent,
      `update_user_access` requires an active admin and audit-logs every applied change, members
      cannot read/modify other profiles, ordinary updates cannot change protected columns, and
      `claim_initial_admin` rejects both strangers and the completed owner claim.

The unchecked items require a provisioned test account and are tracked in `docs/PROJECT_STATUS.md`.

---

## 12. Verification status

### Verified

- `npm run typecheck`, `npm run lint` and `npm run build` pass.
- Unauthenticated visits to `/`, `/admin`, `/admin/dashboard`, `/member/dashboard` and
  `/complete-profile` redirect to `/login`.
- Hosted `GET /get-session` returns 200 with body `null` when signed out; CORS accepts the dev origin.
- Invalid credentials return 401 `INVALID_EMAIL_OR_PASSWORD`, surfaced as “Could not sign in”.
- `/reset-password` without a token shows the incomplete-link state.
- A bogus token renders the form, and submission returns the hosted “Invalid or expired session token”
  error.
- `/forgot-password` renders and submits through Managed Better Auth.
- Local TypeScript/build validation covers signup, profile provisioning, initial-admin setup and
  user-management page code; this does not verify Hosted Better Auth or PostgreSQL behavior.

### Verified against the hosted database (2026-11-08)

- Migrations `00011`–`00014` applied to the hosted Neon branch via a direct SQL connection; the
  branch is now at `00014`.
- Regenerated `src/types/database.types.ts` from the migrated hosted schema.
- Structural checks against hosted (18 passed): all workflow functions exist and are granted to
  `authenticated` only; no client write privilege on `payments`/`payouts`; `profiles` table-level
  write is `INSERT` with the `UPDATE` grant restricted to `full_name, phone`; no DELETE policies
  exist anywhere; `initial_admin_setup` revokes all client privileges; the setup marker binds the
  owner's profile and Auth identity.
- Behavioural checks against hosted (90 passed, rollback-only): provisioning via
  `ensure_own_profile()` creates a member-role profile and is idempotent; conflicting emails (the
  owner's included) are refused; `update_user_access()` promotes/demotes and
  deactivates/activates atomically and writes exactly one audit row per applied change with the
  correct actor, target and old/new values; members (mocked member JWT) cannot invoke the RPC,
  cannot see or modify other profiles, and cannot change `role`/`is_active`/`auth_user_id` through
  ordinary updates; forged profile inserts/deletes and forged audit reads/inserts/updates/deletes
  are all denied; `claim_initial_admin()` rejects a stranger and rejects the owner because setup is
  already completed (the marker was seeded by the migration); the deployed function sources contain
  the advisory-lock serialization, the self-change block and the last-admin guard. See
  `docs/PROJECT_STATUS.md` for the full check record.
- Hosted data state after verification: exactly one profile (the owner), zero groups, zero members,
  zero audit rows — no test data was committed.

### Not verified (blocked on credentials)

- Successful sign-in/sign-out and the `authenticated` phase in the browser.
- Session persistence across reloads and cross-tab updates.
- Profile loading, role dashboards and inactive-account handling with real accounts.
- `ensure_own_profile()` success and the onboarding transition through the UI.
- Signup, duplicate email handling and email verification with the hosted Better Auth configuration.
- Admin role promotion/demotion behaviour through the User Management page in the browser.
- Password-reset email delivery and a complete password change.
- Direct browser JWT forwarding visibility (the Data API path is exercised only in the database
  verification above, not through the running app).

---

## 13. Troubleshooting

| Symptom                                           | Likely cause / action                                                            |
| ------------------------------------------------- | -------------------------------------------------------------------------------- |
| “Authentication is not configured”                | `VITE_NEON_AUTH_URL` / `VITE_NEON_DATA_API_URL` missing or invalid; restart Vite |
| Signed in but stuck on “Complete your profile”    | No `public.profiles` row; confirm `ensure_own_profile()` succeeded for that user |
| “You do not have access to this area”             | Profile role does not match the portal; check `profiles.role`                    |
| “This account has been deactivated”               | `profiles.is_active = false`; an administrator must reactivate it                |
| “Your session has expired. Please sign in again.” | JWT expired or Data API rejected it; sign in again                               |
| “The request to the database failed.”             | Data API/RLS error; check the browser network response and server logs           |
| Profile loads as the wrong person after switching | Hard reload; report a bug if it recurs (stale-response guard should prevent it)  |
| Reset email never arrives                         | Check spam, confirm the address, and verify hosted email delivery configuration  |

Never paste tokens, cookies, connection strings or full API responses into a bug report.
