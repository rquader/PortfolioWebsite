# 2026-05-16 — Allowed Surfaces Pass

A single-day pass that extended Phase 1 with:
1. Two opt-in non-DM surfaces, each behind a feature module + Settings toggle.
2. A narrowed `/accounts/*` allowlist that fixed an unintended leak of follow-requests / settings / notifications pages.
3. Notification system bug fixes (permission-denial demotion, pending-notification cleanup).
4. A comprehensive bug audit + fixes (path-prefix anchoring, banner suppression in tabbed mode, detach race, settings-write spam).

Everything below was implemented in one session and typechecks clean via `swiftc -typecheck -target arm64-apple-macos14.0 InstaDM/*.swift`.

## Motivation

The user's ask:

> "I would like a cleanly implemented settings button to change what I allow. If I set it to allow follow requests, that should be a separate tab. But it should be easy to change the code to completely remove that in case I decide hey I want it to be straight impossible. Fix anything else needed to fix. Make it good for using GCs, maybe getting sent posts, messages etc. and give me a good settings menu. Make even the code human and modular so I can change the app to make a lot of the unnecessary features disabled literally via the code cleanly including removing the setting if I wanted to."

Plus a follow-up:

> "Do one comprehensive pass through the repo and fix any bugs best as possible."

## Architectural change: the **feature module** pattern

The big idea: each opt-in non-DM surface gets a single Swift file that owns *everything* about it — compile-time switch, runtime check, URL, allowed path prefixes, display name. Other code consults that module; the module's call sites are searchable via `grep -r <ModuleName> InstaDM/`.

Two flags per feature:

| Flag | Type | Purpose |
|---|---|---|
| `available` | `static let Bool` | Compile-time. `false` = feature is gone: no Settings toggle, no tab, URLs blocked. |
| `defaultEnabled` | `static let Bool` | First-launch default for the runtime toggle. |
| `enabled` (computed) | `static var Bool` | `available && (UserDefaults override ?? defaultEnabled)`. |

The Settings UI gates on `available`, so flipping it to `false` removes the toggle without dead UI. `NavigationPolicy` gates on `enabled`, so stored runtime opt-ins can't survive a feature being disabled.

## Files added

### `InstaDM/FollowRequests.swift`
Owns the "Show Requests tab" feature. URL: `/accounts/activity/?followRequests=1`. Path prefix: `/accounts/activity`. Default off (must opt in via Settings).

### `InstaDM/SharedPosts.swift`
Owns the "Open shared posts in app" feature. Path prefixes: `/p`, `/reel`, `/reels`, `/tv`. Default **on**, because the most common DM interaction is "look at the meme my friend sent." Source-gated: `NavigationPolicy` only honors these prefixes when the click came from a `/direct/*` frame, so Instagram's own chrome can't drift the user onto a post surface.

## Files changed

### `InstaDM/Settings.swift`
- New `SettingsKey.allowFollowRequests`, `SettingsKey.allowSharedPosts`.
- New `AppSettings.allowFollowRequests` / `.allowSharedPosts` — these delegate to `FollowRequests.enabled` / `SharedPosts.enabled` so non-view code can read one consistent API while the feature modules own their state.

### `InstaDM/NavigationPolicy.swift`
- **Narrowed `/accounts`** from a blanket prefix to specific auth subpaths only: `/accounts/login`, `/onetap`, `/password`, `/signup`, `/emailsignup`, `/check_email`, `/logout`. Researched against the live Instagram login flow (sources: login page, 2FA page, one-tap, password reset, signup/emailsignup paths).
- Added `Source` struct carrying `fromDirect: Bool`. `isAllowed(_:source:)` now takes a source context; opt-in surfaces consult it.
- Added `pathMatches(_:anyOf:)` helper that anchors prefixes on `/` boundaries. **Fixes a critical bug**: `path.hasPrefix("/p")` would have matched `/profile/`, `/privacy/`, `/press/...` — exactly the surfaces this app exists to hide. Same fix applies to `/direct` (was matching `/directory`), `/api`, `/accounts/login` (was matching `/accounts/login_aux`), and every other prefix.
- Consults `FollowRequests.enabled` and `SharedPosts.enabled` for the two opt-in arms.

