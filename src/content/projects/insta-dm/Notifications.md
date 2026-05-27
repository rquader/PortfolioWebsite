# Notifications

The DM app's only user-facing feature beyond "show me my DMs" is notifications, so this gets its own design document. Goal: clean, native, fully local, with multiple opt-in levels — no third-party push service, no external SDK.

## Levels

A single user-controllable setting with four options, stored in `UserDefaults`:

| Level | Dock badge | Notification banner | Content |
|---|---|---|---|
| **Off** | none | none | — |
| **Badge only** | unread count | none | — |
| **Standard** *(default)* | unread count | yes | generic ("You have new messages") |
| **Full preview** | unread count | yes | sender + message preview (best-effort) |

Plus a separate sound on/off toggle and a polling-interval slider (15s / 30s / 60s / 120s — default 30s).

macOS Focus modes and Do Not Disturb are handled by the OS automatically through `UNUserNotificationCenter` — no app-side work needed. Quiet hours is a Phase 2 feature (see end of file).

## Detection mechanism

Three options were considered:

### Option A — Page-title polling *(MVP — use this)*
Instagram's web client puts the unread count in the document title: `(3) Inbox • Instagram`. Polling `document.title` every N seconds via `evaluateJavaScript` is the simplest and most stable approach.

- **Pros**: trivial code, durable (this title format has been stable for years), no DOM scraping.
- **Cons**: gives only an unread count — no sender or message content. Sufficient for Standard level, insufficient for Full preview.

### Option B — DOM scraping for preview
For Full preview level, additionally scrape the inbox sidebar DOM to find the most-recently-bumped thread and read sender + last-message snippet.

- **Pros**: gives sender and preview.
- **Cons**: brittle — Instagram's React DOM and class names change. Selectors will need updating.
- **Recommendation**: implement, but make Full-preview level explicitly labeled "(experimental — may fall back to Standard)" in the Settings UI. If the scraper returns nil, fire a Standard-style notification instead.

### Option C — Web Push API
Modern `WKWebView` (macOS 13+) supports the Web Push API. Instagram's web client *does* push notifications when given permission, but:
- Notifications are dictated by Instagram (their wording, their timing).
- Requires APNs entitlement setup (a paid Apple Developer account, $99/yr).
- Adds another moving part.

Skip for MVP. Reconsider only if polling proves insufficient.

## Suppressing notifications when the user is already looking

Don't notify when the app window is the key window (`NSApp.keyWindow != nil`) — the user is actively reading DMs, a banner would be annoying. The badge still updates regardless.

## Permission flow

On first launch with the level set to anything other than Off, request notification authorization via `UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .badge, .sound])`. If denied, fall back to Badge-only silently (don't nag).

## Settings storage

All settings go through `@AppStorage` against `UserDefaults.standard`. Keys:

- `notificationLevel` — String raw value of `NotificationLevel` enum (`"off"`, `"badgeOnly"`, `"standard"`, `"fullPreview"`).
- `notificationSound` — Bool.
- `pollingIntervalSeconds` — Double.

Plus a `Settings` `ObservableObject` singleton so SwiftUI views and `NotificationManager` observe changes.

## Pseudocode flow

```
on app launch:
    NotificationManager.attach(webView)
    if level != .off:
        request notification permission
    start poll timer with interval from settings

on each poll tick:
    if level == .off: clear badge; return
    title = evaluateJavaScript "document.title"
    count = parse "(N)" prefix from title; default 0
    update dock badge label to count (or nil if 0)
    if count > lastSeenCount AND app is not key window:
        if level == .standard: fire generic notification
        else if level == .fullPreview:
            sender, preview = scrape inbox DOM
            fire detailed notification (or generic fallback)
    lastSeenCount = count

on settings change:
    restart poll timer with new interval
    if level becomes .off: clear badge, cancel pending notifications

on app quit:
    cancel timer
    leave delivered notifications (user can dismiss themselves)
```

See [[Starter Code]] for the actual Swift.

## Settings UI

Native SwiftUI `Settings` scene (`.settings { SettingsView() }` in the `App` body) — opens with Cmd-, like any Mac app. Layout: a small form with a Picker for level, Toggle for sound, Picker for interval. ~40 lines of SwiftUI.

## Things to specifically NOT do

- ❌ Don't run a polling timer when the level is Off — wasted work, drains battery on laptop.
- ❌ Don't notify the user about their own sent messages — the unread count won't go up from sending, so this is automatic with the count-based approach, but worth keeping in mind if you switch to DOM scraping.
- ❌ Don't request notification permission until level > Off. Asking on first launch when user might pick Off is rude.
- ❌ Don't store sender names or message previews to disk. Notifications are ephemeral.
- ❌ Don't use a third-party push service (OneSignal, Pusher, etc.). This is a local app.

## Future (Phase 2+)

- **Per-thread mute** — store a list of muted thread IDs in `UserDefaults`. Skip notifications for those.
- **Quiet hours** — user-defined time range during which notifications are suppressed regardless of level. (`DateComponents` comparison; trivial.)
- **VIP threads** — opposite of mute; notify even when Badge-only is set.
- **Smarter preview extraction** via the API-shim approach from [[Future Roadmap]] (Phase 3) — replaces brittle DOM scraping with stable JSON parsing.
- **Click-through behavior** — when the user clicks a banner, open the app and navigate to the specific thread (`https://www.instagram.com/direct/t/{thread_id}/`). Requires extracting thread IDs in the preview-scraping step.

## Open questions for the implementer

- Does the page title format hold for *all* Instagram locales? Verify by toggling a non-English language in Instagram settings; if not, the regex `^\((\d+)\)` should still work since it's leading-digits-in-parens.
- What happens to the badge if the user is logged out? The web view will show a login page; title won't have `(N)`. Badge clears. Probably fine.
- Should we suppress notifications during the first ~5 seconds after launch while the page loads? Otherwise the initial "0 → N" transition would fire a notification for already-seen messages. **Yes** — track `lastSeenCount = nil` initially and skip notification on first non-nil read.
