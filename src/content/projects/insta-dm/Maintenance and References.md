# Maintenance and References

> See [[Risks and Failure Modes]] for the comprehensive risk register: drift sources, regression risks, privacy guardrails, and a longer symptom-to-cause lookup table. This file's "What can break" section below is the quick troubleshooting form — recipe per symptom. Go to the risk register when you want the *why* and the broader map.

## What can break, and how to fix it

### "The app opens but immediately quits (macOS 26+)"

- Check `~/Library/Logs/DiagnosticReports/InstaDM-*.ips` for `URLRequest._unconditionallyBridgeFromObjectiveC` in `decidePolicyForNavigationAction`.
- Ensure installed build is **1.0.1+** from [Releases](https://github.com/rquader/InstaDM/releases/latest). Delete old `InstaDM.app` from `/Applications` before copying the new one.
- See [[2026-05-25 — Public GitHub Release and macOS 26 Crash Fix]] § macOS 26 launch crash.

### "Log in button spins forever after entering credentials (macOS 26+)"

- Fixed in **1.0.2** (`WebView.swift`): nil `safeRequest` no longer cancels login submits; post-auth redirect through `/` from `/accounts/*` bounces to inbox instead of silent cancel.
- Rebuild in Xcode (Cmd-R) or install **1.0.2+** from Releases once tagged.
- See [[2026-05-25 — Login Spinner Fix]].

### "The app opens but Instagram won't load"
- Check the navigation allowlist — Instagram may have added a new host or path used in the load flow. Temporarily set `isAllowed` to return `true` always, run, watch Xcode's console for what URLs are being requested, then add them.
- Open Safari DevTools (after enabling Develop menu) against the `WKWebView` from Safari → Develop → [your machine] → InstaDM — gives full inspector access to the running web view. Essential debugging tool.

### "Login redirects me to the feed and I get bounced back"
- Instagram's post-login redirect sometimes goes to `/` first. Either:
  - Allow `/` as a one-time exception when previous URL was `/accounts/login/*`, OR
  - Always force-load `/direct/inbox/` after any navigation to `/`.

### "Clicking somewhere in a DM thread does nothing"
- Probably a JS-triggered same-page nav that the allowlist treats as a real navigation. Check `navigationAction.navigationType` — `.other` and `.formSubmitted` may need allowing for inline interactions like opening a thread.

### "Thread reloads randomly / scroll jumps to bottom when loading older messages"
- Post-ship regression: `stopLoading()` on cancelled background navigations aborts pagination XHR; debounced `scheduleRecovery` may reload inbox while still in thread. See [[2026-05-25 — Post-Ship Regression Session (Opus Handoff)]] § Issue 1.

### "Profile tap while DMs are minimized → full Instagram UI"
- **Fix shipped to branch `cursor/login-and-blocked-surface-fix`, awaiting user verification.** Root cause: Instagram's React handler does `preventDefault()` + `history.pushState('/<username>/')` without firing a navigation event, so `decidePolicyFor` never runs and URL policy can't vote. Defense: `WebView.spaNavigationGuardJS` — documentStart WKUserScript that intercepts non-DM `<a>` clicks at capture phase and wraps `history.pushState`/`replaceState`. See Post-Ship handoff § Issue 7. If the leak recurs, capture `Console.app` logs filtered by `[InstaDM/` and check whether `decideAction.in` appears for the leaked URL — absence confirms a new SPA-only path that needs the JS guard extended.

### "Minimize messenger button does nothing now"
- Intentional. The JS guard blocks `history.pushState('/direct')` and `pushState('/')`, the two URL targets the minimize action uses. Result: URL stays on the thread, the feed never renders underneath, profile clicks from the minimized state can't leak. If you ever need to re-allow minimize, add `/direct` to `pathAllowed()` in `WebView.spaNavigationGuardJS` — but expect the minimize-feed-profile leak to return.

### "Clicking <new surface> does nothing in-app"
- The JS guard's `pathAllowed()` allowlist in `WebView.spaNavigationGuardJS` is out of sync with `NavigationPolicy.isDirectMessagingPath` + `authAccountPathPrefixes` + `alwaysAllowedPathPrefixes`. Anchor clicks resolving to the new surface are blocked at capture phase even though Swift would allow them. Add the new prefix to **both** the Swift policy and the JS `pathAllowed()` function.

### "Safari opened a blank Facebook/Meta page while scrolling"
- Blocked `.other` navigation was opening external browser for all blocked URLs. Should only open Safari on explicit `linkActivated` after uncommitted fix. See Post-Ship handoff § Issue 4.

### "App opens to white screen"
- Post-ship: cancelling Instagram's initial `.other` inbox load during cold launch. See Post-Ship handoff § Issue 2.

### "Full IG leaked once — won't heal until logout"
- Need `restoreDMSurface` when returning to `/direct/inbox/` or `/direct/t/…` from profile/feed; relaunch should always load fresh inbox. See Post-Ship handoff § Issues 6–7.

### "The CSS hide-the-nav rules stopped working"
- Instagram changed class names. Open Safari DevTools, find the new selectors, update the injected CSS. Or stop bothering — the navigation blocker is the real defense; hidden CSS is cosmetic.

### "Dock badge is wrong"
- Page title format may have changed. Run `document.title` in the JS console to see the current format. Update the regex in `WebView.swift`.

### "Account got a 'suspicious login' challenge"
- Treat the `WKWebView` like a new browser. Allow `/challenge/*` and respond to the challenge inside the app. Then the cookie is trusted and it won't happen again.

## How to verify the app is still doing its job

Quarterly sanity check:
1. Open the app.
2. Try every link / button / image you can see. None should navigate to anything outside `/direct/*`.
3. Click an Instagram link from a friend's DM. Should open in Safari, not in-app.
4. Type `instagram.com` into Safari and log in normally as a control test — confirm the same DMs / threads appear, so the session state is consistent.

## Decision log

When changing something significant, append here.

- **Initial decision**: `WKWebView` wrapper over alternatives. See [[Architecture and Tradeoffs]].
- **Initial decision**: SwiftUI over AppKit, macOS 14 minimum.
- **Initial decision**: open non-allowed links in Safari rather than silently blocking. Rationale: usable; doesn't break the "friend shared a meme" flow.
- **Notifications added to MVP scope.** Four levels (Off / Badge only / Standard / Full preview), polling-based, configurable interval, native `UNUserNotificationCenter`. See [[Notifications]] for design.
- **Privacy posture hardened**: everything local except Instagram traffic itself. Zero third-party deps. See [[Privacy and Legal]].
- **App lifecycle**: quit on last window close (`applicationShouldTerminateAfterLastWindowClosed → true`). No background process. No launch-at-login. Matches user intent that the app run only when actively in use.
- **Repository hygiene**: codebase organized to be public-repo-ready at any moment. Placeholder bundle ID, Xcode-standard `.gitignore`, no personal data in source. See [[Repository Hygiene]].
- **Cross-platform structure** (preparation only): platform-specific code isolated to `WebView`, `AppDelegate`, `NotificationManager`. Core logic platform-agnostic for future iOS port. See [[Future Roadmap]] § Cross-platform.
- **Visual design system**: three natural-green palettes (Sage default, Forest, Mist), each with light + dark variants. System font (SF Pro) only — no custom font dependency. Theme propagated via `\.theme` environment value. See [[UI Design and Theming]].
- **Color scheme override**: user picks System / Light / Dark in Settings; the override applies to both the resolved palette and `.preferredColorScheme()` so system controls follow.
- **Web view stays unthemed in Phase 1**: theming the embedded Instagram UI via CSS injection is a Phase 2 opt-in feature, brittle by nature, deferred. Phase 1 themes only what we own (Settings window, accent color).
- **Read-interface enum renamed `Settings` → `AppSettings`** (2026-05-11). The original name from the starter code shadowed `SwiftUI.Settings`, the scene type used for the Cmd-, preferences pane, and broke `InstaDMApp.swift` with "Settings cannot be constructed because it has no accessible initializers." `SettingsKey` (the UserDefaults-key namespace) and `SettingsView` (the SwiftUI view) keep their original names — only the read-interface enum was renamed.
- **Navigation allowlist narrowed `/accounts/*` → specific auth subpaths** (2026-05-16). The original blanket `/accounts` prefix let through `/accounts/activity` (follow requests), `/accounts/edit`, `/accounts/notifications`, etc. — exactly the surfaces this app exists to hide. Replaced with `/accounts/login`, `/onetap`, `/password`, `/signup`, `/emailsignup`, `/check_email`, `/logout` — verified against the live Instagram login flow.
- **Feature module pattern introduced** (2026-05-16). Each opt-in non-DM surface gets its own file with a compile-time `available` flag and a runtime `enabled` getter. `NavigationPolicy` consults them; no per-feature logic lives in policy code. Initial set: `FollowRequests.swift` (the Phase 4 surface, now shippable on a toggle) and `SharedPosts.swift` (allows `/p/*`, `/reel/*`, `/tv/*` clicked from a DM). See [[Architecture and Tradeoffs]] § Feature modules.
- **Settings UI: "Allowed Surfaces" section added** (2026-05-16). Toggles for each feature module, gated on its compile-time `available` flag so removing a feature also removes its setting. Window resized to 480×460 to fit the new section.
- **NotificationManager: permission-denied demotion** (2026-05-16). When the OS denies notification permission, the stored `notificationLevel` is silently rewritten to `.badgeOnly` so the Settings UI reflects what will actually happen rather than pretending banners will fire.
- **NotificationManager: cancel pending notifications on level → Off** (2026-05-16). The original code cleared the dock badge but left already-delivered banners sitting in Notification Center. Now calls `removeAllPendingNotificationRequests()` + `removeAllDeliveredNotifications()` too.
- **WebView: bounce-cooldown loop guard, FollowRequests re-enabled, repo hygiene for public push** (2026-05-25). See [[2026-05-25 — Public GitHub Release and macOS 26 Crash Fix]] § Reload loop fix.
- **Public GitHub release** (2026-05-25). Repo `rquader/InstaDM`, bundle ID `io.github.rquader.instadm`, no LICENSE file (source-available, default copyright), app icon from Canva free elements, CI + tag-triggered release workflow. End-user install via Releases download; README puts build-from-source under "For developers."
- **macOS 26 launch crash fix** (2026-05-25). `WKNavigationAction.request` / `WKFrameInfo.request` imported as non-optional Swift `URLRequest` but empirically nil on first navigation on macOS 26 → `EXC_BREAKPOINT` in `_unconditionallyBridgeFromObjectiveC`. Fixed via KVC `safeRequest` extensions in `WebView.swift`. Shipped as v0.1.1 / app version 1.0.1. Deleted broken v0.1.0 release from GitHub.
- **Login spinner fix** (2026-05-25). Post-auth Log-in spinner on macOS 26: nil `safeRequest` was cancelled (breaking login AJAX) + post-login `/` redirect silently cancelled while still on `/accounts/login/`. Fixed in `WebView.swift`; ships as v0.1.2 / 1.0.2. See [[2026-05-25 — Login Spinner Fix]].
- **Navigation policy hardening shipped as v0.1.2 / 1.0.2** (2026-05-25). Narrow `/accounts` to auth subpaths; narrow `/direct` via `isDirectMessagingPath`; add `isInAppUserSurface`; multi-stage cancel in `WebView` (action, response, didFinish); auth cookie-gated inbox handoff. User-verified good at commit `e5a0826`. WKContentRuleList hardening attempted same session and reverted. See [[2026-05-25 — Navigation Policy Session and Agent Handoff]].
- **Post-ship regression session (uncommitted, 2026-05-25)** — After `e5a0826`, Composer session attempted scroll-reload fixes, profile blocking, DM healing, external-browser Settings toggle, minimized-DM case. User reports **still broken** (minimized DMs + profile → full IG). ~510 lines uncommitted on `cursor/login-and-blocked-surface-fix`. See [[2026-05-25 — Post-Ship Regression Session (Opus Handoff)]].
- **DOM-level SPA navigation guard added** (Opus session, 2026-05-25). The minimized-DMs + profile-click leak (Issue 7) traced to Instagram's React handler doing `preventDefault()` + `history.pushState()` without firing a navigation event — `decidePolicyFor` cannot see the click in principle, so no URL-only policy can block it. Added `WebView.spaNavigationGuardJS`: documentStart user script that (a) capture-phase blocks non-DM anchor clicks before React's delegated handler runs, (b) wraps `history.pushState`/`replaceState` to drop non-DM SPA URL changes. Side effect: messenger minimize is now a no-op (its pushState target is `/direct` or `/`, both blocked), which matches DM-only intent. Also added `#if DEBUG` `dlog(...)` instrumentation in `WebView.Coordinator` for Console.app-based repro tracing. Awaiting user verification of the full regression matrix; no version bump or commit yet. See [[2026-05-25 — Post-Ship Regression Session (Opus Handoff)]] § Issue 7.
- **Fresh-login fix + cookie-watcher rewrite** (Opus session, 2026-05-27). `v1.0.0` shipped with broken fresh login: Instagram routes login through `/auth_platform/*` (recaptcha/bot-check), which wasn't in the allowlist, so the policy cancelled `/auth_platform/recaptcha/` (`NSURLError -999`) and the spinner hung. **Fix: add `/auth_platform` to `NavigationPolicy.authSurfacePathPrefixes`.** Also rewrote the post-login path as a cookie watcher (`startAuthWatch`/`pollAuthCookies` — poll for `sessionid`, then load the inbox), made `isOnAuthSurface`/`isAuthSource` precise via `isAuthSurfacePath` (so `/accounts/activity` isn't mis-read as auth), added per-tab JS-guard allowlists (`WebView.allowedPathPrefixes`), set a full Safari UA, hid the whole left nav rail via `:has()`, and added DEBUG-only diagnostics (`isInspectable`, login network logger). **User-confirmed login works.** Found by instrumenting the request (not by guessing — three prior guesses were wrong). See [[2026-05-27 — Fresh Login Fix (auth_platform) and Watcher Rewrite]].

