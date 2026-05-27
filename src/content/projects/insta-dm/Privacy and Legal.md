# Privacy and Legal

Two concerns, distinct but related: **privacy** (the app must never leak the user's data) and **legality** (the app must be safe to build, use, and eventually publish). Both are hard constraints — neither is allowed to slip in the name of a feature.

## Privacy guarantees

The app makes one and only one external connection: to Instagram's own servers, to display the user's DMs. Everything else is local.

### Things that stay on the user's machine

| Category | Where it lives | Notes |
|---|---|---|
| Instagram session cookies | `~/Library/WebKit/<bundle-id>/` (managed by `WKWebsiteDataStore`) | Same place Safari stores cookies — under the user's control |
| User settings (notification level, sound, interval) | `~/Library/Preferences/<bundle-id>.plist` | Managed by `UserDefaults` |
| Cached web assets | `~/Library/Caches/<bundle-id>/` | Standard WebKit cache |
| Notification contents | macOS Notification Center only | Cleared on user dismiss; never persisted by us |

### Things the app must never do

- ❌ Send any data anywhere except `*.instagram.com` and `*.facebook.com` (if cross-app login is enabled).
- ❌ Embed analytics SDKs, telemetry, crash reporters, A/B testing frameworks.
- ❌ Log message contents, sender names, or cookie values anywhere — not `print()`, not `os_log`, not a file.
- ❌ Include any third-party SDK or library, even ostensibly privacy-respecting ones. If a feature seems to need one, find a way to do it with Apple frameworks or drop the feature.
- ❌ Implement "anonymous" usage stats, "improve the app" beacons, or "phone home for updates" mechanisms. The user updates the app by rebuilding it. That's the whole update mechanism.
- ❌ Touch the system keychain or biometric APIs without an explicit user-facing reason.

### Things to be careful about

- ⚠️ Debug builds: `print()` statements added during development can leak data. Audit before shipping any binary outside your machine. A simple `grep -rn "print(" InstaDM/` before push is good practice.
- ⚠️ Crash logs: macOS captures crash reports. If your app crashes inside Instagram's code, the report could contain partial JS strings. This goes to Apple, not us — out of our hands but worth knowing.
- ⚠️ The `WKWebsiteDataStore.default()` data store is shared across `WKWebView` instances in your app, but isolated from Safari's. Good. Don't try to "share" cookies with Safari for convenience — that violates the user's mental model of app boundaries.

### Verification checklist

Before any binary build leaves your machine (gift, demo, public release):
- [ ] `grep -rn "print(\|os_log\|NSLog" InstaDM/` — no debug logging of message content or cookies.
- [ ] No third-party packages in `Package.swift` / `Package.resolved` / Xcode project Frameworks list.
- [ ] Network sniffer (Charles, Proxyman, or `tcpdump`) check: launch app, browse DMs, confirm only Instagram/Facebook traffic. Nothing else.
- [ ] No use of `NSUbiquitousKeyValueStore`, CloudKit, or any iCloud-syncing API.
- [ ] No `loadFileURL` to a path outside the app bundle.

## Legal stance

**Disclaimer**: not a lawyer, not legal advice. This is an informed but layperson summary.

### Personal use on your own account (today's use case)

**Verdict: safe.** You're a normal Instagram user accessing your own DMs through a browser engine. Personal customization of how a web service is displayed in your own browser (CSS injection, navigation restriction) is standard user-side behavior — extensions like uBlock Origin, Stylus, and dozens of focus-mode tools do the same kind of thing. There is no automated mass-scraping, no account creation, no impersonation, no API abuse.

The DOM-scraping aspect (used in Full-preview notifications, Phase 2+) is a notch more aggressive but still falls within "things a browser-side userscript could do." Tampermonkey/Greasemonkey scripts read DOMs all day long.

### Pushing the source to a public GitHub repo

**Verdict: legal, with caveats.**

What is being published is *code* that, when built and run by a user with their own Instagram credentials, accesses their own account. The code itself does not break any law or anyone's ToS — only its runtime usage might.

Caveats:
- Don't include Instagram's trademarks (logo, name "Instagram" in the app icon/name) in a way that could imply affiliation. **Recommendation**: name the app something neutral (e.g. "DMOnly", "FocusDM"), not "Instagram DM Client" or similar. In the README, say "for Instagram DMs" — descriptive use of the trademark is permitted.
- Add a `LICENSE` file (MIT or Apache-2.0 is fine for a personal toy that might attract contributors).
- Add a `DISCLAIMER` section in the README: "Not affiliated with Instagram or Meta. Use at your own risk. May break when Instagram changes their web client. Users are responsible for compliance with Instagram's Terms of Service."
- **Do not distribute Instagram's HTML/CSS/JS, screenshots, or any of their assets.** Code only.
- Do not include a "demo account" or any hardcoded credentials.

A handful of historical projects in this space:
- **IG:dm** — Electron-based, published openly on GitHub, ran for years; eventually abandoned when Instagram's private API changed too aggressively. Was not legally pursued.
- **Beeper Mini** (Instagram bridge component) — got cease-and-desist from Meta over a *different* protocol (iMessage). Their Instagram bridge has continued, though it uses a more aggressive private-API approach than what we're doing.
- **Fluid.app site-specific browsers** — what we're functionally building, just less polished. Fluid is openly sold; Instagram has never targeted it.

### Mac App Store distribution (further future)

**Verdict: difficult but not impossible.**

App Store hurdles:
- App Review may reject anything that "embeds a website without sufficient added value" (App Store Review Guideline 4.2). Our app does add real value (DM-only restriction, custom notifications, native UI), so it has a defensible argument — but reviewers are inconsistent.
- Cannot use Instagram trademarks in the app name or icon. Must be clearly distinct.
- Cannot claim or imply official affiliation.
- Sandboxing is mandatory on the App Store. Our current entitlements are sandbox-compatible.
- **Risk**: Meta could request takedown if they consider the app to violate their ToS. There's no public record of them doing this for browser-wrapper apps, but it's theoretically possible.

**Recommendation**: if App Store distribution becomes a goal, expect to do a serious pass on:
- Renaming/rebranding to be clearly non-Instagram.
- Adding a prominent "Not affiliated with Instagram" notice.
- Possibly engaging a lawyer before submitting, especially if monetizing.
- Or: keep it as a "build it yourself from source" project forever. That sidesteps every App Store concern.

### iOS port (further future)

**Verdict: same architecture works, but distribution is the question.**

Technically: a SwiftUI iOS app with the same `WKWebView` architecture is a small port (see [[Future Roadmap]] § Cross-platform).

Distribution options:
- **App Store**: same hurdles as Mac App Store, plus reviewers tend to be stricter on iOS for "thin web wrappers."
- **Sideloading via Xcode (free account)**: 7-day re-sign hassle.
- **Sideloading via $99/yr developer account**: 1-year signing.
- **AltStore / Sideloadly**: third-party sideloading helpers; legal, ToS-grey on Apple's side; works.
- **TestFlight (internal)**: own use only, 90-day cycles.

Realistic answer for personal use: paid developer account + sideload via Xcode. Public distribution via App Store would require the same rebranding effort as macOS plus more friction.

## Specifically what to NOT add for legal/privacy reasons

These would meaningfully raise legal risk and/or compromise privacy:

- ❌ Mass-scraping of any kind (multiple accounts, all DMs ever, bulk export).
- ❌ Bypassing Instagram's authentication (anything that lets you DM as someone else, recover passwords, etc.).
- ❌ Storing or syncing message content to anywhere outside `WKWebsiteDataStore`'s opaque blob. Don't build a "DM archive" feature, even locally — once message text is in our process memory in a way we control, the privacy bar goes up sharply. Let Instagram's own storage be the storage.
- ❌ A "cloud sync" feature for settings or anything else.
- ❌ A "share my notifications to my watch / other device" feature that involves a relay server.
- ❌ Any features targeting Instagram users who *aren't* the app's user (analytics on the people you talk to, sentiment analysis, etc.).

## Summary card

| Stage | Privacy | Legal | Action needed |
|---|---|---|---|
| Personal use now | ✅ Clean by construction | ✅ Normal user behavior | None — just build it |
| Public GitHub source | ✅ Code only, no data | ✅ With proper naming + license + disclaimer | Rename app, add LICENSE, add DISCLAIMER section |
| Mac App Store | ✅ Still fine | ⚠️ Review risk; rebrand needed | Significant rebranding + possibly legal review |
| iOS via sideload | ✅ Same | ✅ Same as macOS source | $99/yr account or AltStore |
| iOS App Store | ✅ Still fine | ⚠️ Same as Mac App Store, stricter | Same as Mac App Store |

## Opt-in surfaces don't change the privacy posture

The "Allowed Surfaces" section in Settings (added 2026-05-16) exposes opt-in toggles for follow requests and in-app shared-post viewing. These don't broaden what the app *sends* anywhere — they only broaden what URLs the embedded `WKWebView` is allowed to load from Instagram. All traffic still goes to `*.instagram.com` only; nothing new is logged, persisted, or transmitted. See [[Architecture and Tradeoffs]] § Feature modules for the pattern.

Each opt-in surface lives in a single Swift file with a compile-time `available` flag. Flipping it to `false` removes the surface entirely — no orphan UserDefaults reads, no dead UI. Useful when going public-repo if you want to ship a strictly DM-only build for distribution while keeping the toggles in your personal build.
