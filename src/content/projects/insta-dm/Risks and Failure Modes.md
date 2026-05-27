# Risks and Failure Modes

A consolidated map of everything that could plausibly break this app, why, and where to look. Three flavors:

1. **Drift** — facts in the code that depend on Instagram or Apple frameworks staying the same. They will rot eventually.
2. **Regressions** — code-internal assumptions that future refactors could trip over.
3. **External / policy** — risks outside the codebase entirely (legal, distribution).

End of this file: a symptom-to-cause quick-reference table.

## How to use this file

When something breaks: skim § Symptom-to-cause lookup first.
When changing code in a risky area: re-read the relevant § "Drift" subsection so you know what implicit contract you're touching.
When something has drifted and you've fixed it: update the relevant subsection so the next reader doesn't trip on a stale claim.

---

## 1. External drift — Instagram changes things

Instagram's web client is the source of truth, and Meta does not promise stability. The following are concrete facts the app currently depends on. Each will eventually become wrong.

### URL surface

| Fact | File:symbol | What breaks when it drifts |
|---|---|---|
| Inbox URL is `https://www.instagram.com/direct/inbox/` | `NavigationPolicy.inboxURL` | App opens to blank / 404 |
| Thread URLs are `/direct/t/<thread_id>/` (1:1 and group) | `NavigationPolicy.isDirectMessagingPath` | Clicking a thread does nothing or bounces |
| New-message compose is `/direct/new/` | same | Compose flow blocked |
| **Not every `/direct/…` path is DM-safe** — group-chat chrome can navigate to other `/direct/…` routes that render full Instagram | `isDirectMessagingPath` (narrow list: inbox, t/, new) | Group sender taps show full IG; may need subpath denylist or overlay handling |
| Login form lives at `/accounts/login/` | `authAccountPathPrefixes` | Can't log in |
| Login POST is `/accounts/login/ajax/` | `authAccountPathPrefixes` (`/accounts/login`) | Login form spins forever |
| 2FA at `/accounts/login/two_factor/` | same (under `/accounts/login`) | 2FA prompt never appears or hangs |
| **Login-verification / bot-check at `/auth_platform/*` (incl. `/auth_platform/recaptcha/`)** | `authSurfacePathPrefixes` (`/auth_platform`) | **Fresh login hangs forever** — the policy cancels the `/auth_platform/recaptcha/` nav (`NSURLError -999`) and the spinner never completes. This was the 2026-05-27 fresh-login bug. If IG moves the verification flow to a new top-level path, fresh login breaks again the same way; add the new prefix to `authSurfacePathPrefixes`. See [[2026-05-27 — Fresh Login Fix (auth_platform) and Watcher Rewrite]]. |
| Saved-login / "Save your login info?" at `/accounts/onetap/` | `authAccountPathPrefixes` | One-tap chooser blocked |
| Password reset at `/accounts/password/reset/` | `authAccountPathPrefixes` | Forgot-password flow blocked |
| Email confirmation interstitial at `/accounts/check_email/` | same | Sign-up / password-reset flow stalls |
| Logout at `/accounts/logout/` | same | Account switching stops working |
| Security challenges at `/challenge/*` | `alwaysAllowedPathPrefixes` | "Suspicious login" prompts hang |
| `/accounts/notifications`, `/accounts/edit`, `/accounts/activity` (when Follow Requests off) | **blocked** by narrowed auth list | Was a major leak vector before 1.0.2 — see [[2026-05-25 — Navigation Policy Session and Agent Handoff]] |
| Internal AJAX under `/api/v1/direct_v2/*`, GraphQL under `/graphql/query/*` | `alwaysAllowedPathPrefixes` | Inbox loads but content is empty |
| Follow requests URL `https://www.instagram.com/accounts/activity/?followRequests=1` | `FollowRequests.url`, `FollowRequests.allowedPathPrefixes` (`/accounts/activity`) | Requests tab loads blank or to the wrong list |
| Shared posts at `/p/<shortcode>/` | `SharedPosts.allowedPathPrefixes` | Posts shared in DMs open in Safari even with toggle on |
| Reels at `/reel/<shortcode>/` and `/reels/<shortcode>/` | same | Reels shared in DMs open in Safari |
| IGTV at `/tv/<shortcode>/` (legacy — may already be gone) | same | Acceptable; IGTV is being phased out |
| **JS guard allowlist mirrors `NavigationPolicy.isDirectMessagingPath` + auth/internal prefixes** | `WebView.spaNavigationGuardJS` (the `pathAllowed(path)` JS function) | If you add a new surface to `NavigationPolicy` (e.g. a new DM subpath) and forget the JS side, anchor clicks resolving to it will be blocked at capture phase even though the Swift policy allows them. Symptom: clicking the new surface does nothing. Diagnose by checking `Console.app` for `[InstaDM/decideAction.in]` — if absent, the JS guard ate the click. |