## Phase 1 implementation status (2026-05-11)

The Phase 1 MVP described in [[Implementation Guide]] is built and lives in `~/Developer/InstagramDMOnlyApp/` (folder kept as-is; the Xcode product is named `InstaDM`).

### What's in place
- Full Xcode project (`InstaDM.xcodeproj`) — opens directly in Xcode 15+, no manual setup. Bundle id is the placeholder `com.example.instadm`; change it before signing.
- All nine Swift files from [[Starter Code]], plus `InstaDM.entitlements`, `Assets.xcassets` (with empty `AppIcon` + Sage `AccentColor`), `.gitignore`, MIT `LICENSE`, and a `README.md` carrying the disclaimer [[Privacy and Legal]] requires.
- Module typechecks clean via `swiftc -typecheck -target arm64-apple-macos14.0 InstaDM/*.swift`. End-to-end build verification still needs the full Xcode app (only Command Line Tools is installed on this machine).

### Deviations from the starter code in [[Starter Code]]
- `Settings` enum → **`AppSettings`** (see decision-log note above).
- `NotificationManager`:
    - `dispatchPrecondition(.onQueue(.main))` on every entry point that touches state (`attach`, `detach`, `applySettings`, `handleUpdate`).
    - `Timer` scheduled on `RunLoop.main` in `.common` mode so opening Settings / showing a sheet doesn't pause polling.
    - Permission check uses `UNUserNotificationCenter.getNotificationSettings` + `authorizationStatus == .notDetermined` instead of a one-shot bool. If the user denies once, we naturally don't re-prompt; if they later change the decision in System Settings, we pick that up automatically.
    - Tracks `lastKnownLevel` and resets `lastSeenCount = nil` whenever the level changes — most importantly when toggling Off → on, so re-enabling doesn't fire a banner for the unreads that already existed.
    - `parseUnreadCount(from:)` returns `Int?` (not `Int`). `nil` means "title doesn't match a recognized Instagram shape" (logged out, mid-navigation, transient state) and the caller leaves `lastSeenCount` + dock badge alone. This avoids the false-zero → "5 new messages" trap where a transient title would collapse the count to 0 and then fire a spurious banner when the real count came back.
    - Banner suppression checks `webView?.window?.isKeyWindow` instead of `NSApp.keyWindow != nil`. Old behavior also suppressed banners when the user was focused on **Settings**, which they shouldn't be — the intent was "user is reading DMs."
