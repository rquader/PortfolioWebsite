# 2026-05-25 — Login Spinner Fix

Change record for the post-auth "Log in" button spinning forever on macOS 26 after the v0.1.1 crash fix.

**Symptom:** Enter username + password → Log in button shows spinner → never completes. Worked on local Xcode builds before the macOS 26 `safeRequest` work and the 2026-05-16 silent-cancel path.

**Shipped:** app version **1.0.2** / tag **v0.1.2** (2026-05-25)

Superseded details below retained for history — see [[2026-05-25 — Navigation Policy Session and Agent Handoff]] for the final auth handoff design (`awaitingInboxHandoff`, cookie-gated inbox route, auth-scoped nil `safeRequest`).

---

## Root cause (two regressions)

### 1. Nil `safeRequest` → scoped allow (not global)

**Final fix (1.0.2):** allow only when `isAuthSource` or `isOnAuthSurface`; else cancel. A blind `.allow` on nil request leaked profile/feed URLs.

### 2. Post-login redirect through `/` silently swallowed

Instagram often 302s through `/` (feed) after credentials succeed. `/` is blocked by `NavigationPolicy`.

The 2026-05-16 `handleBlocked` logic: if already on an allowed page, silent cancel (no bounce). While still on `/accounts/login/`, that path cancelled the post-auth redirect to `/` without loading the inbox → spinner forever.

**Fix (1.0.2):** Allow post-login redirect to `/` with `awaitingInboxHandoff`; cancel response at action level for other blocked URLs; route to inbox in `didFinish` once `sessionid` cookie exists via `routeToInboxWhenAuthenticated`. See [[2026-05-25 — Navigation Policy Session and Agent Handoff]] § Auth handoff.

---

## Code (`InstaDM/WebView.swift`)

- `decidePolicyFor`: nil `safeRequest?.url` → allow **only** in auth context
- `shouldAllowAuthRedirect` + `awaitingInboxHandoff` + `routeToInboxWhenAuthenticated`
- `safeRequest` KVC: cast via both `URLRequest` and `NSURLRequest`

---

## Verification

1. Clean build in Xcode (Cmd-R) on macOS 26.
2. Log out of Instagram in the app if already sessioned.
3. Enter credentials → spinner should finish → land in `/direct/inbox/`.
4. `defaults read …/InstaDM.app/Contents/Info CFBundleShortVersionString` → **1.0.2** after release cut.

---

## Related

- [[2026-05-25 — Public GitHub Release and macOS 26 Crash Fix]] — the `safeRequest` work that introduced regression (1)
- [[Maintenance and References]] § "Login redirects me to the feed" — older note, now handled in code
