# Implementation Guide

Step-by-step build for the Phase 1 MVP: a macOS app that opens to `instagram.com/direct/inbox`, blocks all non-DM navigation, offers user-configurable native notifications, and quits cleanly when the user closes its window.

See [[Starter Code]] for the actual Swift to paste in. Before writing anything that touches user data, read [[Privacy and Legal]] — the privacy guarantees are constraints, not nice-to-haves.

**Phase 1 status (2026-05-16)**: Built. The starter-code spec below is the original MVP; the actual implementation extends it with two opt-in feature modules (`FollowRequests`, `SharedPosts`) that surface in a new "Allowed Surfaces" Settings section. See `2026-05-16 — Allowed Surfaces Pass.md` for the change record, and [[Architecture and Tradeoffs]] § Feature modules for the pattern.

## Prerequisites

- macOS 14+ (Sonoma) recommended, macOS 13 minimum.
- Xcode 15+.
- Free Apple ID is fine; no paid developer account needed for personal local use.

## Step 1 — Create the Xcode project

1. Xcode → File → New → Project → macOS → **App**.
2. Product Name: `InstaDM` (or any non-Instagram-trademark-y name — see [[Privacy and Legal]] § Legal stance).
3. Interface: **SwiftUI**.
4. Language: **Swift**.
5. Bundle Identifier: use a placeholder like `com.example.instadm` if you ever plan to push to a public repo. For personal-only use, anything unique is fine. See [[Repository Hygiene]].
6. Storage: None.
7. Uncheck tests and core data unless wanted.

## Step 2 — Configure entitlements

The default macOS app template enables App Sandbox. For a `WKWebView` to load remote URLs, you need to allow **outgoing network connections**:

1. Open the `.entitlements` file.
2. Confirm `com.apple.security.network.client` is `YES`.
3. Optionally disable App Sandbox entirely for personal use — simpler if any issues arise. Set `com.apple.security.app-sandbox` to `NO` and remove the sandbox capability. Trade-off: app is less isolated, but it's your machine, your app.

## Step 3 — Add the WebView bridge

Add a SwiftUI `NSViewRepresentable` that wraps `WKWebView`. See [[Starter Code]] → `WebView.swift`.

Key configuration on the `WKWebView`:
- `configuration.websiteDataStore = .default()` — persistent cookies.
- `configuration.preferences.javaScriptEnabled = true` (or use the per-page preferences API on newer macOS).
- A `WKNavigationDelegate` to enforce the allowlist.

## Step 4 — Implement the navigation allowlist

In your `WKNavigationDelegate`:

```swift
func webView(_ webView: WKWebView,
             decidePolicyFor navigationAction: WKNavigationAction,
             decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
    guard let url = navigationAction.request.url else {
        decisionHandler(.cancel)
        return
    }
    if isAllowed(url) {
        decisionHandler(.allow)
    } else {
        // Optional: open in external browser
        NSWorkspace.shared.open(url)
        // Optional: bounce back to inbox
        webView.load(URLRequest(url: URL(string: "https://www.instagram.com/direct/inbox/")!))
        decisionHandler(.cancel)
    }
}
```

`isAllowed(url)` logic — see [[Starter Code]] → `NavigationPolicy.swift` for the full implementation. Start permissive (all `instagram.com` paths during initial login) and tighten over time.

## Step 5 — Load the initial URL

On view appear:

```swift
webView.load(URLRequest(url: URL(string: "https://www.instagram.com/direct/inbox/")!))
```

If not logged in, Instagram itself will redirect to `/accounts/login/?next=/direct/inbox/`. The allowlist must permit `/accounts/*` for login to work.

## Step 6 — First-run test

1. Build and run.
2. Log in. 2FA if applicable.
3. Verify DMs load.
4. **Try to break it**: click profile pictures, click "Instagram" logo, try keyboard shortcuts. Anything that tries to navigate away should be blocked.
5. Try clicking a shared post link in a DM — verify it opens in Safari (or whatever the configured behavior is).