**Highest-risk drift point:** missing auth subpath during login. The `/accounts/*` tree is **narrowed to explicit auth prefixes** as of 1.0.2 (not blanket `/accounts`). If Instagram introduces a new transient interstitial during login, the user may hit a blocked URL. Diagnose by:

1. Reproduce the broken flow.
2. Open Safari → Develop → InstaDM web inspector (or temporary NSLog in `decidePolicyFor`).
3. Note the blocked URL.
4. Add the new path prefix to `NavigationPolicy.authAccountPathPrefixes` — **do not** revert to blanket `/accounts`.

**Second drift point:** in-page overlays and SPA pushState navigations (profile/search UI while URL stays `/direct/t/…`, or minimize messenger that pushes to `/direct` without a real navigation). URL policy cannot block these. **Defense lives in `WebView.spaNavigationGuardJS`** — a `documentStart` user script that intercepts `<a>` clicks at capture phase and wraps `history.pushState`/`replaceState` to block non-DM URL changes. The script's allowlist mirrors this file's allowlist; **keep the two in sync**. See [[2026-05-25 — Post-Ship Regression Session (Opus Handoff)]] § Issue 7 for the failure mode it addresses.

### DOM and CSS class names

The cosmetic CSS that hides Home / Explore / Reels nav links uses `href`-based selectors (more durable than class-based) but Instagram could still rearrange:

```css
a[href='/']:not([href*='direct']),
a[href^='/explore/'],
a[href^='/reels/'],
a[href*='notifications'],
a[href^='/accounts/activity'],
a[href^='/accounts/edit/'],
a[href^='/accounts/manage'] { display: none !important; }
```

Located in `WebView.cosmeticHideNavCSS`. If the user starts seeing Home / Explore / Reels links in the left rail, the selectors need updating.

**This is cosmetic only.** The navigation allowlist is the real defense; CSS just stops the buttons from being visually tempting.

### `document.title` format

`NotificationManager.parseUnreadCount(from:)` assumes Instagram puts the unread count in the title as `(N) ...`. Specifically:

- `"(3) Inbox • Instagram"` → 3
- `"Inbox • Instagram"` → 0
- `"Instagram"` → 0
- Anything else → nil (state preserved, no false-zero badge collapse)

Drift risk: Instagram changes the title to `"Inbox · Instagram"` (different bullet) or `"Instagram | Direct"` (re-ordered) or starts localizing the entire string. The parser is mostly defensive — it returns nil on unrecognized formats and the badge / banner state stays stable — but the count won't update. Diagnose by `webView.evaluateJavaScript("document.title")` in a debugger and comparing.

### "Suspicious login" challenges and 2FA flow

If your account hits a security challenge that uses a new URL pattern outside `/accounts/*` or `/challenge/*` (Meta has done this for novel attack surfaces), the challenge page will be blocked. Workaround: temporarily add the new path to the allowlist, complete the challenge, then re-narrow. Document at `Maintenance and References.md` § "Account got a 'suspicious login' challenge".

---

## 2. Platform drift — macOS, WebKit, SwiftUI

The Apple-framework side moves slower than Instagram but has its own breakage modes.

