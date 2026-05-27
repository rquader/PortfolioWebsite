# 2026-05-25 — Post-Ship Regression Session (Opus Handoff)

**Purpose:** Canonical handoff for the **continuation session after `e5a0826`**. The prior note [[2026-05-25 — Navigation Policy Session and Agent Handoff]] documents what **shipped as v0.1.2** and what failed in the *first* long session. **This note** documents the **second wave** of fixes that are **uncommitted, user-reported still broken**, and must not be "fixed" by ping-ponging regressions.

**Read this first** if you are Opus / a stronger model picking up active work.

---

## Repo state (as of handoff)

| Item | Value |
|---|---|
| **Git branch** | `cursor/login-and-blocked-surface-fix` |
| **Last committed good baseline (user-verified)** | `e5a0826` — "Narrow /accounts allowlist and block full Instagram UI leaks" |
| **Prior commit on branch** | `459821d` — login handoff |
| **Uncommitted local diff** | ~510 lines across `WebView.swift`, `NavigationPolicy.swift`, `Settings.swift`, `SettingsView.swift`, `CHANGELOG.md` |
| **Local path** | `~/Developer/InstagramDMOnlyApp/` |
| **GitHub** | https://github.com/rquader/InstaDM |
| **User OS** | macOS 26 (Tahoe) — **always regression-test login here** |
| **User GitHub** | `rquader` |

**Do not assume v0.1.2 on GitHub matches the uncommitted tree.** The user may be running Xcode builds from the dirty working tree.

---

## Product intent (non-negotiable)

1. **DM-only app** — user must not get durable full Instagram UI (feed, explore, search, profiles in-app, stories tray, notifications chrome) inside the embedded web view.
2. **Login must work on macOS 26** — infinite spinner / empty login flash = ship blocker.
3. **Brief flash before bounce is acceptable** — user explicitly prefers flash over staying on full IG.
4. **Safari for intentional external links is optional** — user added Settings toggle; default **on** (preserve old behavior). When **off**, block in-app only — no `NSWorkspace.open`.
5. **No whack-a-mole** — fixing scroll reloads must not re-open profile leaks; fixing profile leaks must not white-screen launch; etc. User is frustrated by oscillating fixes ("one issue goes away, another comes").

---

## What shipped and worked (`e5a0826`)

User said **"PERFECT. works well."** at this commit before asking for "zero flash" hardening.

Working architecture (see prior handoff for detail):

- `NavigationPolicy`: narrowed `/accounts` auth subpaths, narrowed `isDirectMessagingPath`, `isInAppUserSurface`
- `WebView.Coordinator`: auth cookie-gated handoff, `safeRequest` KVC, multi-stage cancel + `didFinish` bounce, `isInDirectContext`, bounce cooldown (`lastBounceAt` / 5s)
- **Reverted and must stay reverted:** WKContentRuleList, `shouldCommitMainFrame`, aggressive `didCommit` abort from first hardening attempt

---

## Issue registry — user reports & latest status

Each row: **symptom → user's words → agent attempts → status at handoff**

### 1. Random reloads / scroll snap to bottom

**User:** "there are a lot of random reloads while using the app, if I scroll up enough for it to load more messages it can sometimes reload and bring me back to the bottom"

**Root cause (identified):** `stopLoading()` on cancelled background navigations aborts pagination XHR; debounced `scheduleRecovery` reloading inbox while still in thread; treating `/api`/`/graphql` main-doc finishes as bounce triggers.

**Agent fixes (uncommitted):** Remove `stopLoading` on silent cancel while on DMs; `scheduleRecovery` skips when `isViewingInAppUserSurface`; gate same-thread `.other` reload behind `hasSettledOnUserSurface`; remove aggressive `didCommit` recovery.

**User follow-up:** Reload issue improved, but see issues 2–7.

**Status:** ⚠️ Partially improved — not confirmed fully solved.

---

### 2. White screen on launch

**User:** "now it opens to a white screen when I launch the app (not good at all)"

**Root cause (identified):** Same-thread `.other` cancel blocked Instagram's initial inbox load; `didCommit` `stopLoading` during launch redirects.

**Agent fixes:** Gate `.other` same-URL cancel to `/direct/t/` only + after `hasSettledOnUserSurface`; removed `didCommit` handler temporarily; restore launch recovery in `didFinish` when not settled.

**Status:** ⚠️ User implied fixed enough to continue testing — not explicitly re-confirmed.

---

### 3. Profile leak returns after scroll fixes

**User:** "now we're back to no reloading issue! But now I can access the full Instagram UI in one-click again from the profiles" and "Composer, you are truly disappointing me, one issue goes away, another comes"

