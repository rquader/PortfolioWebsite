# 2026-05-27 — Fresh Login Fix (`/auth_platform`) and Watcher Rewrite

**Headline:** Fresh login was broken because Instagram's modern login routes through **`/auth_platform/`** and **`/auth_platform/recaptcha/`**, which the navigation allowlist didn't recognize. The web view committed to `/auth_platform/`, then our policy **cancelled** the follow-up `/auth_platform/recaptcha/` navigation (`NSURLError -999`), so the login verification never completed and the spinner hung forever. One-line fix: treat `/auth_platform` as an auth surface.

This note also records a full rewrite of the post-login handling (the "cookie watcher" model) and the process lesson: **instrument first, don't guess** — three reasoned-but-wrong fixes preceded the one-run diagnosis.

---

## Repo state at session start

| Item | Value |
|---|---|
| Branch | `main` |
| HEAD | `aa6fe97` — "Fix login regression: hand off via message, wait for cookies" |
| App version | 1.0.0 (released as `v1.0.0` on GitHub) |
| Symptom | Fresh login (dev + release) spun forever; cached login worked |

Prior login churn (`e7100eb`, `aa6fe97`) had layered a JS→Swift handoff message + `authSubmitAt`/`awaitingInboxHandoff`/`shouldAllowAuthRedirect`/`routeToInboxWhenAuthenticated` machinery trying to guess Instagram's post-login navigation. All of it was chasing the wrong layer.

---

## Root cause (the real one)

Instagram's fresh-login flow on the web is now:

```
/accounts/login/  → (submit, AJAX)  → /auth_platform/?apc=…  → /auth_platform/recaptcha/?apc=…  → "Save your login info?" (/accounts/onetap/)  → / (feed)
```

`/auth_platform/*` is Instagram's login-verification / bot-check (recaptcha) surface. It was **not** in `NavigationPolicy`'s allowlist. Sequence of the failure:

1. On `/accounts/login/`, `isOnAuthSurface` is true → we allow everything. Good.
2. IG navigates to `/auth_platform/?apc=…`. Source frame is the login page → `isAuthSource` true → allowed. `/auth_platform/` **commits**, so `webView.url` is now `/auth_platform/`.
3. IG navigates to `/auth_platform/recaptcha/?apc=…`. The **response** decision runs; by now `webView.url == /auth_platform/`, which `isOnAuthSurface` did **not** recognize → fell through to normal policy → `isAllowed("/auth_platform/recaptcha/")` is false → `decisionHandler(.cancel)`.
4. Cancelled main-frame provisional load → `didFailProvisionalLoadForFrame … code=-999` → Instagram's login JS waits forever → spinner never completes.

**Proof in the DEBUG trace:**
```
[InstaDM/decideAction.authAllow] url=…/auth_platform/recaptcha/?apc=…
WebPageProxy::didFailProvisionalLoadForFrame: … code=-999, isMainFrame=1
```

### The fix

`NavigationPolicy.authSurfacePathPrefixes` now includes `/auth_platform`:

```swift
static let authSurfacePathPrefixes: [String] =
    authAccountPathPrefixes + ["/challenge", "/auth_platform"]
```

Effect: `isOnAuthSurface("/auth_platform/…")` is true → policy allows it at action **and** response, the SPA guard stands down on it, and the cookie watcher runs through it. Login completes (a reCAPTCHA may need a click — expected, IG bot-check). **User-confirmed working 2026-05-27.**

> This is exactly the "new transient interstitial during login" failure mode predicted in [[Risks and Failure Modes]] § URL surface. The remedy was the documented one: add the new path prefix to the auth allowlist — never re-broaden to blanket `/accounts` or allow-all.

---

## Login rewrite: the cookie-watcher model

The tangled handoff machinery (5 interacting code paths sharing `authSubmitAt` / `awaitingInboxHandoff` / `hasSettledOnUserSurface`) was replaced with one idea:

> **During auth, don't interfere at all. Poll the cookie store; when a `sessionid` exists and we're not on a DM surface, load `/direct/inbox/`.**

Implemented in `WebView.Coordinator`:
- `startAuthWatch(in:)` / `stopAuthWatch()` / `pollAuthCookies(in:generation:attempt:)` — a generation-guarded cookie poll (0.4 s, capped). On `sessionid`, loads the inbox (or settles if already on DMs).
- `decidePolicyFor` / `decidePolicyForResponse` / `didCommit` / `didFinish` all **stand down on auth surfaces** (`isOnAuthSurface`) and arm the watcher.
- The SPA guard (`spaNavigationGuardScript`) **does not install at all** on an auth surface (`isAuthContext()` early-return at documentStart) — Instagram's login gets a pristine JS environment (native `history`, no injected listeners), identical to Safari.

Removed: `authSubmitAt`, `awaitingInboxHandoff`, `noteAuthSubmit`, `shouldAllowAuthRedirect`, `routeToInboxWhenAuthenticated`, the `instaDMAuthHandoff` JS→Swift message + handler, `WKScriptMessageHandler` conformance (re-added DEBUG-only for diagnostics).