- `WebView` JSON-encodes the injected CSS into the surrounding JavaScript template so a future backtick / `$` in the CSS can't break the script.
- `NavigationPolicy` adds `/graphql` to the path prefix allowlist (Instagram's web client uses GraphQL heavily; without it, some inbox loads were short-circuiting).
- `InstaDMApp` factors the theme/scheme/tint modifiers into a private `ThemedScene` modifier so the WindowGroup and Settings scenes can't drift. Default `windowResizability` (`.automatic`) is left in place — `.contentSize` pins the window to `ContentView`'s 800×600 min and breaks the spec's "user-resizable" requirement.
- `SettingsView` adds `.scrollContentBackground(.hidden)` so the active palette's `background` actually paints the Form's interior on macOS (Form otherwise overlays its own material).

### Deferred for later phases (no code yet)
- Full-preview notifications (Phase 2 stretch — see [[Notifications]] § Option B). The hook is documented in `NotificationManager.fireNotification(...)` as a comment.
- Native DM UI (Phase 3) — not started.

## Phase 1 implementation status (2026-05-25) — public release

See [[2026-05-25 — Public GitHub Release and macOS 26 Crash Fix]] for the full record.

### Shipped
- Public repo: https://github.com/rquader/InstaDM
- Pre-built unsigned `.app` via GitHub Releases (`release.yml` on `v*` tags). **Latest: v0.1.2** (1.0.2).
- App icon in `AppIcon.appiconset` (Canva free elements; README Acknowledgments).
- CI: typecheck + unsigned Debug build on every push (`build.yml`, `actions/checkout@v5`).
- Bundle ID: `io.github.rquader.instadm`
- No LICENSE / CONTRIBUTING — intentional; source-available only

### Runtime verification still owed
- [ ] Walk [[Implementation Guide]] § Verification checklist on a logged-in account
- [ ] Network sniffer check from [[Privacy and Legal]] § Verification checklist
- [x] Real launch on maintainer's Mac (macOS 26) — 1.0.1 crash fix, 1.0.2 login + navigation

## Phase 1 implementation status (2026-05-16)

Updated after the "Allowed Surfaces" pass. See [[2026-05-16 — Allowed Surfaces Pass]] for the full change record, audit findings, and per-bug fix detail.

### What's in place (additions since 2026-05-11)
- Two opt-in non-DM surfaces, each in its own one-file feature module:
    - `InstaDM/FollowRequests.swift` — adds a "Requests" tab loading `/accounts/activity/?followRequests=1` when the user opts in via Settings. Off by default.
    - `InstaDM/SharedPosts.swift` — when on (default), in-DM clicks to `/p/*`, `/reel/*`, `/reels/*`, `/tv/*` open inside the web view; the source frame must be in `/direct/*`. When off, those clicks open in Safari (original Phase 1 behavior).
- "Allowed Surfaces" section in `SettingsView` between Appearance and Notifications, gated per-feature on the module's compile-time `available` flag.
- `ContentView` renders a `TabView` (Messages + Requests) when follow requests are enabled, otherwise the original single `WebView`. Tab changes report to `NotificationManager.setMessagesTabVisible(_:)`.
- `NavigationPolicy` narrowed `/accounts/*` from a blanket prefix to the seven specific auth subpaths the live login flow actually traverses (login / onetap / password / signup / emailsignup / check_email / logout). Plus a `pathMatches(_:anyOf:)` helper that anchors prefixes on `/` boundaries (no more `"/p".hasPrefix` matching `"/profile/"`).
- `NotificationManager` bug-fix pass: permission-denial demotion to `.badgeOnly`, pending/delivered notifications cleared on level → Off, race-safe `detach(forWebView:)`, skip-work guard so unrelated `UserDefaults` writes don't churn the timer or call into `UNUserNotificationCenter`.
- Repo hygiene: removed `.DS_Store` and `InstaDM.xcodeproj/project.xcworkspace/xcuserdata/` (the latter contained the macOS account name).

### Open items (after 2026-05-16) — superseded by 2026-05-25 release pass

Most "before going public" items are **done**. See [[2026-05-25 — Public GitHub Release and macOS 26 Crash Fix]].

**Pre-flight:**
- [x] Open in Xcode and Cmd-R — done; v0.1.1 verified on macOS 26
- [ ] Walk runtime verification checklist in [[2026-05-16 — Allowed Surfaces Pass]] § Verification still owed

**Before going public:**
- [x] App icon PNGs in `AppIcon.appiconset/`
- [ ] Rename "InstaDM" — deferred; borderline trademark but acceptable for GitHub source-only per [[Privacy and Legal]]
- [x] README pass for public install path
- [ ] Network sniffer check

**Features (post 2026-05-25):**
- `FollowRequests.available = true` — re-enabled after the bounce-cooldown loop guard in `WebView.Coordinator.handleBlocked` made the historical infinite-reload symptom unreachable. Tab is hidden until the user opts in via Settings (default off). If the URL is stale in some future moment, the tab renders blank instead of looping — recoverable by switching tabs.
- `SharedPosts.available = false` — still off. Instagram's DM web client renders most shared posts inline in the thread (no navigation event → toggle is a no-op). When IG does navigate, it's via `target="_blank"` and goes to Safari. The toggle promised in-app rendering it can't deliver. Setting hidden; code preserved.

Net effect: Settings is **Appearance + Allowed Surfaces (one toggle, Requests tab) + Notifications + footer**.

**Acknowledged but not fixed (audit medium/low):**
- `dispatchPrecondition(.onQueue(.main))` crashes in Release if violated. Intentional — that's the contract — but no graceful fallback. Acceptable since no caller crosses threads today.
- `NotificationManager` is a singleton and never deinits, so its `UserDefaults.didChangeNotification` observer technically leaks. Theoretical only.
- Settings UI gives no signal when notification level was silently demoted from `.standard` → `.badgeOnly` after permission denial. The picker honestly reflects the new value, but the user doesn't know *why* their selection changed. UX nicety; defer.

## References

### Apple docs (authoritative — start here when stuck)
- [WKWebView](https://developer.apple.com/documentation/webkit/wkwebview)
- [WKNavigationDelegate](https://developer.apple.com/documentation/webkit/wknavigationdelegate)
- [WKUIDelegate](https://developer.apple.com/documentation/webkit/wkuidelegate)
- [WKWebsiteDataStore](https://developer.apple.com/documentation/webkit/wkwebsitedatastore)
- [WKUserContentController](https://developer.apple.com/documentation/webkit/wkusercontentcontroller)
- [WKScriptMessageHandler](https://developer.apple.com/documentation/webkit/wkscriptmessagehandler) — for the Phase 3 native UI's JS↔Swift bridge.
- [NSWorkspace.open](https://developer.apple.com/documentation/appkit/nsworkspace/open(_:)) — for opening blocked links in Safari.
- [Web Push for WKWebView](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/) — applies to macOS too.

### Useful prior art
- **IG:dm** (defunct) — was an Electron Instagram DM client; failed because it relied on private API.
- **Beeper** / **Texts.com** — modern multi-protocol messengers; private-API based; not the model we want.
- **Fluid.app** / **Unite** — site-specific browsers; what we're building is essentially a custom SSB.

### Useful Instagram URL patterns (verify currency — these change)
- `https://www.instagram.com/direct/inbox/` — inbox.
- `https://www.instagram.com/direct/t/{thread_id}/` — specific thread.
- `https://www.instagram.com/accounts/login/?next=/direct/inbox/` — login with post-login redirect.
- `https://www.instagram.com/accounts/activity/?followRequests=1` — follow requests (for Phase 4).
- Internal AJAX/GraphQL: under `/api/v1/direct_v2/*` and `/graphql/query/` — inspect in DevTools, don't trust this list.

## Notes for AI assistants resuming this project

If you're an AI being handed this folder as context:
1. **Read [[README]] first**, then [[Privacy and Legal]], then [[Architecture and Tradeoffs]].
2. **If changing navigation or login:** read [[2026-05-25 — Navigation Policy Session and Agent Handoff]] before editing `WebView.swift` or `NavigationPolicy.swift`.
3. **Privacy is a hard constraint, not a preference.** Nothing leaves the device except Instagram traffic. No telemetry, no third-party SDKs, no cloud sync, ever. See [[Privacy and Legal]].
4. **No external dependencies.** Apple frameworks only. If a feature seems to require a library, propose an Apple-framework alternative or drop the feature.
5. **Don't propose Graph API or private-API approaches** — both were explicitly rejected. See [[Architecture and Tradeoffs]] for why.
6. **iOS port is on the roadmap as future work** — see [[Future Roadmap]] § Cross-platform. Don't write iOS code unless the user explicitly asks for the port now. But don't write macOS code that would make a future port unnecessarily painful (e.g. don't sprinkle `NSApp.dockTile` calls throughout — keep platform-specific calls isolated).
7. **Verify Instagram URLs and DOM selectors before writing code that depends on them** — they drift, and no document in this folder is automatically kept in sync with reality.
8. **The web view is the source of truth.** Native UI work in Phase 3+ reads *through* the web view, doesn't replace it.
9. **The user's preference is concise, direct answers.** Don't propose hypothetical features unless asked.
10. **The app should be safe to push to a public GitHub repo at any moment.** If you suggest anything that would put personal data, machine-specific config, or credentials into source files, flag it explicitly. See [[Repository Hygiene]].