## Step 7 — Wire up theming, settings, and notifications

These are MVP, not optional. The plumbing:

1. Create `Theme.swift` ([[Starter Code]]) — `Palette` struct, `ThemeID` enum with the three palettes, `ColorSchemePreference` enum, and the `\.theme` environment key. See [[UI Design and Theming]] for the design rationale and hex values.
2. Create `Settings.swift` ([[Starter Code]]) — enums + the `AppSettings` static read interface (includes `themeID` and `colorSchemePref`). **Don't name the read interface `Settings`** — it shadows SwiftUI's `Settings` scene type and breaks `InstaDMApp.swift`. Use `AppSettings`.
3. Create `NotificationManager.swift` ([[Starter Code]]) — singleton that polls `document.title` and fires native notifications. Observes `UserDefaults.didChangeNotification` so the timer restarts when the user changes the polling interval or level.
4. Create `SettingsView.swift` ([[Starter Code]]) — Cmd-, preferences pane with **Appearance** (theme picker + color scheme picker) and **Notifications** (level + sound + interval) sections, plus a footer privacy reminder.
5. Update `WebView.swift` to call `NotificationManager.shared.attach(to: webView)` after creating the web view, and `detach()` in `dismantleNSView`.
6. Update `InstaDMApp.swift` to resolve the active palette from settings + `@Environment(\.colorScheme)`, then `.environment(\.theme, palette)`, `.preferredColorScheme(...)`, and `.tint(palette.primary)` on both the main window and Settings scene.

Design decisions are spelled out in [[Notifications]] and [[UI Design and Theming]]. Don't add a third-party push service. Don't add CloudKit sync of settings. Don't add a "shared notification preferences across devices" feature.

### Test the theming

- Open Settings (Cmd-,). Theme defaults to **Sage**, scheme to **System**.
- Switch between Sage / Forest / Mist with the segmented picker — Settings recolor instantly.
- Toggle macOS dark mode globally (System Settings → Appearance) — Settings flip to dark variant.
- Set "Color scheme" to **Dark** explicitly — Settings stay dark regardless of system.
- The main DM window's title bar tracks the resolved scheme; the web view inside is Instagram's own UI and stays however Instagram renders it.

Design decisions are spelled out in [[Notifications]]. Don't add a third-party push service. Don't add CloudKit sync of settings. Don't add a "shared notification preferences across devices" feature.

### Test the notification levels

- Set level to **Off** in Settings. Verify: no dock badge ever appears even when DMs are unread. No polling timer running (check with Instruments if curious).
- Set to **Badge only**. Send yourself a DM from another device. Within polling interval seconds, dock badge shows count. No banner.
- Set to **Standard**. Click away from the app (Cmd-Tab to another app). Send yourself a DM. Verify: native notification banner appears, generic text, no message content.
- Verify: when the app's window is the key window, no banner fires (only badge updates). Read the receipt; banner suppression is intentional — you're already looking.

### Hide UI elements via CSS injection (cosmetic)
The starter `WebView.swift` already injects CSS to hide nav links. Selectors will need occasional touch-ups when Instagram changes class names. The navigation delegate is the actual defense — CSS is so the user isn't tempted by visible "Home" buttons.

## Step 8 — Quality of life

- Set the app icon (Assets.xcassets → AppIcon). For public-repo readiness, use a generic icon — not your face or personal art. See [[Repository Hygiene]].
- Set window minimum size (~ 800x600 looks right for the DM UI).
- Set window title to "DMs" or similar.
- Verify Cmd-Q quits cleanly; Cmd-W closes the window which also quits (because of `applicationShouldTerminateAfterLastWindowClosed`).
- Clicking the dock icon while the app is closed launches it fresh (default Mac behavior).

## Step 9 — Privacy verification

