# Future Roadmap

Phase 1 (MVP) is the [[Implementation Guide|`WKWebView` wrapper]] **plus** the native notification system ([[Notifications]]) **plus** standard Mac app lifecycle. Everything below is post-MVP. Order is rough and each phase is independent — pick whichever feels worth doing.

## Phase 1.5 — Navigation hardening *(partially shipped 2026-05-25)*

The MVP allowlist was tightened in app **1.0.2** after a long session. Shipped:

- Auth-only `/accounts` subpaths (not blanket prefix)
- Narrow `isDirectMessagingPath` (not every `/direct/…`)
- `isInAppUserSurface` — XHR paths vs main document
- Multi-layer `WebView` cancel (action, response, didFinish)
- Cookie-gated post-login handoff through blocked `/`

**Still open** (documented in [[2026-05-25 — Navigation Policy Session and Agent Handoff]]):

| Idea | Risk | Notes |
|---|---|---|
| DOM overlay detection (MutationObserver) | Brittle | Only lever for profile UI while URL stays `/direct/t/…` |
| `history.pushState` shim | Medium | Blocks some SPA routes; won't catch modals |
| WKContentRuleList document blocks | **High** — tried, reverted | Fought delegate policy; broke login timing |
| `didCommit` early abort | Medium — tried, reverted | Same session as content rules |
| Expand `/direct/…` denylist | Low | Needs DevTools logging of group-chat tap URLs |
| Debug NSLog behind `#if DEBUG` | Low | Recommended before next policy change |

**Do not retry:** DMProfiles in-app toggle (deleted); blanket `/accounts` or `/direct` allowlists.

## Phase 2 — Mode toggle (small, do first)

A single switch in the app: **Web Mode** (default) vs **Native Mode** (Phase 3+).

- Persist the preference in `UserDefaults`.
- Web Mode = today's `WKWebView`. Native Mode = blank for now.
- Wire up the toggle even before there's a native UI — sets the structure up. Native Mode initially just shows "coming soon" placeholder.

**Why first**: forces clean architecture (no logic baked into `ContentView` that assumes web view always exists), and the web view stays as the permanent fallback as promised in [[README]].

## Phase 3 — Native DM UI (the big one)

A SwiftUI-native chat interface that **reads data through** the embedded web view rather than calling Instagram's API directly. The web view stays running invisibly (or in a background tab) and acts as a data source.

### Architecture

```
┌──────────────────────────────────────────────────┐
│  Native SwiftUI UI (visible)                     │
│         ↑          ↑              ↑              │
│    threads list   messages    send-message       │
│         │          │              │              │
│  ┌──────┴──────────┴──────────────┴────────────┐ │
│  │  IGBridge (Swift)                            ││
│  │  - Polls / observes the hidden WKWebView     ││
│  │  - JS-evals to extract DOM data              ││
│  │  - JS-evals to drive UI for sending messages ││
│  └──────────────────────────────────────────────┘│
│                       │                          │
│  ┌────────────────────┴───────────────────────┐  │
│  │  Hidden WKWebView                          │  │
│  │  Logged in. Same session as Web Mode.      │  │
│  └────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────┘
```

### Why "through" the web view, not Instagram's API
- No private API reverse engineering → no ToS violation, no ban risk.
- Reuses the same logged-in session as Web Mode — no separate auth.
- Native UI degrades gracefully when Instagram changes things: data extraction breaks, UI shows "couldn't load — switch to Web Mode" with a one-tap toggle.

### Data extraction options
**A — DOM scraping via JS injection.** Brittle, breaks on Instagram redesigns. Realistically the only option if you don't want to touch their API.

**B — Hook into Instagram's internal AJAX / GraphQL calls.** `WKWebView` can intercept network requests via `WKURLSchemeHandler` (only for custom schemes — won't work for `https`) or by injecting a `fetch`/`XHR` shim that mirrors responses to native side. This is more durable than DOM scraping because the JSON shape changes less than the HTML.

**Recommendation**: B. Shim `window.fetch` and `XMLHttpRequest` to send a copy of response bodies for `/api/v1/direct_v2/*` (or whatever the current endpoints are — inspect in Safari DevTools) to native code via `WKScriptMessageHandler`.