### WKWebView / WebKit

| Assumption | File | Risk if it changes |
|---|---|---|
| `WKNavigationAction.request` and `WKFrameInfo.request` imported as non-optional `URLRequest` but can be **nil at runtime** on macOS 26 synthetic frames | `WebView.swift` — must use `safeRequest` (KVC), not direct `.request` | Direct property access traps in `URLRequest._unconditionallyBridgeFromObjectiveC` → `EXC_BREAKPOINT` on launch before UI renders. Fixed 2026-05-25 in v0.1.1. |
| `WKNavigationAction.sourceFrame.request.url` is the click's origin frame URL when non-nil | `WebView.Coordinator.webView(...decidePolicyFor...)` via `sourceFrame.safeRequest` | Source-gated shared-post check breaks if refactor uses direct `.request` (crash on macOS 26) or ignores nil (wrong allow/deny) |
| `WKWebsiteDataStore.default()` persists across launches in a stable per-app container | `WebView.makeNSView` | Lose login across launches |
| `webView.evaluateJavaScript(...)` completion fires on main thread | `NotificationManager.poll` | UI updates from poll completion could land off-main → assertion failure |
| `WKUserScript` injection at `.atDocumentEnd` runs after the page's CSS is in place | `WebView.cosmeticHideNavCSS` | Hidden elements briefly flash visible before injection — cosmetic |
| `createWebViewWith` is invoked for `window.open` / `target=_blank` | `WebView.Coordinator.createWebViewWith` | Popups bypass the policy — could leak into in-app |

### SwiftUI

| Assumption | File | Risk |
|---|---|---|
| `TabView` keeps both tab views alive (both `WebView`s persist; switching is cheap) | `ContentView.tabbedLayout` | If a future SwiftUI version lazy-instantiates, the Messages WebView could be torn down on tab switch → NotificationManager loses its attachment → polling stops |
| `.onChange(of:_) { _, newValue in ... }` 2-arg form is the macOS 14+ idiomatic API | `ContentView` | Older deployment target → won't compile. Locked to macOS 14 |
| `.scrollContentBackground(.hidden)` makes Form's material transparent | `SettingsView.body` | Settings Form reverts to system material; theme background doesn't show |
| `@AppStorage` writes synchronously and posts `UserDefaults.didChangeNotification` synchronously | `NotificationManager.settingsChanged` | If Apple makes it async, `applySettings` could race with the actual write |
| `@NSApplicationDelegateAdaptor` correctly forwards `applicationShouldTerminateAfterLastWindowClosed` to your delegate | `InstaDMApp` | App might survive last window close → notification timer kept alive after intended quit |

### UNUserNotificationCenter

| Assumption | File | Risk |
|---|---|---|
| Requesting `[.alert, .badge, .sound]` covers everything we need | `NotificationManager.requestPermissionIfNeeded` | Apple introduces new permission gates we don't request → notification firing silently fails |
| `removeAllPendingNotificationRequests()` + `removeAllDeliveredNotifications()` clear our notifications without affecting other apps | `NotificationManager.applySettings` (level == .off branch) | Documented contract; unlikely to change |

### Sandbox container

The sandboxed app container is at `~/Library/Containers/<bundle-id>/Data/`. State (cookies, preferences, caches) lives inside. If Apple changes the container layout — e.g. introduces a new sub-path for WebKit data — existing state may not migrate to a new build automatically. Empirically stable since macOS 10.11; very unlikely to change.

**Practical risk: toggling sandbox on/off in the entitlements.** Sandbox=NO uses non-container paths (`~/Library/...`); sandbox=YES uses the container. **Switching mid-life loses state.** Decide once.

### macOS minimum version (14.0)

If your Mac runs <14, the app won't launch. If you ever want to support older Macs, replace `.scrollContentBackground(.hidden)` (14+), `.onChange(of:_:_:)` 2-arg form (iOS 17 / macOS 14+), and verify `Settings` scene + `windowResizability` availability on the older target.

---

## 3. State persistence risks

### Bundle ID is the storage key