### `InstaDM/WebView.swift`
- New init params `startURL: URL = .inboxURL` and `tracksNotifications: Bool = true`. Lets the same struct power both Messages and Requests tabs without duplication.
- `Coordinator` now carries `homeURL` (where blocked JS-driven navigations bounce back to — inbox for the Messages tab, follow-requests URL for the Requests tab) and `tracksNotifications`.
- Navigation delegate now computes `Source` from `navigationAction.sourceFrame.request.url?.path` and passes it to `NavigationPolicy.isAllowed`.
- `dismantleNSView` calls `NotificationManager.detach(forWebView: nsView)` — the new race-safe variant.

### `InstaDM/ContentView.swift`
- When `FollowRequests.enabled`, renders a `TabView` with Messages + Requests tabs. Otherwise renders the original single `WebView`.
- `@AppStorage` observes the runtime toggle so flipping it in Settings adds or removes the tab live.
- Tracks the selected tab via `@State` and reports `NotificationManager.shared.setMessagesTabVisible(...)` on every change. Without this, banner suppression would silence Messages notifications when the user was on the Requests tab (same window, still key — see Bug Audit § Critical 1).

### `InstaDM/SettingsView.swift`
- New "Allowed Surfaces" section between Appearance and Notifications. One `Toggle` per feature module, each gated on its `available` flag so removing a feature also removes the UI.
- Footer text explains the trade-off: "Each toggle opens a non-DM Instagram surface."
- Polling-interval picker label renamed `"Check for new messages"` → `"Check every"` (matches the original UI design spec).
- Window dimensions bumped from 460×340 to 480×460 to fit the new section.

### `InstaDM/NotificationManager.swift`
Five changes:

1. **Permission-denial demotion.** If `UNUserNotificationCenter` reports `.denied` (now or in a prior session) and the stored level wants banners, silently rewrite the level to `.badgeOnly` so the Settings UI reflects what will actually happen rather than pretending banners will fire.

2. **Pending-notification cleanup on level → Off.** Was only clearing the dock badge before; now also calls `removeAllPendingNotificationRequests()` + `removeAllDeliveredNotifications()` so already-shown notifications don't sit in Notification Center after the user explicitly asked for quiet.

3. **`setMessagesTabVisible(_:)` + tab-aware suppression.** Banner suppression now requires `messagesTabVisible == true` in addition to `isKeyWindow`. In single-tab mode the flag stays `true` and behavior is unchanged; in multi-tab mode `ContentView` updates it on tab changes.

4. **`detach(forWebView:)` — race-safe.** Old `detach()` would unconditionally tear down state. With a TabView where SwiftUI may reparent web views, an old WebView's `dismantleNSView` firing *after* a new one's `makeNSView` would clobber the new attachment. Now: if `forWebView` is passed and doesn't match the currently-tracked WebView, do nothing.

5. **Skip the work when nothing relevant changed.** `applySettings` was firing on every `UserDefaults.didChangeNotification` — including unrelated theme tweaks and allowed-surface toggles. Each call hit `UNUserNotificationCenter.getNotificationSettings`, restarted the poll timer, and immediately called `poll()` (a JS evaluation). Now: track `lastKnownInterval` too, and bail unless either `level` or `interval` actually changed.

## Files added to `InstaDM.xcodeproj/project.pbxproj`

Four entries each (PBXBuildFile, PBXFileReference, PBXGroup children, PBXSourcesBuildPhase files) for `FollowRequests.swift` and `SharedPosts.swift`. Without these Xcode wouldn't compile the new files.

## Notes updated

- `Architecture and Tradeoffs.md` — added § "Feature modules for opt-in surfaces" and rewrote § "Navigation allowlist strategy" to describe the two-layer (base + opt-in) design and the narrowed `/accounts/*`.
- `Implementation Guide.md` — pointer to this changelog; new Allowed-Surfaces verification checklist items.
- `Future Roadmap.md` — marked Phase 4 (follow requests) and shared posts as shipped-optional; clarified what's still future (native-mode follow requests).
- `Privacy and Legal.md` — added § "Opt-in surfaces don't change the privacy posture" — clarifies that toggling on more allowlist entries doesn't broaden the app's data exfiltration surface (still zero).
- `UI Design and Theming.md` — updated Settings ASCII mockup to show 4 sections; updated dimensions.
- `Maintenance and References.md` — six new decision-log entries dated 2026-05-16.
- `README.md` (notes folder) — rewrote the "DMs only" bullet to mention opt-in surfaces.

## Repo updates

- `README.md` — added Allowed-Surfaces to the Features list and a new "Removing optional features in code" section pointing users at the two feature-module files.
- Removed `.DS_Store` and `InstaDM.xcodeproj/project.xcworkspace/xcuserdata/` (the latter contained the macOS account name in its directory path).