### Sending messages
Two options:
- Evaluate JS that simulates user interaction (type into the text area, click send).
- Capture the AJAX request format from the shim above and replay it from native code with the right cookies.

Option 1 is simpler and uses the same code path Instagram tests itself. Option 2 is faster and decouples from UI changes. Start with 1.

### Pitfalls
- Instagram's web client is heavily React + virtualized lists. The DOM is not stable.
- Pagination, presence, typing indicators, read receipts — each is its own AJAX call. Don't try to support all of them in v1.
- v1 native UI scope: **list of recent threads + read messages + send text-only messages**. Nothing else.

## Phase 4 — Follow requests *(shipped as opt-in 2026-05-16)*

Instagram pending follow requests live at `instagram.com/accounts/activity/?followRequests=1` (verify — URL may change).

**Status (2026-05-16): partially shipped.** The Web-Mode half is in place via the `FollowRequests` feature module (`InstaDM/FollowRequests.swift`) and a TabView in `ContentView`. Off by default; the user opts in via Settings → Allowed Surfaces, which adds a "Requests" tab to the main window. The allowlist permits `/accounts/activity/*` only when the feature is enabled. See [[Architecture and Tradeoffs]] § Feature modules for the pattern.

What's still future:
- **Native-mode follow requests** (a clean approve/deny list scraped from the page) — deferred until Phase 3's native UI exists.
- **Window-chrome button** to load the URL on demand — current implementation puts the surface in a tab; a chrome button is a stylistic alternative.

The "intentionally allow a non-DM surface" worry from the original spec is addressed structurally: every non-DM surface lives in its own feature module with a compile-time `available` flag, plus a runtime opt-in. Adding a new surface is one file; removing one is deleting it. No "and also stories..." can sneak in via NavigationPolicy edits.

## Shared posts in DMs *(shipped as opt-in 2026-05-16)*

Same pattern: `SharedPosts.swift` adds `/p/*`, `/reel/*`, `/reels/*`, `/tv/*` to the allowlist when the user opts in **and** the click's source frame is in `/direct/*`. On by default since the most common DM interaction — "look at the meme my friend just sent" — should just work. The source-frame guard prevents Instagram (or stray CSS) from sneaking the user onto a post surface from elsewhere.

When disabled (toggle off, or `available = false` at compile time), shared post links open in Safari — the original Phase 1 behavior.

## Phase 5 — Quality of life

- **Keyboard shortcuts**: Cmd-K to focus thread search, Cmd-N to compose new message, Cmd-1..9 to switch threads, Cmd-Enter to send.
- **Spotlight integration**: index recent threads via Core Spotlight so search-to-DM works. **Privacy check**: Core Spotlight indexes stay local (`~/Library/Application Support/com.apple.spotlight/`) — fine.
- **Menu bar app**: optional compact mode where DMs are accessible from a menu bar dropdown. Conflicts with "no background process" rule if the menu bar app stays running — must be presented as a separate explicit mode the user opts into, not the default.
- **Multi-window**: pop a thread into its own window.
- **Theme**: native dark/light mode in the native UI.
- **Notification preview** (graduate Full Preview from experimental): DOM scraping or API-shim ([[Future Roadmap]] Phase 3) to extract sender + message preview reliably.
- **Optional launch-at-login** toggle via `SMAppService`. Default off; explicitly opt-in only.
- **CSS theme injection into Instagram's web view** — opt-in "Tint Instagram's UI (experimental)" setting that injects palette-matching CSS over Instagram's blues/purples. See [[UI Design and Theming]] § Phase 2. Brittle by nature; defer until everything else is stable.
- **Additional palettes** beyond Sage / Forest / Mist — e.g. autumn, ocean, monochrome. Only if/when the user actually wants more. Three is a deliberate constraint to keep the choice quick.

## Cross-platform — iOS port

A future-tense concern, but worth thinking about now so the codebase doesn't paint itself into a macOS-only corner.

### What ports cleanly without changes
- `NavigationPolicy.swift` — pure Swift, no platform imports.
- `Settings.swift` — uses `UserDefaults`, works on both.
- The polling logic and unread-count parsing in `NotificationManager`.
- All SwiftUI view structure.

