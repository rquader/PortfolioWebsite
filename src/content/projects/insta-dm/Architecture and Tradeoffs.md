# Architecture and Tradeoffs

## High-level design

```
┌────────────────────────────────────────────────────┐
│  SwiftUI App (single window + Settings scene)      │
│                                                    │
│  ┌────────────────────────────────────────────┐    │
│  │  WKWebView                                 │    │
│  │  - URL pinned to instagram.com/direct/*    │    │
│  │  - Persistent cookies (login survives)     │    │
│  │  - Navigation delegate blocks non-DM URLs  │    │
│  │  - Optional CSS injection to hide nav      │    │
│  └────────────────┬───────────────────────────┘    │
│                   │ observes (title polling)       │
│  ┌────────────────┴───────────────────────────┐    │
│  │  NotificationManager (singleton)           │    │
│  │  - Reads document.title every N seconds    │    │
│  │  - Updates dock badge                      │    │
│  │  - Fires UNUserNotificationCenter banners  │    │
│  │  - Suppresses when window is key window    │    │
│  └────────────────┬───────────────────────────┘    │
│                   │ reads                          │
│  ┌────────────────┴───────────────────────────┐    │
│  │  Settings (ObservableObject, @AppStorage)  │    │
│  │  - notificationLevel, sound, interval      │    │
│  └────────────────────────────────────────────┘    │
│                                                    │
│  AppDelegate: applicationShouldTerminateAfter      │
│               LastWindowClosed → true              │
└────────────────────────────────────────────────────┘

Dependencies: SwiftUI, WebKit, AppKit, UserNotifications,
              Foundation. Nothing else. Zero third-party.
```

Single window + Settings scene, single web view, single notification manager. That's the whole MVP.

## Why `WKWebView` over alternatives

### vs Electron / Chromium-based
- Native, ~10x lower memory footprint.
- Uses system Safari engine — gets WebKit security patches for free.
- No second browser engine bundled in the app.

### vs Site-Specific Browser (Fluid, Safari Web App)
- The user wants a real project they can grow.
- A Swift app gives a foundation for the future native UI (see [[Future Roadmap]]) — an SSB doesn't.
- More control over keyboard shortcuts, menu bar, dock integration, window behavior.

### vs Reverse-engineered private API
- ToS violation; account ban risk especially for newer accounts or new device fingerprints.
- Breaks every few months when Instagram changes things.
- For a one-person personal tool, the maintenance burden isn't worth it.

### vs Official Graph API
- The Messaging API is business-only and gated on a 24h reply window — you can't initiate DMs to friends.
- Requires app review, account-type conversion, and a public webhook endpoint.
- Wrong tool for personal friend-chatting use case.

## Key technical decisions

### SwiftUI vs AppKit
**Decision: SwiftUI**, with `NSViewRepresentable` to host `WKWebView`. SwiftUI is mature enough on macOS 13+ for a single-window app; less boilerplate. AppKit is fine too if preferred — `WKWebView` works identically either way.

### Minimum macOS version
**Decision: macOS 14 (Sonoma)** as minimum. Reasons:
- Cleaner SwiftUI window APIs.
- Settings scene works well in pure SwiftUI.
- No real downside — user controls their own machine.

If user is on older macOS, macOS 13 (Ventura) is fine. Polling-based notification detection (see [[Notifications]]) works back to macOS 11; the floor here is set by SwiftUI ergonomics, not WebKit.

### Privacy posture: everything local except Instagram
**Decision: nothing leaves the device except traffic to Instagram itself.** This is a hard constraint, not a preference — see [[Privacy and Legal]].

