# Native Instagram DM App — Project Notes

A native macOS Swift app that gives the user access to Instagram DMs **and nothing else**. The goal is intentional friction against the rest of Instagram — feed, reels, explore, stories — by simply making them unreachable from inside this app.

## Philosophy

- **Privacy is non-negotiable.** Nothing leaves the user's machine except traffic to Instagram itself. No telemetry, no analytics, no crash reporting, no third-party services. Settings, notifications, session — all local. See [[Privacy and Legal]].
- **DMs only by default; opt-in for anything more.** Out of the box the app cancels any click that would leave `/direct/*`. Two opt-in surfaces (`FollowRequests`, `SharedPosts`) can be toggled on in Settings → Allowed Surfaces; each lives in its own one-file feature module so flipping its compile-time flag (or deleting the file) removes it cleanly. See [[Architecture and Tradeoffs]] § Feature modules.
- **No reinvention upfront.** Phase 1 just wraps Instagram's existing web DM UI in a tightly-scoped `WKWebView`. The web UI is the source of truth.
- **Web fallback forever.** Even when a custom native DM UI is built later (see [[Future Roadmap]]), the embedded web view stays as a toggle option so nothing is ever fully broken.
- **No external dependencies.** Only Apple frameworks (SwiftUI, WebKit, AppKit, UserNotifications, Foundation). No SPM packages, no CocoaPods, no third-party services. Easy to audit, nothing to break independently of Instagram, and zero privacy surface beyond Apple itself.
- **Personal use first, public-repo-ready always.** Built for the user's own laptop; no personal data ever lives in source. Could be pushed to a public GitHub repo at any moment without leaking machine-specific info. See [[Repository Hygiene]].
- **Standard Mac app lifecycle.** Opens like any app, quits like any app, runs only when open. No background process, no launch-at-login, no menu bar agent. When the user quits, the app is gone.
- **Native notifications, user-controlled.** Multiple levels from fully off to message preview. See [[Notifications]].
- **Calm green visual design, light + dark.** Three natural-tone palettes (Sage, Forest, Mist). System / Light / Dark color scheme override. See [[UI Design and Theming]].
- **Legal for personal use; eventual paths to GitHub and App Store noted.** See [[Privacy and Legal]] for stance and risks at each distribution stage.

## Why this approach

Picked over alternatives after evaluating:

| Approach | Verdict |
|---|---|
| Site-specific browser (Fluid, Safari Web App) | Good, but the user wants a real Swift project + room to grow into a native UI |
| Instagram Graph API (official) | Useless for personal DMs — business-account-only, 24h reply window |
| Reverse-engineered private API (`instagrapi` etc.) | ToS violation, ban risk, breaks every few months |
| **`WKWebView` wrapper with navigation allowlist** ✅ | Legal, stable, ~few hundred lines, room to layer a native UI on top later |

See [[Architecture and Tradeoffs]] for full reasoning.

## Project status

**Phase 1: daily driver with active navigation polish** (2026-05-25).

- **Repo:** https://github.com/rquader/InstaDM
- **Install:** download `InstaDM.app.zip` from [Releases](https://github.com/rquader/InstaDM/releases/latest) — no Xcode required for end users
- **Released on GitHub:** `v1.0.0` (app **1.0.0**) — but it shipped with **broken fresh login** (see below).
- **Active work (uncommitted, on `main`):** **Opus session 2026-05-27 fixed fresh login** — it was hanging because Instagram's login routes through `/auth_platform/*` (recaptcha) which the allowlist didn't recognize, so the policy cancelled it (`-999`). One-line fix + a cookie-watcher rewrite of the post-login path + per-tab guard allowlists + left-rail hide. **User-confirmed login works.** **See [[2026-05-27 — Fresh Login Fix (auth_platform) and Watcher Rewrite]]** — **start here.** Not yet committed/re-released.
- **Local source:** `~/Developer/InstagramDMOnlyApp/`

See [[2026-05-25 — Public GitHub Release and macOS 26 Crash Fix]] for the GitHub push, icon, CI/releases, launch crash, v0.1.0 removal.  
See [[2026-05-25 — Navigation Policy Session and Agent Handoff]] for what **shipped** in v0.1.2.  
See [[2026-05-25 — Post-Ship Regression Session (Opus Handoff)]] for the SPA profile-leak guard.  
See [[2026-05-27 — Fresh Login Fix (auth_platform) and Watcher Rewrite]] for the **fresh-login fix** (`/auth_platform`), the cookie-watcher login model, per-tab guards, and the left-rail hide — **most current**.

## File map

- [[Architecture and Tradeoffs]] — technical approach and why
- [[Implementation Guide]] — step-by-step build instructions
- [[Starter Code]] — Swift code skeletons to drop into Xcode
- [[UI Design and Theming]] — palettes (Sage / Forest / Mist), light+dark, design philosophy
- [[Notifications]] — notification levels, detection mechanism, settings UI
- [[Privacy and Legal]] — privacy guarantees, legal stance at each distribution stage
- [[Repository Hygiene]] — `.gitignore`, no-personal-data rules, prep for public release
- [[Future Roadmap]] — local native UI, follow requests, multi-mode toggle, iOS port
- [[Maintenance and References]] — what breaks, how to fix, useful links
- [[Risks and Failure Modes]] — drift sources, regression risks, symptom-to-cause lookup
- [[Publishing and Data Exposure]] — GitHub + App Store steps, what could leak, what's safe
- [[2026-05-16 — Allowed Surfaces Pass]] — change record for the opt-in surfaces + bug audit pass
- [[2026-05-25 — Public GitHub Release and macOS 26 Crash Fix]] — GitHub push, releases, icon, reload-loop fix, launch crash on macOS 26, v0.1.0 removal
- [[2026-05-25 — Login Spinner Fix]] — post-auth spinner on macOS 26 (part of 1.0.2)
- [[2026-05-25 — Navigation Policy Session and Agent Handoff]] — what **shipped** in v0.1.2 (`e5a0826`), first-session failures, future ideas
- [[2026-05-25 — Post-Ship Regression Session (Opus Handoff)]] — **active bugs** after ship: scroll reloads, profile leak, minimized DMs — uncommitted work

**This folder is intended to be self-sufficient.** A new chat with read access to these files should be able to build the app end-to-end without additional context.

## Quick-start for a future AI picking this up

This folder is meant to give you everything you need without prior conversation context. Reading order:

1. **This file** — orient yourself.
2. **[[Privacy and Legal]]** — hard constraints, not preferences. Read before suggesting any code.
3. **[[Architecture and Tradeoffs]]** — the "why" behind every design decision.
4. **[[UI Design and Theming]]** — palettes, design system, visual spec.
5. **[[Notifications]]** — design of the notification system.
6. **[[Implementation Guide]] + [[Starter Code]]** — the "how". Code in Starter Code is meant to be pasted directly into Xcode.
7. **[[Repository Hygiene]]** — read before suggesting anything that could end up in a public repo.
8. **[[Future Roadmap]]** — for extensions, iOS port, etc.
9. **[[Maintenance and References]]** — debugging tips and the project decision log.

Operating principles:
- The web UI is the source of truth — never assume an Instagram URL structure or DOM selector is stable. Verify by loading `instagram.com/direct/inbox` in a browser before writing code that depends on the page structure.
- **Never add an external dependency.** If a feature seems to require one, find a way to do it with Apple frameworks or push back on the feature.
- **Never propose features that send data anywhere except Instagram itself.** No "cloud sync", no "share with friends", no telemetry. See [[Privacy and Legal]].
- **The user prefers concise, direct answers.** Don't pad responses with hypotheticals.