**Note:** the watcher/guard-skip changes were *necessary cleanup* but were **not** what fixed login — `/auth_platform` was. They're kept because they're simpler and correct, and they make the auth path easy to reason about.

---

## Other changes this session

- **`isOnAuthSurface` / `isAuthSource` made precise.** Now use `NavigationPolicy.isAuthSurfacePath` (login / recovery / challenge / `/auth_platform` only) — **not** every `/accounts/*`. Previously `/accounts/activity` (the FollowRequests surface) was mis-classified as an auth page, which would have disarmed the DM-only guard on the Requests tab.
- **Per-tab JS guard allowlists.** `WebView` takes `allowedPathPrefixes`; the guard merges `NavigationPolicy.jsCommonAllowedPathPrefixes` + the tab's list. Messages → `jsMessagesTabAllowedPathPrefixes` (DM paths). Requests → `FollowRequests.allowedPathPrefixes`. So you can't click out of the Requests tab into DMs/feed/profiles.
- **User agent set to a full Safari string** via `configuration.applicationNameForUserAgent = "Version/26.0 Safari/605.1.15"`. WKWebView's stock UA omits the `Version/… Safari/…` tokens. This was a *wrong guess* for the login hang (it wasn't the UA), but a complete Safari UA is more correct than the truncated default and aligns with the risk-doc assumption that "WKWebView reports as Safari." **Open question: is it still needed now that `/auth_platform` is fixed?** Worth A/B testing; harmless either way.
- **Left nav rail hidden wholesale.** `cosmeticHideNavCSS` now leads with `nav:has(a[href='/']:not([href*='direct']))` + `[role='navigation']:has(…)` to remove the entire primary rail (icons + the hover-expanded text labels). `:has()` is supported on macOS 14+ WebKit. Per-item selectors remain as a fallback. Applies to both tabs (shared user script).
- **DEBUG-only diagnostics added:** `webView.isInspectable = true` (macOS 13.3+), the `dlog(...)` nav tracer (`[InstaDM/…]`), and a temporary login network/error logger (`[InstaDM/page] …`, posts via the `instaDMDiag` handler, logs URLs + HTTP status only — never bodies). All compiled out of Release. The login logger is **temporary**; remove before the next release if not needed.

---

## Known concern (not yet fixed): heal logic over-fires on prefetches

When the DM surface finally became reachable (post-login-fix), the inbox briefly showed **constant reloading, semi-functional buttons, and profile pics as `?`**. Diagnosis: `handleBlockedWhileOnDMs` → `dismissInstagramChrome` injects an `Escape` keypress + `history.back()`, and `reboundToLastDMSurface` reloads — fired on Instagram's **background profile prefetches** (the `!isProfilePath` exception in the incidental-prefetch skip lets profile prefetches through to the full heal). Repeated against IG's prefetches → thrash.

User reported it **settled to "works great"** after the post-login transition stabilized, so no fix was applied this session. **If it recurs:** make `handleBlockedWhileOnDMs` stand down for non-`.linkActivated` (background) navigations — the SPA guard already blocks real profile clicks at the DOM, so the Swift-side Escape/back/reload dance is now redundant and harmful. Watch the trace for repeating `[InstaDM/blockedOnDMs.in]` / `[InstaDM/restoreDM.in]` / `[InstaDM/rebound…]`.

---

## Process lesson (important)

I guessed **three times** at the login cause — the SPA guard's `history` wrap, then "don't install guard on auth," then the user agent — and all three were wrong. The moment I added a DEBUG network logger, the trace revealed `/auth_platform/recaptcha/ … code=-999` in **one run**.

**Rule for next time:** for a "request hangs / page won't load" symptom where our code *might* be interfering, **instrument the actual request first** (`isInspectable`, or a documentStart fetch/XHR/error logger → Xcode console) before changing any navigation logic. The Safari-private-window test was also decisive: it split "Instagram-side vs app-side" with zero code.

---

## Status / TODO

- ✅ Fresh login works (user-confirmed).
- ✅ Left nav rail hidden (best-effort `:has()`; verify against live DOM if any rail item still appears).
- ⏳ Requests tab polish "when enabled" — in progress this session.
- ⏳ Decide whether to keep the Safari UA override.
- ⏳ Strip the temporary `[InstaDM/page]` login logger before release.
- ⏳ Commit to `main` + bump version + update CHANGELOG/README once the UI polish is confirmed.

---

## Related notes

- [[2026-05-25 — Post-Ship Regression Session (Opus Handoff)]] — the SPA profile-leak guard (`spaNavigationGuardScript`) this session built on
- [[2026-05-25 — Login Spinner Fix]] — the *earlier* (macOS 26) login fix; different cause
- [[Risks and Failure Modes]] — updated with the `/auth_platform` drift entry
- [[Maintenance and References]] — updated troubleshooting for fresh-login hangs