## Bug audit findings + fixes

A separate sub-agent did a ruthless audit pass. Findings:

### Critical (3)

| # | Bug | Status |
|---|---|---|
| 1 | Banner suppression silences DM notifications when user is on Requests tab (both web views share one `NSWindow`, both report `isKeyWindow`) | **Fixed** via `NotificationManager.setMessagesTabVisible(_:)` + `ContentView` reporting on tab changes |
| 2 | `path.hasPrefix("/p")` matches `/profile/`, `/privacy/`, `/press/...` — every prefix has this class of bug | **Fixed** via `NavigationPolicy.pathMatches(_:anyOf:)` directory-boundary helper |
| 3 | Detach race: SwiftUI rebuilding the Messages WebView could have the old instance's `dismantleNSView` clobber the new instance's `makeNSView` attachment | **Fixed** via `NotificationManager.detach(forWebView:)` |

### High (3)

| # | Bug | Status |
|---|---|---|
| 4 | `requestPermissionIfNeeded` fires `UNUserNotificationCenter` lookups on every `UserDefaults.didChangeNotification` (theme tweak, etc.) | **Fixed**: now only fires inside the `levelChanged` branch in `applySettings` |
| 5 | `restartPolling` tears down + immediately re-invokes `poll()` on every settings change — bursty JS evaluations during rapid Settings UI use | **Fixed**: now requires `levelChanged || intervalChanged` |
| 6 | Comment in `detach` claimed it clears the dock badge "so a quit app doesn't leave a stale '5'" — but the OS handles that on app termination | **Fixed**: comment now describes the actual purpose (runtime-toggle + view-rebuild paths) |

### Medium / Low (acknowledged, not fixed this pass)

| # | Issue | Why deferred |
|---|---|---|
| – | App icon assets are empty PNGs | Asset work, separate from code. `AppIcon.appiconset/` has only `Contents.json`. |
| – | `SharedPosts.allowedPathPrefixes` keeps both `/reel` and `/reels` | After the directory-boundary fix, both are needed for the two real Instagram URL families. |
| – | Polling-interval picker stays enabled after demotion to `.badgeOnly` | Correct: badge-only does poll. UI could surface that demotion happened, but adding a "denied" indicator is its own design problem. |
| – | `dispatchPrecondition` crashes in Release on wrong thread | Intentional: that's the contract; no callers cross threads today. |
| – | `NotificationManager` doesn't remove its `NotificationCenter` observer in deinit | Singleton — never deinits. Theoretical only. |

## Verification

- `swiftc -typecheck -target arm64-apple-macos14.0 InstaDM/*.swift` passes with no output (clean typecheck).
- All audit-flagged critical and high bugs are addressed in code.
- Cleanup confirmed: no `.DS_Store` or `xcuserdata/` directories remain in the working tree.
- LSP (SourceKit) reports "cannot find symbol" errors that are stale-index artifacts; they resolve in Xcode once it re-reads the updated `project.pbxproj`.

End-to-end runtime verification still owed:
- [ ] Open in Xcode and Cmd-R; verify Messages tab loads inbox.
- [ ] Toggle "Show Requests tab" in Settings; verify it appears live with the correct icon and loads `/accounts/activity/?followRequests=1`.
- [ ] On Messages tab, click a `/p/<shortcode>/` link inside a DM; verify it opens inside the web view when `Open shared posts in app` is on, and in Safari when off.
- [ ] On Messages tab, click a username (`/<user>/`); verify it opens in Safari (not in-app).
- [ ] Switch to Requests tab, send yourself a DM from another device; verify the banner *does* fire (the suppression bug fix).
- [ ] Deny notification permission at first prompt; verify Settings level picker reads `Badge only` afterward.
- [ ] Set level to `Off`; verify dock badge clears and any previously-delivered banners are removed from Notification Center.

## How to disable each opt-in feature

In `InstaDM/FollowRequests.swift`:
```swift
static let available = false   // hides toggle, hides tab, blocks URLs
```

In `InstaDM/SharedPosts.swift`:
```swift
static let available = false   // hides toggle, blocks /p/* etc., always Safari
```

To delete a feature permanently: `rm` the file, then `grep -r <FeatureName> InstaDM/` lists the handful of remaining call sites (in `NavigationPolicy`, `ContentView`, `SettingsView`, `SettingsKey`). Each is a one-line removal.