All state — cookies, preferences, caches — lives in paths keyed on `PRODUCT_BUNDLE_IDENTIFIER`. **Changing the bundle ID wipes everything**: a new container is created and the old one orphaned (still on disk but invisible to the new build).

| What happens | Result |
|---|---|
| Replace `.app` in `/Applications` with rebuild, same bundle ID | State preserved |
| Rebuild with a new icon, same bundle ID | State preserved |
| Bump `MARKETING_VERSION` / `CURRENT_PROJECT_VERSION` | State preserved |
| Change `PRODUCT_BUNDLE_IDENTIFIER` | **State lost** — log out, settings reset |
| Toggle sandbox on/off in entitlements | **State lost** — container path changes |
| Delete `~/Library/Containers/<bundle-id>` manually | **State lost** — fresh-launch experience |

### `@AppStorage` default-value drift

If a feature module's `defaultEnabled` is changed in a future build:

- **New users / fresh installs**: see the new default.
- **Existing users with a stored value**: keep their stored value.

This is correct behavior but can be surprising. If you want to force a change for all users, you'd need a migration step (read current value, transform, write back) — currently not implemented because no defaults have changed.

### xcuserdata leaks the macOS account name

`InstaDM.xcodeproj/project.xcworkspace/xcuserdata/<username>.xcuserdatad/` will be auto-regenerated by Xcode every time you open the project. The folder name contains your macOS short name. **Don't commit it.** `.gitignore` already excludes it; the audit cleanup removed the prior copy. Re-check before any `git add`.

---

## 4. Feature-removal risks

The feature-module pattern (`FollowRequests.swift`, `SharedPosts.swift`) is designed for clean removal, but watch for:

### Setting `available = false` leaves UserDefaults entries behind

The toggle disappears and the URL is blocked, but a stored `true` in `UserDefaults.standard` sticks around. If you ever flip `available` back to `true`, the user's prior opt-in is honored. Usually fine; if you want to wipe stored state on disable, add a `UserDefaults.standard.removeObject(forKey: SettingsKey.allowFollowRequests)` in a migration step.

### Deleting a feature module file requires grep'ing call sites

The file-level docstrings warn about this. Quick sanity check before deletion:

```
grep -r FollowRequests InstaDM/
grep -r SharedPosts InstaDM/
```

Each match is a one-line removal. If you delete the file without removing the call sites, you get compile errors that point straight at them.

### Adding a new feature module

Pattern from `FollowRequests.swift`. Then add:
- A `SettingsKey.<key>` line
- An `AppSettings.<accessor>` delegating to `<Feature>.enabled`
- A `Toggle` in `SettingsView.allowedSurfacesSection`, gated on `<Feature>.available`
- An arm in `NavigationPolicy.isAllowed` consulting `<Feature>.enabled` and `<Feature>.allowedPathPrefixes`
- Optionally a tab in `ContentView.tabbedLayout`
- File registered in `project.pbxproj` (4 places)

---

## 5. Privacy / posture risks — *do not introduce*

These are forbidden by the spec ([[Privacy and Legal]]). Risk is that future changes silently violate them.

| Forbidden | Why | What to grep for in PRs |
|---|---|---|
| Any third-party SPM / CocoaPods dependency | Audit surface, supply chain | `Package.resolved`, `Package.swift`, `pod` files |
| Any network call to a host other than `*.instagram.com` / `*.facebook.com` | Privacy posture | `URLSession`, `dataTask`, `WKWebsiteDataStore` custom store |
| `print()`, `os_log`, `NSLog` of message content, cookies, or session tokens | Leaks via Console / unified logging | `grep -rn "print(\|os_log\|NSLog" InstaDM/` |
| CloudKit / `NSUbiquitousKeyValueStore` / any iCloud-syncing API | Data leaves the device | `iCloud`, `CloudKit`, `NSUbiquitousKeyValueStore` |
| "Phone home for updates" / telemetry / crash reporting | Privacy posture | Any analytics SDK name |
| Local message archive / export | Promotes the app from "transparent display" to "privacy custodian" | New file types under the container; `FileManager.default.write` for user data |