**Root cause (identified):** Blanket `isViewingInAppUserSurface` silent cancel — blocks recovery without dismissing SPA overlays; opening Safari on all `.other` blocked URLs.

**Agent fixes:** `isBlockedInAppChrome`, Safari only on `linkActivated`, `dismissInstagramChrome` JS, `markSurfaceCompromised` + `restoreDMSurface` on return to DMs.

**Status:** ❌ Still broken per issues 6–7.

---

### 4. Fast scroll opens Facebook/Meta in Safari

**User:** "scrolling up fast in a DM and it opened a link on external browser facebook account sync or smth which was just white. Then the app allowed access to full instagram UI again thru a profile"

**Root cause (identified):** Opening Safari for **all** blocked external surfaces including `.other` prefetch during scroll.

**Agent fixes:** Safari **only** on `linkActivated`; off-platform `.other` → silent cancel; expand incidental prefetch list.

**Status:** ⚠️ Unknown if Safari spam fixed; profile leak persisted.

---

### 5. External browser setting

**User:** "can that be a setting to just turn off external opening at all (which activates after logging in…)" — wants default **off**? Actually said toggle off = no external opens; **default on** to match prior behavior was implemented.

**Also asked:** "what are external browsers even used for btw??"

**Implemented (uncommitted):** `SettingsKey.openLinksInExternalBrowser`, Settings → Links toggle, `mayOpenExternalBrowser` gates all `NSWorkspace.open` except during auth/challenge/handoff.

**External browser uses:** profile link taps, shared URLs in messages, `target="_blank"` / `window.open`, off-platform links (Facebook OAuth during login).

**Status:** ✅ Implemented — not user's top complaint anymore.

---

### 6. DM healing after leak

**User:** "if it gives full Instagram UI access once and u return to DMs, it returns to working as usual… when relaunching… stories/notifications shouldn't break it permanently"

**Agent fixes (uncommitted):** `surfaceNeedsHeal`, `lastCommittedPath`, `restoreDMSurface`, `shouldRestoreDMSurface` on `didFinish` when returning from outside-DM path.

**Status:** ⚠️ User wanted this; not confirmed working for minimized case.

---

### 7. Minimized DMs + profile click — **FIX ATTEMPTED, AWAITING USER VERIFICATION**

**User:** "the issue is still when I click a profile and DMs are minimized it gives me access to full Instagram UI" and **"fix did not apply"**

**Root cause (Opus session, 2026-05-25):**

Instagram's React bundle intercepts profile-link clicks at the document delegated-event layer:

1. Click on `<a href="/<username>/">`.
2. IG's delegated `onClick` calls `e.preventDefault()` itself.
3. IG calls `history.pushState('/<username>/')` and renders the profile component in React.

**No navigation event fires.** `decidePolicyFor` never runs. `didCommit` and `didFinish` never run. `webView.url` updates via the History API but our Swift policy never gets a vote. The earlier "rebound" attempts in the uncommitted tree (`isInDMSession`, `shouldRecoverFromMainDocument`, `reboundToLastDMSurface` on profile block) all sit inside `decidePolicyFor` — which is exactly the callback that never fires for this leak.

**URL-only defense in `NavigationPolicy` cannot block this in principle.** The only place to intervene is in JavaScript, before React's click handler runs.

**Fix:** `WebView.spaNavigationGuardJS` — a `documentStart` user script (added 2026-05-25):

1. **Capture-phase click listener** on `document`. Any `<a href>` resolving to a non-DM path gets `preventDefault()` + `stopImmediatePropagation()`. Registered at `documentStart` so we precede every listener IG installs from its bundle — React's delegated handler never sees the click.
2. **Wraps `history.pushState` / `history.replaceState`** so pure SPA URL changes targeting non-DM paths are silently dropped. IG's bundle reads our wrapped versions when it loads.

The allowed-path list mirrors `NavigationPolicy.isDirectMessagingPath` + auth/internal allowlist. **The two lists must stay in sync** — if you add a new DM surface to `NavigationPolicy`, also add it to the JS guard. There is no automated check.

**Side effect:** the messenger's "minimize" button is now a no-op. Its pushState target (`/direct` or `/`) is blocked, so URL stays on the thread and the feed never gets to render underneath. Matches DM-only intent and prevents the minimize → profile-click leak.