### What needs platform-specific code
- `WebView.swift` — becomes `UIViewRepresentable` instead of `NSViewRepresentable`. `WKWebView` itself is identical.
- `AppDelegate.swift` — iOS uses `UIApplicationDelegate`; there's no "quit on last window close" concept because iOS apps don't quit, they suspend. Simply omit on iOS.
- Dock badge → app icon badge: `NSApp.dockTile.badgeLabel = "3"` becomes `UIApplication.shared.applicationIconBadgeNumber = 3` (or `UNUserNotificationCenter.current().setBadgeCount(3)` on iOS 16+).
- `NSWorkspace.shared.open(url)` → `UIApplication.shared.open(url)`.
- Window-focused check `NSApp.isActive && NSApp.keyWindow != nil` → on iOS use `UIApplication.shared.applicationState == .active`.

### Project structure for the port
Two reasonable approaches:

**A — Multi-platform target.** Single Xcode project, single app target with macOS + iOS destinations. Use `#if os(macOS)` / `#if os(iOS)` for the small platform-specific parts. Best for shared codebase.

**B — Separate iOS target sharing source files.** Two app targets in one project, sharing `NavigationPolicy.swift`, `Settings.swift`, most of `NotificationManager.swift`. Independent `WebView` files per platform. Slightly more setup, slightly cleaner per-target compile.

**Recommendation: A** when you do the port. Less to maintain.

### iOS-specific considerations
- **Background behavior**: iOS apps suspend, not quit. Polling stops while suspended. Web push works as the notification mechanism in iOS 16.4+ — Instagram's web client uses it. Worth experimenting with on iOS specifically.
- **App lifecycle for "not always running"**: less user-controlled on iOS. App stays in suspended state in app switcher until user swipes it away. Acceptable.
- **No "quit on close"** — there's no window close on iOS.
- **Distribution**: see [[Privacy and Legal]] § iOS port for the legal/distribution landscape.

### When to do the port
After Phase 1 is stable on macOS for at least a few months without needing patches. The iOS port should be a routine adaptation, not a debugging exercise.

## Phase 6 — Things to deliberately NOT add

Recording these so future-you doesn't get talked into them:

- ❌ **Feed / Explore / Reels / Stories support.** The entire point of this app is they aren't there.
- ❌ **Multi-account.** Adds a session-management problem that's not worth it for a personal tool.
- ❌ **Cloud sync of settings or message archive.** Hard violation of the privacy posture. Settings are per-machine, period. See [[Privacy and Legal]].
- ❌ **Any third-party SDK** — analytics, crash reporting, "improve the app" telemetry. Zero third-parties means zero. See [[Architecture and Tradeoffs]] § Zero external dependencies.
- ❌ **Local message archive / export.** Once we store message content beyond what `WKWebsiteDataStore` opaquely holds, we're a privacy custodian, and that bar is much higher. Let Instagram be the storage.
- ❌ **Posting / commenting / liking.** Not a DM feature.
- ⚠️ **App Store distribution** — possible but with significant rebranding effort and legal risk; see [[Privacy and Legal]] § Mac App Store distribution. Not currently on the path; reconsider only if the personal-use version is mature and there's a clear reason to publish.

## Web Mode is the shipped product (Phase 3 is optional polish)

**Status (2026-05-25, v0.1.2):** InstaDM works as a daily DM client. Phase 1 Web Mode is not a stopgap waiting to be replaced — it *is* the app. Phase 3 (native SwiftUI chat UI scraped through a hidden web view) is optional future work if you want a prettier or more controllable interface, not because Web Mode failed.

**Safari opens some links by design** — profiles, many shared URLs, anything outside the allowlist. That keeps InstaDM DM-only; it is *not* a hint to "go back to using Instagram in the browser instead." Use both: InstaDM for messaging, Safari (or the main Instagram app) when you deliberately want feed, posts, profiles, stories, etc.

**Still out of scope in InstaDM** (use Safari / main IG app alongside, not *instead of* InstaDM):

- Browsing feed, explore, reels, stories
- Full profile grids, posting, commenting, liking
- Anything Instagram's DM web UI doesn't expose

If Phase 3 never ships, Web Mode remains a complete personal tool. See [[2026-05-25 — Navigation Policy Session and Agent Handoff]] for known edge cases (brief flashes, in-page overlays) — annoyances for future polish, not reasons to abandon the app.