Current state: clean (zero hits as of 2026-05-16). Re-run the greps before any commit you'd publish.

### Bundle ID change as a side channel

If you ever ship the app to anyone else, your bundle ID becomes a fingerprint of your install (the container path is `~/Library/Containers/<bundle-id>/`). Use a generic placeholder (`com.example.instadm`) for any binary you share, even with friends.

---

## 6. Legal / external risks

These are outside the codebase but can affect what you can do with it.

| Risk | Likelihood | Mitigation |
|---|---|---|
| Meta enforcement (cease-and-desist) for browser-wrapper apps | Low historically; never targeted for personal-use tools | Keep it for personal use. Don't sell. Don't distribute pre-built binaries. |
| Account ban from Instagram side for unusual login pattern | Very low — WKWebView reports as Safari | Don't override the user agent to anything unusual |
| Trademark issue with "InstaDM" name | Borderline — "Insta" prefix could imply affiliation | Rename to a neutral name before any public push. See [[Privacy and Legal]] § Pushing the source. |
| App Store rejection for "thin web wrapper" (4.2 guideline) | Moderate | Don't try App Store unless rebranded and adding clear native value. See [[Privacy and Legal]] § Mac App Store. |
| Personal-info leak from `xcuserdata` if accidentally pushed | Direct | `.gitignore` covers it; `git status --ignored` to verify |
| Free Apple ID provisioning expires after 7 days for some signed builds | Direct (for paid Developer account, 1 year) | Re-sign weekly with free account, or pay $99/yr |

---

## 7. Code-internal risks — assumptions that could trip refactors

Things that work today but rely on subtle invariants that aren't loud in the code:

| Assumption | Where | What goes wrong if broken |
|---|---|---|
| `NotificationManager` singleton's `webView` weak ref is the **Messages** tab's WKWebView, never the Requests tab's | `NotificationManager.attach` + `WebView(tracksNotifications: ...)` discipline | If a future refactor calls `attach` from the Requests tab, polling becomes useless (Requests page doesn't have unread counts in title) |
| `setMessagesTabVisible(_:)` is called exactly when the tab changes — no missed `.onChange` events | `ContentView.onChange(of: selectedTab)` + `.onAppear` for the single-tab fallback | Banner suppression desync — banners fire when they shouldn't or are silenced when they should |
| The cosmetic CSS in `WebView` only injects into the main frame | `WKUserScript(... forMainFrameOnly: true)` | If Instagram moves nav into a subframe, our CSS misses it (defense is still NavigationPolicy) |
| `NavigationPolicy.pathMatches` anchors on `/` boundaries so `/p` doesn't match `/profile/` | `NavigationPolicy.pathMatches` | If a refactor inlines `hasPrefix` back, the greedy-match bug returns — this was a critical bug fix in 2026-05-16 |
| Source-frame URL is nil for the very first load and `fromDirect` evaluates `false`, which is fine because the start URL is always in the always-allowed base layer | `WebView.Coordinator.webView(...decidePolicyFor...)` | If start URL ever moves outside the base allowlist (e.g. directly loading `FollowRequests.url` for the Requests tab), the initial nav could be blocked by the source-frame guard. Today it works because `FollowRequests.allowedPathPrefixes` is in the opt-in arm of `isAllowed`, not source-gated. |
| `applySettings` only restarts the timer / re-checks permission on `levelChanged || intervalChanged` | `NotificationManager.applySettings` | If a future change adds a new notification-relevant setting (e.g. "only at night"), it won't trigger a re-apply unless added to the guard |
| `lastSeenCount = nil` after detach, so a subsequent attach won't fire a banner for already-seen unreads | `NotificationManager.detach` + `attach` | Refactor that skips the nil-reset would have the new attach fire a `(N) → (N)` notification for unreads that already existed |
| `Coordinator.homeURL` is fixed at init from the parent WebView's `startURL` | `WebView.Coordinator.init` | Changing the WebView's `startURL` after init (no caller does this today) wouldn't update the bounce target |
| `handleBlocked` only bounces to `homeURL` when the **current page is not itself allowed**, AND no other bounce has fired within the last 5 seconds. The first half (2026-05-16) catches *post-load* loops — Instagram's inbox JS triggering a blocked nav after the page rendered. The second half (2026-05-25, bounce cooldown) catches *pre-load* loops — `homeURL` itself 302ing into a blocked URL before any navigation commits, so `webView.url` is still nil and the first guard can't help. The cooldown is reset by `didFinish` so a successful navigation lets bouncing work normally again. | `WebView.Coordinator.handleBlocked`, `lastBounceAt`, `bounceCooldown`, `webView(_:didFinish:)` | If a refactor inlines the bounce back to "always reload home" *or* removes the cooldown timestamp, reload loops return. Both checks are load-bearing: the post-load guard alone misses the case where the initial load 302s out, and the cooldown alone misses the case where a settled allowed page triggers a blocked JS nav. |
| `/accounts/*` allowlist is **narrowed to auth subpaths only** (1.0.2). Blanket `/accounts` was reverted after it leaked notifications/activity/search routes. Login may hit unlisted `/accounts/…` interstitials — add prefix after logging, or rely on auth handoff + cookie route. | `NavigationPolicy.authAccountPathPrefixes`, `WebView` auth handoff | See [[2026-05-25 — Navigation Policy Session and Agent Handoff]] |
| `isInAppUserSurface` separates XHR-allowed paths from main-document paths — `/api` etc. must not become the visible page | `NavigationPolicy.isInAppUserSurface`, `WebView.decidePolicyFor` | Removing this check lets internal endpoints flash as full pages |
| WKContentRuleList + `didCommit` hardening was tried and **reverted** — regressed login/profiles | — | Do not re-merge without reading handoff note § Experiments that failed |
| As of 2026-05-25, `FollowRequests.available = true` (re-enabled after the bounce-cooldown loop guard made the reload-loop symptom unreachable) and `SharedPosts.available = false` (still off; IG renders shared posts inline or via Safari, so the in-app rendering toggle is a no-op). Code for both is preserved either way. | `FollowRequests.available`, `SharedPosts.available` | If FollowRequests' URL becomes stale, the Requests tab renders blank (not a reload loop) — recoverable by switching tabs or relaunching. Flipping `SharedPosts.available` back to `true` without re-verifying current Instagram behavior will probably do nothing visible; before doing so, confirm IG actually generates `/p/<id>/` main-frame navs from `/direct/*` and that `sourceFrame.safeRequest?.url` is in `/direct` for those clicks. |
| `DEAD_CODE_STRIPPING = YES` (accepted from Xcode's "Validate Project Settings" recommendation, 2026-05-16) is safe because no code is referenced via runtime symbol lookup — no `NSSelectorFromString`, no `NSClassFromString`, no `Bundle.principalClass`, no plugin loading | `.pbxproj` build configurations | If future code uses `@objc` selectors accessed by string (Phase 3's `WKScriptMessageHandler` bridge could come close), the linker may strip them. Mark such symbols `@objc(KeptName) dynamic` or annotate `@_cdecl` to keep them. |

---

## 8. Symptom-to-cause lookup

When something breaks at runtime, find the symptom and follow the chain. Most pointers land at a file the previous sections have already explained.