**Status:** ⏳ **Awaiting user verification** — build a fresh Debug build and walk the regression matrix, especially:
- Profile tap (minimized DMs): expect no leak.
- Profile tap (full thread): expect block; Safari per setting.
- Scroll up in long thread: expect no scroll-snap regression (the guard is additive, doesn't touch existing Swift policy).
- Cold launch: expect no white screen.
- Login on macOS 26: expect no spinner loop.

**Repro steps to verify:**

1. Log in, open a DM thread.
2. Minimize/collapse the messenger drawer (Instagram web — small bubble / feed visible behind).
3. Tap a profile (avatar or username in thread or minimized UI).
4. **Expected:** click no-ops (no profile rendered); URL stays on the thread; the user can keep using DMs without relaunch.
5. **Previously (broken):** full Instagram UI with persistent access.

**DEBUG instrumentation added:** `WebView.Coordinator.dlog(...)` logs every navigation decision under tag `[InstaDM/...]` in `Console.app` for Debug builds. If the bug recurs, filter `Console.app` for `[InstaDM/` during the repro — absence of any `[InstaDM/decideAction.in]` log for the profile URL confirms the leak is still SPA-only and the JS guard needs another path closed.

---

### 8. Earlier session issues (context only — largely addressed at `e5a0826`)

| Issue | User quote (summary) | At `e5a0826` |
|---|---|---|
| Requests tab infinite reload | "requests page keeps reloading" | Fixed (bounce cooldown) |
| macOS 26 launch crash | app closes immediately | Fixed 1.0.1 `safeRequest` |
| Login spinner | "Log in button… spinning circle" | Fixed 1.0.2 auth handoff |
| Group chat sender → full IG | "profile in a group chat… full nav" | Partially fixed narrow `/direct` |
| ~5th redirect stops working | "breaks like the 5th time" | Led to uncommitted recovery refactor |
| DMProfiles toggle | "toggled off by default" | Module reverted/deleted |
| Feed flash on launch | "feed is shown for a significantly long time" | Partially mitigated response cancel |

---

## Uncommitted code map (what changed since `e5a0826`)

### `NavigationPolicy.swift`

- `isOutsideDMSurface`, `isIncidentalBlockedPrefetch`, `isOffPlatformURL`, `isProfilePath`, `isBlockedInAppChrome`, `shouldRecoverFromMainDocument`
- **Removed bare `/direct` from `isDirectMessagingPath`** (minimize shell) — **contradicts shipped handoff doc** which still lists `/direct` as allowed

### `WebView.swift` (major)

- Replaced `lastBounceAt` cooldown with `nilUrlLoopCount` + `scheduleRecovery` debounce
- Added `hasSettledOnUserSurface`, `lastDMSurfaceURL`, `lastCommittedPath`, `surfaceNeedsHeal`, `isRestoringDMSurface`
- `handleBlockedWhileOnDMs` — no `stopLoading` on DM surface; Safari only on linkActivated
- `isInDMSession` — session-wide DM policy after first inbox load
- `restoreDMSurface` / `reboundToLastDMSurface` / `dismissInstagramChrome`
- `didCommit` — only for `shouldRecoverFromMainDocument` when settled
- `openInExternalBrowserIfAllowed` / Settings integration
- **Risk:** complexity explosion; interactions between guards not fully validated

### `WebView.swift` (Opus session, 2026-05-25 — on top of above)

- `spaNavigationGuardJS` — new `WKUserScript` at `injectionTime: .atDocumentStart, forMainFrameOnly: true`. Capture-phase click listener + `history.pushState`/`replaceState` wrappers. Mirrors `NavigationPolicy.isDirectMessagingPath` allowlist on the JS side. Closes the SPA pushState/overlay leak (issue 7).
- `dlog(...)` — `#if DEBUG` instrumentation in `WebView.Coordinator`. Tag prefix `[InstaDM/` for `Console.app` filtering. Release builds compile to a no-op. Call sites: `decideAction.in`, `decideResponse.in`, `didCommit.recover`, `didFinish.in`, `didFinish.blocked`, `blockedOnDMs.in`/`skipIncidental`, `rebound.toLastDM`/`fallbackHome`, `restoreDM.in`.
- Wired `spaNavigationGuardJS` into `makeNSView` ahead of `cosmeticHideNavCSS`. Both register as user scripts; injection-time differences mean cosmetic CSS still runs at documentEnd as before.

### `Settings.swift` / `SettingsView.swift`

- `openLinksInExternalBrowser` toggle (default `true`)

---

## Why fixes keep oscillating (read before coding)

Three **conflicting pressures:**

```
                    ┌─────────────────────┐
                    │  Block full IG UI   │
                    │  (profiles, feed)   │
                    └──────────┬──────────┘
                               │
         ┌─────────────────────┼─────────────────────┐
         ▼                     ▼                     ▼
  stopLoading()          silent .cancel          reload thread
  aborts scroll XHR      leaves SPA overlay       resets scroll
```

**Lessons from failed attempts:**

1. **`stopLoading()` is global** — kills pagination XHR, not just the blocked main frame.
2. **Silent cancel on DM URL** — navigation blocked but React overlay may remain; URL unchanged → `didFinish` never heals.
3. **`scheduleRecovery` while `webView.url` still DM** — skipped by guards → no heal when overlay stuck.
4. **`/` classified as incidental prefetch** — correct for scroll cancel, **wrong** when feed actually commits (minimize DMs).
5. **Bare `/direct` allowed** — minimize state renders full IG while policy thinks user is on DMs.
6. **Opening Safari on `.other`** — scroll accidents; user hates random tabs.

---

## Recommended approach for Opus (ordered)

### Phase 0 — Baseline ✅

1. ✅ Read `e5a0826:InstaDM/WebView.swift` and current dirty tree side-by-side.
2. ✅ User chose: **salvage uncommitted + add DOM-level JS guard.** Preserves scroll/heal work; adds the only defense possible for SPA-only leaks.
3. User preference: **stability over zero flash.**

### Phase 1 — Reproduce with logging ✅ (Swift side)

✅ `dlog(...)` helper added in `WebView.Coordinator`, `#if DEBUG` only. Tag prefix `[InstaDM/` for `Console.app` filtering. Calls cover: `decideAction.in`, `decideResponse.in`, `didCommit.recover`, `didFinish.in`, `didFinish.blocked`, `blockedOnDMs.in`/`skipIncidental`, `rebound.toLastDM`/`fallbackHome`, `restoreDM.in`.

**User-side step still required:** build Debug, reproduce minimized DMs + profile tap, capture logs. Absence of any `[InstaDM/decideAction.in]` for the profile URL confirms the leak is SPA-only — which the new JS guard should already block. Presence of a `decideAction.in` log followed by no `restoreDM.in` would indicate the Swift policy fires but rebound fails (a different bug).

### Phase 2 — Fix minimized-DM case specifically ✅

✅ Implemented as `WebView.spaNavigationGuardJS` (documentStart WKUserScript, `forMainFrameOnly: true`):
1. **Capture-phase click listener** preempts React's delegated handler. Non-DM `<a href>` clicks get `preventDefault()` + `stopImmediatePropagation()` before IG sees them.
2. **`history.pushState` / `replaceState` wrappers** silently drop SPA URL changes to non-DM paths.

Did **not** re-allow bare `/direct` as a network surface. The JS guard blocks the minimize button's pushState (`/direct` or `/`), which is the source of the feed-underneath state. URL stays on the thread.

The Swift `restoreDMSurface` / `reboundToLastDMSurface` paths are kept as a second line of defense for any non-SPA leak that does reach `decidePolicyFor`. Their previous "no effect" symptom was because `decidePolicyFor` was never being called — not a bug in the rebound itself.

### Phase 3 — Regression matrix (all must pass)

| Test | Pass criteria |
|---|---|
| Cold launch | Inbox or login — **no white screen** |
| Login macOS 26 | Credentials → inbox, no spinner loop |
| Scroll up in long thread | Loads history, **no reload to bottom** |
| Profile tap (full thread) | No durable full IG; Safari per setting |
| Profile tap (**minimized DMs**) | **No durable full IG** |
| Group chat sender name | No full IG |
| Notification/search tap | Brief flash OK; returns to DMs |
| Return to DMs after leak | Heals without logout |
| App relaunch | Clean DM-only without re-login |
| Settings: external browser off | No Safari tabs; still blocked in-app |

### Phase 4 — Commit discipline

- One logical commit per fix axis.
- Do **not** merge ping-pong branch until matrix passes.
- Update CHANGELOG `[Unreleased]` only when user asks to ship.

---

## Do NOT retry without new evidence

- WKContentRuleList hardening
- DMProfiles in-app toggle module
- Blanket `/accounts` or `/direct/*` allowlists
- Global `safeRequest` nil → allow (macOS 26 login break)
- Opening Safari on all `.other` blocked navigations
- Removing all `didCommit` / all `stopLoading` without replacement strategy for committed feed/profile

---

## Terminology (user asked)

**WebKit** = engine (`WKWebView`). **"IG chrome" / "full Instagram UI"** = Instagram's own HTML/CSS/JS (sidebar, feed, profile pages, modals) rendered **inside** WebKit — not a separate browser.

---

## Related notes

- [[2026-05-25 — Navigation Policy Session and Agent Handoff]] — shipped v0.1.2 baseline + first-session failures
- [[2026-05-25 — Login Spinner Fix]]
- [[Risks and Failure Modes]] — updated symptom table
- [[Maintenance and References]] — new troubleshooting entries

---

## Agent operating rules (restated)

1. macOS 26 login regression test after **every** navigation change.
2. Minimize scope — one axis per commit.
3. User wants copy-paste handoff quality — update **this file** when status changes.
4. Obsidian + repo are source of truth, not Cursor chat history.