Concretely:
- All settings in `UserDefaults` (local plist).
- Session cookies in `WKWebsiteDataStore.default()` (local WebKit store, same shape Safari uses for the user's own browsing).
- Notifications via `UNUserNotificationCenter` (local; OS handles delivery without any third party).
- No analytics, telemetry, crash reporting, A/B testing, or "phone home for updates" mechanisms.
- No third-party SDKs of any kind. This is what makes "everything local" actually verifiable rather than aspirational — there is no surprise network call from a library we didn't write.

If a feature seems to require sending data somewhere other than `*.instagram.com`, the feature is rejected. No exceptions.

### Cross-platform structure (preparation, not implementation)
**Decision: organize code so an iOS port is plausible later, but don't write iOS code yet.**

- Keep AppKit imports isolated to: `WebView.swift` (which becomes `UIViewRepresentable` on iOS), `AppDelegate.swift` (iOS uses `UIApplicationDelegate`), `NotificationManager.swift` (`NSApp.dockTile.badgeLabel` → `UIApplication.shared.applicationIconBadgeNumber`).
- `NavigationPolicy.swift`, `Settings.swift`, and the notification scheduling logic are platform-agnostic and should remain so.
- Don't add `#if os(macOS)` guards prematurely — wait until the iOS target actually exists. Premature `#if` is a flavor of feature creep.

See [[Future Roadmap]] § Cross-platform for the actual port plan.

### Zero external dependencies
**Decision: only Apple frameworks.** No Swift Package Manager packages, no CocoaPods, no Carthage, no third-party APIs or services.

Apple-framework allowlist:
- `SwiftUI` — UI.
- `WebKit` — the web view.
- `AppKit` — dock badge, `NSApp`, window management, `NSWorkspace.open`.
- `UserNotifications` — local notification banners.
- `Foundation` — `URL`, `URLRequest`, `Timer`, `UserDefaults`, `DateComponents`, regex.
- `Combine` *(only if needed for observation)*.

Why: keeps the audit surface trivial, eliminates supply-chain risk, ensures nothing depends on a third party staying alive, and makes the [[Repository Hygiene|public-repo path]] clean.

### App lifecycle
**Decision: behave like a standard Mac app.** Open from Dock/Spotlight, quit fully on Cmd-Q, quit fully when the last window closes. No background process, no `LaunchAgent`, no menu bar agent, no auto-launch at login.

Specifically:
- `applicationShouldTerminateAfterLastWindowClosed → true` in the `NSApplicationDelegate`. Closing the window quits the app.
- No `LSUIElement` / menu-bar-only mode.
- No `SMAppService` registration for launch-at-login. (If wanted later, a Settings toggle could add it — Phase 5 polish only.)
- Notification polling timer is bound to app lifetime — when the app quits, polling stops. No "still notifying me when I quit" surprises.

This matches the user's intent that the app should run *only* when they want it to, and stop completely when they don't. The trade-off is no notifications when the app is closed — accepted, because notifications without the app running would imply a background process the user explicitly didn't want.

### Cookie / session persistence
**Decision: `WKWebsiteDataStore.default()`** (the persistent store), not the non-persistent variant. Login persists across launches.

Alternative considered: custom data store keyed to a directory inside the app's container — gives more isolation but unnecessary for a single-user personal app.

### User-Agent string
Instagram's web UI behaves differently for mobile vs desktop UAs. Default `WKWebView` UA on macOS reports as Safari/Mac, which gives the desktop DM UI — what we want. **No UA override needed** for the MVP.

If Instagram ever starts blocking the default UA (unlikely — it's literally Safari's), set `customUserAgent` to a current Safari Mac string.

### Navigation allowlist strategy
**Decision: layered allowlist**, not a simple `path.hasPrefix("/direct")`. Two layers plus a **main-document gate** (as of 1.0.2):

**Base layer — network (`isAllowed`):**
- Narrow DM paths via `isDirectMessagingPath()` — `/direct/inbox`, `/direct/t/`, `/direct/new` only (not every `/direct/…`; group-chat chrome uses other subpaths)
- Auth account subpaths only (`authAccountPathPrefixes`) — **not** blanket `/accounts/*`
- `/challenge/*`, `accounts.instagram.com` host
- `/api`, `/graphql`, `/ajax`, `/static` — for XHR; allowed on network but see main-document gate

**Main-document gate (`isInAppUserSurface`):**
- After login, the visible page must be DM, auth, challenge, or an opt-in surface
- Internal endpoints may load as subresources but must not replace the top-level document

**Opt-in layer (feature modules):**
- `/accounts/activity/*` when `FollowRequests.enabled`
- `/p/*`, `/reel/*`, `/tv/*` when `SharedPosts.enabled` and source frame in DM

**Block (always):** `/`, `/explore`, profiles, non-auth `/accounts/*` (notifications, edit, …)

**Enforcement (`WebView.Coordinator`):** cancel at navigation action + main-frame response; `stopLoading()`; bounce in `didFinish`; DM link taps → Safari; auth post-login → allow `/` once for cookies then route inbox.

Full session record: [[2026-05-25 — Navigation Policy Session and Agent Handoff]].

### Feature modules for opt-in surfaces

**Decision: each opt-in non-DM surface gets its own file** containing both its compile-time switch and its runtime state, plus everything the rest of the app needs to know about it (URL, allowed path prefixes, display name).

Pattern (see `FollowRequests.swift`, `SharedPosts.swift`):

```swift
enum FollowRequests {
    static let available = true          // compile-time
    static let defaultEnabled = false    // first-launch UserDefaults value
    static var enabled: Bool { ... }     // available && user opted in
    static let url: URL = ...
    static let allowedPathPrefixes: [String] = ...
    static let displayName: String = ...
}
```

Why a per-feature file rather than a central `FeatureFlags.swift`:
- To **disable** the feature: flip `available = false` in one place. The Settings toggle disappears, the tab disappears, the URLs are blocked unconditionally.
- To **delete** the feature permanently: delete the file. `grep -r FollowRequests InstaDM/` lists the remaining call sites (a handful in `NavigationPolicy`, `ContentView`, `SettingsView`, `SettingsKey`). Each is a one-line removal.

`NavigationPolicy.isAllowed(_:source:)` consults `FollowRequests.enabled` and `SharedPosts.enabled` directly; the policy itself doesn't store any feature state.

### Handling links shared in DMs
If a friend shares a post link in a DM and the user clicks it, the navigation delegate will block it. Options:
- **A**: Open in default browser (`NSWorkspace.shared.open(url)`).
- **B**: Silently block.
- **C**: Allow `/p/*` and `/reel/*` URLs but only when initiated from `/direct/*` (track previous URL).

**Recommendation: A** — opens the post in Safari, keeps the DM app pure.

## State / data flow

For MVP: there is no app-side state. The `WKWebView` is the entire app's state. Login, unread counts, message contents — all live in the web view.

For Phase 2 (native UI), state will need to be extracted via JS bridge. See [[Future Roadmap]].

## Threats / what to worry about

- **Instagram could detect `WKWebView`** and refuse to serve the DM UI. Unlikely (legitimate Safari users hit the same UA), but possible. Mitigation: customizable UA.
- **2FA / security challenges** during login might use flows that don't render properly in `WKWebView`. Mitigation: allow `/challenge/*` and `/accounts/*` URLs liberally; have a debug menu item to load `about:blank` or clear cookies to retry.
- **CSS injection drift** — if used to hide nav elements, selectors will break when Instagram changes class names. Mitigation: keep CSS injection minimal; rely on navigation blocking as the real defense.

## Out of scope (intentionally)

- Multi-account support.
- Sandbox / App Store compliance.
- Auto-updates.
- Accessibility audits beyond what `WKWebView` provides natively.
- Encryption of local data beyond what `WKWebsiteDataStore` provides.