| Symptom | Most likely cause | Where to look |
|---|---|---|
| App quits immediately on launch ("closed unexpectedly") | Old **1.0** build from deleted `v0.1.0` release, or direct `.request` access regressed on macOS 26 | Install [latest release](https://github.com/rquader/InstaDM/releases/latest) (1.0.1+); check `~/Library/Logs/DiagnosticReports/InstaDM-*.ips` for `_unconditionallyBridgeFromObjectiveC`; see [[2026-05-25 — Public GitHub Release and macOS 26 Crash Fix]] |
| App opens but Instagram page is blank | New URL or host not in allowlist; logged out and login redirect path drifted | `NavigationPolicy.allowedHosts`, `alwaysAllowedPathPrefixes` |
| Login completes but immediately bounces to inbox repeatedly | Post-login redirect hits a path that isn't allowed | Console for blocked URL; add to `authAccountPathPrefixes` |
| **Fresh login spinner never completes (no error, no bounce)** | A login-flow URL is being cancelled by the policy. As of 2026-05-27 the culprit was `/auth_platform/*` missing from `authSurfacePathPrefixes` → `/auth_platform/recaptcha/` cancelled (`-999`). If IG adds a *new* login URL, same thing. | Add a DEBUG fetch/error logger or attach Safari Web Inspector (`webView.isInspectable` is on in DEBUG); look for `code=-999` / a cancelled nav, find the URL, add its prefix to `authSurfacePathPrefixes`. Confirm the same fresh login works in a **Safari private window** to prove it's app-side. See [[2026-05-27 — Fresh Login Fix (auth_platform) and Watcher Rewrite]]. |
| Log in button spins forever (macOS 26) | Auth handoff regression | See [[2026-05-25 — Login Spinner Fix]]; verify 1.0.2+ |
| Full Instagram appears from notifications / search | Was blanket `/accounts` — fixed 1.0.2 | If regressed, check `authAccountPathPrefixes` not re-broadened |
| Profile opens in-app with full IG chrome | Overlay (no URL change) or allowed `/direct/…` subpath | See [[2026-05-25 — Navigation Policy Session and Agent Handoff]] § A / C |
| Profile tap while DMs minimized → full IG | **Was OPEN; fix in `WebView.spaNavigationGuardJS` awaiting verification** — Instagram's React handler does `preventDefault()` + `history.pushState()` without firing a navigation event, so `decidePolicyFor` cannot see the click. Defense now sits in JavaScript at documentStart: capture-phase click block + pushState wrap. | [[2026-05-25 — Post-Ship Regression Session (Opus Handoff)]] § Issue 7; `WebView.spaNavigationGuardJS` |
| Anchor clicks to a new DM surface do nothing | JS guard's `pathAllowed()` allowlist out of sync with `NavigationPolicy.isDirectMessagingPath` — clicks blocked at capture phase even though Swift allows them | Diff `WebView.spaNavigationGuardJS` `pathAllowed()` against `NavigationPolicy.isDirectMessagingPath` + `authAccountPathPrefixes` + `alwaysAllowedPathPrefixes` |
| Random reload / scroll snaps to bottom in thread | `stopLoading()` on prefetch; debounced recovery to inbox | Post-ship handoff § Issue 1 |
| White screen on cold launch | Same-thread `.other` cancel during initial load | Post-ship handoff § Issue 2 |
| Safari opens Facebook/Meta tab while scrolling | Safari opened on `.other` blocked nav (fixed in uncommitted tree — verify) | Post-ship handoff § Issue 4 |
| Full IG persists after leak until logout | No heal on return to DMs / overlay stuck with unchanged URL | Post-ship handoff § Issues 6–7 |
| 2FA / "Save your login info?" / password reset doesn't render | Auth subpath moved | Verify current URL in Safari; update `alwaysAllowedPathPrefixes` |
| "Suspicious login" challenge hangs | `/challenge/*` may have moved | [[Maintenance and References]] § Account got a 'suspicious login' challenge |
| Lost session / "please log in" after rebuild | Bundle ID changed, sandbox toggled, or container deleted | `PRODUCT_BUNDLE_IDENTIFIER` in `.pbxproj`; check `~/Library/Containers/<bundle-id>` exists |
| Dock badge doesn't update | `document.title` format drift, or polling stopped after detach race | `NotificationManager.parseUnreadCount`, `webView.evaluateJavaScript("document.title")` to see current title; verify `pollTimer` isn't nil |
| Banners never fire (level is Standard) | Permission denied → auto-demoted to Badge only | Settings UI shows `.badgeOnly`; re-enable in System Settings → Notifications |
| Banners fire even while reading DMs | `messagesTabVisible` desync, or window-key check broken | `NotificationManager.fireNotification`, `ContentView.onChange(of: selectedTab)` |
| Requests tab silences DMs (you don't get notified) | The pre-2026-05-16 suppression bug regressed | Make sure `messagesTabVisible` is part of the suppression predicate |
| Settings UI shows system gray instead of theme | `.scrollContentBackground(.hidden)` no longer takes effect on this macOS | `SettingsView.body` — may need a workaround for newer macOS |
| Window won't quit on Cmd-W close | AppDelegate's `applicationShouldTerminateAfterLastWindowClosed` removed or stopped being honored | `AppDelegate.swift` |
| Home / Explore / Reels links visible in left rail | Instagram changed CSS class names | `WebView.cosmeticHideNavCSS` — update selectors via Safari DevTools |
| Follow Requests tab loads to wrong page or 404 | `FollowRequests.url` is stale | Check current Instagram follow-requests URL; update in `FollowRequests.swift` |
| Follow Requests tab loads but approve/deny buttons do nothing | Instagram changed approve/deny AJAX endpoint that we don't see; cosmetic page-level interaction broken | Open Safari Developer Inspector on the tab; look for blocked XHR |
| Shared posts open in Safari even with toggle on | Source-frame check too strict, post URL pattern changed | `SharedPosts.allowedPathPrefixes`; verify the click's source frame is `/direct/*` |
| Shared posts open even when toggle is off | Compile-time `SharedPosts.available` might be true and runtime check bypassed | Trace `NavigationPolicy.isAllowed` for `SharedPosts.enabled` |
| Settings "Allowed Surfaces" section empty | Both `FollowRequests.available` and `SharedPosts.available` are false | `SettingsView.allowedSurfacesSection` ViewBuilder gate |
| Tab bar shows but tabs are blank or non-clickable | `TabView` lifecycle issue or `WebView` failed to instantiate | Check Xcode console; verify both `WebView` initializers compile |
| "Cannot find FollowRequests in scope" compile error | File not registered in `project.pbxproj` | PBXBuildFile / PBXFileReference / PBXGroup / PBXSourcesBuildPhase all need an entry |
| App refuses to open ("can't be opened because..." Gatekeeper) | Unsigned local build + quarantine flag | `xattr -dr com.apple.quarantine /Applications/InstaDM.app` |
| App won't launch on older Mac | macOS 14 minimum deployment target | `MACOSX_DEPLOYMENT_TARGET` in `.pbxproj`; downgrade requires API substitutions (see § Platform drift) |
| Setting picker enables/disables wrong things | `currentLevel.wantsBanners` or `currentLevel == .off` predicates drifted | `SettingsView.notificationsSection` |
| Toggling Theme triggers a flurry of JS evaluations | Pre-2026-05-16 settings-spam bug regressed | `NotificationManager.applySettings` — verify `levelChanged || intervalChanged` guard intact |
| Login info / message contents appear in Console.app | A new `print(...)` / `os_log` snuck in | `grep -rn "print(\|os_log\|NSLog" InstaDM/` |

---

## Related notes

- [[Architecture and Tradeoffs]] § Navigation allowlist strategy — the policy this file describes
- [[Architecture and Tradeoffs]] § Feature modules for opt-in surfaces — the pattern these risks apply to
- [[Maintenance and References]] § What can break, and how to fix it — the troubleshooting recipe form of this file
- [[Privacy and Legal]] § Verification checklist — the privacy half of the risk list
- [[2026-05-16 — Allowed Surfaces Pass]] — what changed in the recent pass and the bugs the audit caught
- [[2026-05-25 — Public GitHub Release and macOS 26 Crash Fix]] — GitHub push, releases, launch crash, v0.1.0 removal
- [[2026-05-25 — Navigation Policy Session and Agent Handoff]] — v0.1.2 navigation work, failed experiments, future ideas
- [[2026-05-25 — Post-Ship Regression Session (Opus Handoff)]] — **active unfixed bugs**, uncommitted changes, Opus pickup instructions
