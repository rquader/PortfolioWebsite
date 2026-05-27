# 2026-05-25 — Navigation Policy Session and Agent Handoff

> **Note (post-ship):** This documents the session that produced **v0.1.2 / `e5a0826`**. For **ongoing unfixed bugs** after that point (scroll reloads, profile leaks, minimized DMs, uncommitted `WebView` changes), read **[[2026-05-25 — Post-Ship Regression Session (Opus Handoff)]]** first.

**Purpose:** This note is the canonical record of a long Cursor agent session that took InstaDM from "login broken on macOS 26" to "DM-only navigation stable enough to ship **v0.1.2 / app 1.0.2**." Read this before touching `WebView.swift` or `NavigationPolicy.swift` **for shipped behavior**; read the Post-Ship note for **active work**.

**Shipped release:** [v0.1.2](https://github.com/rquader/InstaDM/releases/tag/v0.1.2) (app version **1.0.2**)  
**Branch merged:** `cursor/login-and-blocked-surface-fix` → `main`  
**Git commits:** `459821d` (login handoff + blocked-surface bounce), `e5a0826` (narrow `/accounts` + `isInAppUserSurface`)  
**Repo:** https://github.com/rquader/InstaDM  
**Local source:** `~/Developer/InstagramDMOnlyApp/`

---

## Executive summary (for the next agent)

InstaDM is a macOS SwiftUI app wrapping Instagram DMs in `WKWebView`. **Real defense = navigation delegate policy**, not CSS. The May 25 session fixed three classes of bug:

1. **macOS 26 launch crash** — `safeRequest` KVC (shipped 1.0.1 / v0.1.1).
2. **Login spinner** — auth-scoped nil allow + cookie-gated post-login handoff through blocked `/`.
3. **Full Instagram leaking in-app** — narrowed URL allowlists + multi-stage cancel/bounce in `WebView.Coordinator`.

**User-verified good state:** commit `e5a0826` — stable enough to ship as v0.1.2. Do **not** re-apply the reverted "zero flash" hardening (WKContentRuleList + `didCommit` + `shouldCommitMainFrame` refactor) without reading § Experiments that failed below.

**Known edge cases** (polish for a future session, not blockers):
- Instagram **in-page overlays** (profile pane while URL stays `/direct/t/…`) — URL policy cannot see these.
- Occasional **brief flash** before bounce on some navigations — cosmetic; user prefers this over staying on full IG.
- **Group-chat sender name** taps sometimes route via allowed `/direct/…` subpaths that still paint IG chrome — partially mitigated by `isDirectMessagingPath` narrowing.

---

## Architecture: how navigation defense works today

### Layer 1 — `NavigationPolicy.swift` (what URLs exist)

Three concepts — do not conflate them:

| Function | Meaning |
|---|---|
| `isAllowed(url, source:)` | May this URL be requested at all (including XHR subresources)? |
| `isInAppUserSurface(path, source:)` | May this URL become the **visible main document** after login? |
| `isDirectMessagingPath(path)` | Narrow DM routes only — **not** every `/direct/…` path |

**Always allowed (network):** auth account subpaths, `/challenge`, `/api`, `/graphql`, `/ajax`, `/static`, `accounts.instagram.com` host, plus opt-in FollowRequests / SharedPosts.

**Always blocked:** `/` (feed), `/explore`, profiles `/{username}/`, non-auth `/accounts/*` (notifications, activity, edit, …).

**Narrowed DM paths** (`isDirectMessagingPath`):
- `/direct/inbox…`, `/direct/t/…`, `/direct/new…`
- **Not** bare `/direct` (minimize shell — full IG) nor other `/direct/…` routes Instagram uses for group metadata / profile chrome.

> **Post-ship update:** Uncommitted tree removes bare `/direct` from `isDirectMessagingPath`. This doc's shipped snapshot at `e5a0826` still allowed `/direct` — see [[2026-05-25 — Post-Ship Regression Session (Opus Handoff)]].

**Auth account subpaths** (`authAccountPathPrefixes`):
```
/accounts/login, /onetap, /password, /signup, /emailsignup,
/check_email, /logout, /confirm, /access, /account_recovery, /username
```
If login breaks after Instagram adds a new interstitial, log the blocked URL and add a prefix here — do **not** revert to blanket `/accounts`.

### Layer 2 — `WebView.Coordinator` (when to allow/cancel/bounce)

Decision order in `decidePolicyFor navigationAction`:

1. **Nil `safeRequest`** → allow only if `isAuthSource` or `isOnAuthSurface`; else cancel.
2. **`isAllowed` + not `isInAppUserSurface`** (logged-in) → cancel + `stopLoading()` (blocks `/api` as main frame, etc.).
3. **`isAllowed` + `isInAppUserSurface`** → allow.
4. **Blocked + `linkActivated` + `isInDirectContext`** → Safari + cancel (profile links from DMs).
5. **Blocked + auth redirect to `/`** (`shouldAllowAuthRedirect`) → allow, set `awaitingInboxHandoff`.
6. **Else blocked** → cancel + `stopLoading()` + `handleBlocked`.

Also:
- **`decidePolicyFor navigationResponse`** — cancel blocked **main-frame** responses (stops HTML download early).
- **`didFinish`** — if URL allowed but not `isInAppUserSurface`, bounce home; if blocked + `awaitingInboxHandoff`, cookie-gate inbox route.

### Layer 3 — Auth handoff state machine

Coordinator fields:
- `authSubmitAt` — set on login POST / form submit (narrow: `/accounts/login` POST only in `noteAuthSubmit`).
- `awaitingInboxHandoff` — allowed post-login redirect to `/` to commit cookies.
- `routeToInboxWhenAuthenticated` — polls cookie store for `sessionid` / `ds_user_id`, then loads `homeURL`.

**Critical:** `isOnAuthSurface` / `isAuthSource` use **broad** `/accounts` prefix for detection only — not for `isAllowed`.

### Layer 4 — Cosmetic CSS (weak)

`WebView.cosmeticHideNavCSS` hides href-based links (Home, Explore, Reels, notifications, activity, edit). **Drifts constantly.** Navigation policy is authoritative.

### Layer 5 — macOS 26 nullability

Never use `navigationAction.request` or `sourceFrame.request` directly. Always `safeRequest` (KVC). See [[2026-05-25 — Public GitHub Release and macOS 26 Crash Fix]].

---

## Session timeline (what we tried)

| Phase | Problem | Outcome |
|---|---|---|
| Start | Requests tab infinite reload | Fixed earlier (bounce cooldown) — see [[2026-05-25 — Public GitHub Release and macOS 26 Crash Fix]] |
| macOS 26 | Launch crash on first navigation | Fixed 1.0.1 — `safeRequest` |
| macOS 26 | Login spinner forever | Fixed 1.0.2 — auth handoff chain |
| Navigation | Feed/profile visible seconds on launch | Partially fixed — response cancel + didFinish bounce |
| Navigation | Notifications / search → full IG | Fixed — narrow `/accounts`, `isInAppUserSurface` |
| Navigation | Group chat sender → profile stays | Partially fixed — narrow `/direct`, Safari for link taps |
| Experiment | **DMProfiles** in-app profile toggle | **Reverted** — opened full IG; wrong approach |
| Experiment | **WKContentRuleList + didCommit hardening** | **Reverted** — broke profiles + handoff; no UX win |
| User sign-off | "PERFECT. works well." | Shipped at `e5a0826` |

---

## Experiments that failed (do not blindly retry)

### DMProfiles module (deleted)

Allowed `/{username}/` in-app when toggle on. **Rejected:** Instagram profile pages load full chrome inside webview; toggle defaulted on via `@AppStorage`; made things worse.

**Lesson:** In-app profiles ≠ DM-only. Prefer Safari for intentional profile taps.

### WKContentRuleList document blocking + `shouldCommitMainFrame` + `didCommit` abort

Added network-level block rules for profiles/explore/notifications, refactored allow logic, aborted on `didCommit`.

**Why it failed:**
- Content rules fight delegate policy (async compile delays first load).
- Auth handoff to `/` needs brief document commit for cookies — early abort broke timing.
- Profile leaks via **SPA overlays** aren't fixed by URL blocking anyway.
- User report: "broke again… profiles get me to full Instagram… nothing better."

**Lesson:** Incremental delegate tightening worked; parallel network-layer + refactor did not. If revisiting "zero flash," prototype one lever at a time with login regression tests.

---

## Known remaining issues & future ideas

### A. In-page overlays (highest-value next work)

**Symptom:** URL stays `/direct/t/…` but profile / search / notification UI paints full IG chrome.

**Why policy misses it:** No navigation event; React client-side routing / modal layers.

**Possible approaches** (pick one, test login after each):

1. **MutationObserver / periodic DOM scan** — detect profile header elements, call `history.back()` or reload inbox. Brittle; needs DevTools recon every few months.
2. **`history.pushState` / `replaceState` shim** at `documentStart` — block pushes to blocked pathnames. Won't catch all modals.
3. **Accept + Safari** — intercept click at capture phase for known profile link patterns; `preventDefault` + `NSWorkspace.open`. Less invasive than full overlay teardown.

**Do not:** Re-broaden `/accounts` or `/direct` allowlists to "fix" overlays.

### B. Brief flash before bounce

User accepts brief flash if unavoidable. Further reduction options:

- Cancel at **navigationResponse** (already done for main frame).
- **`didCommit`** abort — only if login handoff tests pass (failed in session).
- WKContentRuleList — only for obvious paths **excluding** `/` and auth paths; compile synchronously before first load.

### C. Group-chat participant headers

`isInDirectContext` falls back to current URL — helps when source frame wrong. Some taps still land on allowed `/direct/…` subpaths with full chrome.

**Ideas:**
- Log `navigationAction` (url, type, source path, current path) to NSLog in debug builds.
- Expand blocked `/direct/` subpath denylist once URLs are captured from DevTools.
- Force Safari for any blocked URL from DM even when not `linkActivated` (may break inline IG widgets — test carefully).

### D. Login allowlist drift

If login loops: Safari DevTools or temporary NSLog in `decidePolicyFor` when `!isAllowed` during auth. Add missing prefix to `authAccountPathPrefixes`.

### E. SharedPosts revival

`SharedPosts.available = false`. IG often renders shares inline or via `target=_blank` → Safari. Before re-enabling, confirm main-frame `/p/` navigations from `/direct/*` still happen and `sourceFrame.safeRequest` reports `/direct`.

### F. Phase 3 native UI

Still the long-term escape hatch for DOM instability. See [[Future Roadmap]]. Navigation policy remains required even with native UI (hidden webview still loads IG).

---

## Debugging recipe for the next agent

1. **Reproduce** with Safari Develop → InstaDM web inspector attached.
2. Note **committed URL** (`webView.url`) vs **what user sees** (overlay vs real navigation).
3. For real navigations, trace `decidePolicyFor` → `isAllowed` → `isInAppUserSurface`.
4. Check Coordinator flags: `awaitingInboxHandoff`, `authSubmitAt`, `lastBounceAt`.
5. **Login regression test** after every policy change: log out → credentials → inbox, on **macOS 26**.
6. **DM regression test:** tap notification bell, search result, group sender name, profile from thread.

Temporary instrumentation (remove before commit):

```swift
#if DEBUG
NSLog("[InstaDM nav] type=\(navigationAction.navigationType.rawValue) url=\(url) source=\(sourcePath) current=\(webView.url?.path ?? "nil") allowed=\(NavigationPolicy.isAllowed(url, source: source)) surface=\(NavigationPolicy.isInAppUserSurface(url.path, source: source))")
#endif
```

---

## File map (navigation-critical)

| File | Role |
|---|---|
| `InstaDM/NavigationPolicy.swift` | Allowlists, `isDirectMessagingPath`, `isInAppUserSurface`, `pathMatches` |
| `InstaDM/WebView.swift` | Coordinator, `safeRequest`, CSS, auth handoff, bounce cooldown |
| `InstaDM/FollowRequests.swift` | Opt-in `/accounts/activity` |
| `InstaDM/SharedPosts.swift` | Opt-in posts (currently `available = false`) |
| `InstaDM/ContentView.swift` | TabView; Messages vs Requests `homeURL` |

---

## Release checklist (what was done for v0.1.2)

- [x] Commits `459821d`, `e5a0826` on `cursor/login-and-blocked-surface-fix`
- [x] Reverted failed hardening (working tree = `e5a0826`)
- [x] `MARKETING_VERSION = 1.0.2` in `project.pbxproj`
- [x] `CHANGELOG.md` updated
- [x] Obsidian notes updated (this file + cross-links)
- [x] Merge to `main`, tag `v0.1.2`, push (triggers `release.yml`)

---

## Related notes

- [[2026-05-25 — Login Spinner Fix]] — login-specific root causes
- [[2026-05-25 — Public GitHub Release and macOS 26 Crash Fix]] — crash + reload loop + GitHub push
- [[Risks and Failure Modes]] — drift table (updated for narrowed allowlists)
- [[Architecture and Tradeoffs]] § Navigation allowlist strategy
- [[Future Roadmap]] § Navigation hardening ideas
- [[Maintenance and References]] — decision log

---

## Agent operating rules (restated)

1. **Privacy / no deps** — unchanged; see [[Privacy and Legal]].
2. **Never blanket `/accounts` or `/direct` again** without explicit user request and login tests.
3. **Never global `.allow` on nil `safeRequest`** — auth context only.
4. **One change at a time** for navigation; login on macOS 26 is the regression canary.
5. **User wants DM-only**, not "Instagram lite." Safari > in-app for profiles.
6. This folder + repo `CHANGELOG.md` are the handoff — no reliance on Cursor chat history.