Before declaring the MVP done, run through [[Privacy and Legal]] § Verification checklist. The key items:

- Network sniffer check: only Instagram/Facebook traffic visible while the app runs.
- No third-party packages.
- No `print()` of cookie values or message content.

## Step 10 — Repository prep (whenever you decide to push)

See [[Repository Hygiene]]. The key items:

- Standard Xcode `.gitignore` in place.
- Bundle identifier set to a placeholder.
- `DEVELOPMENT_TEAM` stripped or empty in `.pbxproj`.
- No personal info anywhere in source.
- `LICENSE` and `DISCLAIMER`-bearing README added.

## Distribution

For personal use you don't need to do anything. Just keep the Xcode project open and "Product → Run" when you want to use the app, or "Product → Archive" → export as a notarized/unsigned .app and put it in `/Applications`.

If running an unsigned `.app` outside Xcode triggers Gatekeeper, right-click → Open the first time, or `xattr -dr com.apple.quarantine /Applications/InstaDM.app`.

## Verification checklist before calling it done

Functional:
- [ ] App launches to DM inbox.
- [ ] Login works (including 2FA if applicable).
- [ ] Cookies persist across relaunch — no need to log in every time.
- [ ] Clicking the Instagram logo / home does nothing or stays on DMs.
- [ ] Clicking a profile picture in a DM thread does nothing (or opens in browser, per chosen behavior).
- [ ] Clicking a shared post link opens in Safari.
- [ ] No way to reach the feed, explore, or reels from inside the app.
- [ ] Quitting and reopening returns you to the inbox in your logged-in state.

Notifications (see [[Notifications]]):
- [ ] All four levels are selectable in Settings.
- [ ] Off level produces no badge and no banners.
- [ ] Badge-only level updates dock badge but produces no banners.
- [ ] Standard level fires a banner when the app isn't focused.
- [ ] No banner fires when the user is actively looking at the app.
- [ ] Polling interval picker changes the cadence (verify by setting to 15s and watching).
- [ ] Sound toggle works.

UI and theming (see [[UI Design and Theming]]):
- [ ] Sage theme is the default on first launch.
- [ ] All three themes (Sage / Forest / Mist) selectable; switching is instantaneous.
- [ ] Color scheme picker: System / Light / Dark works as expected.
- [ ] System mode follows macOS appearance changes live.
- [ ] Settings window respects the theme background, surface, and text colors.
- [ ] System controls (Pickers, Toggles) pick up the theme's primary as their tint.

Allowed Surfaces (see [[Architecture and Tradeoffs]] § Feature modules):
- [ ] "Show Requests tab" toggle is OFF on first launch.
- [ ] Turning it on adds a "Requests" tab to the main window immediately, without restart.
- [ ] Turning it off removes the tab immediately; main window collapses back to a single web view.
- [ ] "Open shared posts in app" toggle is ON on first launch.
- [ ] With it on, clicking a `/p/<id>/` link inside a DM opens the post inside the web view (not Safari).
- [ ] With it off, the same click opens in Safari.
- [ ] Setting `FollowRequests.available = false` in `FollowRequests.swift` hides the toggle entirely and blocks `/accounts/activity/*` even if a stale UserDefaults entry says on.
- [ ] Setting `SharedPosts.available = false` in `SharedPosts.swift` hides the toggle and routes all `/p/*`, `/reel/*`, `/tv/*` clicks to Safari regardless of UserDefaults.

Lifecycle:
- [ ] Cmd-Q quits the app fully.
- [ ] Closing the last window quits the app (no lingering process).
- [ ] No login item created; app does not run after a fresh restart unless launched.

Privacy (see [[Privacy and Legal]]):
- [ ] Network sniffer shows only Instagram/Facebook traffic.
- [ ] `grep -rn "print(\|os_log\|NSLog" InstaDM/` shows no logging of sensitive data.
- [ ] No third-party packages in the project.
