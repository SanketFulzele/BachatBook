# Bachat Book — Authentication & Security

This document describes how authentication works in the Bachat Book client after **Sprint 3**. It covers
the session lifecycle, the role model, route guards, member onboarding, password reset, configuration and
the checks that still need a real hosted account.

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
            │      signIn.email / signOut / getSession
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
- No migration was needed for Sprint 3. `db/migrations/00008_add_neon_auth_profile_provisioning.sql`
  already provides the onboarding function.

### Relevant files

| File                                                  | Responsibility                                                      |
| ----------------------------------------------------- | ------------------------------------------------------------------- |
| `src/features/auth/components/auth-provider.tsx`      | Session atom subscription, profile loading, auth state machine      |
| `src/features/auth/api/auth-api.ts`                   | Neon Auth calls, profile query, onboarding RPC, error normalization |
| `src/features/auth/components/require-auth.tsx`       | `HomeRedirect`, `RequireRole`, `RequireSession`                     |
| `src/features/auth/components/auth-status-screen.tsx` | Config, inactive, error and 403 screens                             |
| `src/features/auth/pages/login-page.tsx`              | Sign-in form                                                        |
| `src/features/auth/pages/complete-profile-page.tsx`   | Member onboarding                                                   |
| `src/features/auth/pages/forgot-password-page.tsx`    | Password-reset request                                              |
| `src/features/auth/pages/reset-password-page.tsx`     | Token-based password reset                                          |
| `src/app/router.tsx`                                  | Route structure and guard placement                                 |
| `src/app/providers.tsx`                               | Mounts `AuthProvider` once                                          |
| `src/components/layout/profile-menu.tsx`              | Real identity display and sign-out                                  |

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
  signOut(): Promise<void>
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

| Guard            | Applies to          | Behaviour                                                                                            |
| ---------------- | ------------------- | ---------------------------------------------------------------------------------------------------- |
| `HomeRedirect`   | `/`                 | Sends authenticated users to their role dashboard, `needs-profile` to onboarding, others to `/login` |
| `RequireRole`    | `/admin/*`          | Requires `admin`; unauthenticated → `/login` with `state.from`; wrong role → 403 screen              |
| `RequireRole`    | `/member/*`         | Requires `member`; same redirect and 403 behaviour                                                   |
| `RequireSession` | `/complete-profile` | Requires a session; `needs-profile` renders onboarding; completed users go to their dashboard        |

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

`public.ensure_own_profile(...)`:

- derives the Neon Auth identity from `auth.user_id()`;
- hard-codes `role = 'member'`;
- accepts no role parameter;
- is idempotent and returns the existing profile id on repeat calls;
- is executable by `authenticated` only.

There is **no public sign-up screen** in the app. A new account is created by an administrator or in the
Neon Console; onboarding only links an existing authenticated user to a member profile.

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

## 9. Administrator provisioning

There is intentionally no self-service path to `admin`. Use the trusted direct-SQL procedure:

1. Create or identify the Neon Auth user (Neon Console or an administrative flow).
2. Read the managed user id with read-only access:

   ```sql
   select id, email from neon_auth.user where email = 'admin@example.com';
   ```

3. Insert or update the application profile with the direct connection:

   ```sql
   insert into public.profiles (auth_user_id, full_name, email, role)
   values ('<neon-auth-user-id>', 'Administrator Name', 'admin@example.com', 'admin')
   on conflict (auth_user_id) do update
   set role = 'admin', is_active = true;
   ```

Rules:

- Never create a second administrator account just to test.
- `profiles.id` and `profiles.auth_user_id` are immutable after creation.
- `ensure_own_profile()` cannot create an admin.
- A role change is guarded by a database trigger; the client cannot promote itself.

The existing dummy `aashish@bachatbook.app` account is **not confirmed** to have a matching
`public.profiles` row.

---

## 10. Security checklist

- [x] One shared Neon client; no duplicate auth state.
- [x] `DATABASE_URL` absent from browser code and bundle.
- [x] Role read only from `public.profiles` under RLS.
- [x] No role accepted from forms, URLs, local storage or query state.
- [x] Guards documented as navigation aids, not authorization.
- [x] Sign-out clears local state and the query cache.
- [x] Expired JWTs resolve to a clear sign-in prompt.
- [x] Onboarding uses `ensure_own_profile()`, which forces `member`.
- [x] No new migration, RLS change, policy weakening or grant change.
- [x] No administrator account created by the app.
- [ ] Hosted JWT forwarding observed under a real session.
- [ ] Authenticated RLS evaluation observed for admin, member and outsider.
- [ ] Successful sign-in, session persistence and onboarding verified end-to-end.

The unchecked items require a provisioned test account and are tracked in `docs/PROJECT_STATUS.md`.

---

## 11. Verification status

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

### Not verified (blocked on credentials)

- Successful sign-in/sign-out and the `authenticated` phase.
- Session persistence across reloads and cross-tab updates.
- Profile loading, role dashboards and inactive-account handling with real accounts.
- `ensure_own_profile()` success and the onboarding transition.
- Password-reset email delivery and a complete password change.
- Hosted JWT forwarding and authenticated RLS visibility.

Do not describe these as passed until they are exercised with a real hosted session.

---

## 12. Troubleshooting

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
