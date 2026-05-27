# 2026-05-25 — Public GitHub Release and macOS 26 Crash Fix

Change record for the push to GitHub, pre-built releases, app icon, and the launch crash that shipped in the first binary and was fixed the same day.

**Public repo:** https://github.com/rquader/InstaDM  
**Current release:** [v0.1.2](https://github.com/rquader/InstaDM/releases/latest) (app version **1.0.2**) — login + navigation hardening  
**Prior:** v0.1.1 (1.0.1) — macOS 26 launch crash fix  
**Deleted release:** `v0.1.0` — removed from GitHub; crashed on macOS 26 at first navigation

---

## Timeline

| When | What |
|---|---|
| 2026-05-25 | Reload-loop fix (`WebView.Coordinator` bounce cooldown), repo hygiene, `io.github.rquader.instadm` bundle ID |
| 2026-05-25 | Public GitHub push (`rquader/InstaDM`), CI workflow, icon integrated, README restructured (`.app` install first) |
| 2026-05-25 | Tag `v0.1.0` → GitHub Release with unsigned `InstaDM.app.zip` |
| 2026-05-25 | User report: app opens then immediately quits ("closed unexpectedly") on macOS 26.4.1 |
| 2026-05-25 | Root cause identified via DiagnosticReports: `EXC_BREAKPOINT` in `URLRequest._unconditionallyBridgeFromObjectiveC` inside `decidePolicyForNavigationAction` |
| 2026-05-25 | Fix: read `WKNavigationAction.request` and `WKFrameInfo.request` via KVC (`safeRequest` extensions) instead of direct Swift property access |
| 2026-05-25 | Tag `v0.1.1`, `MARKETING_VERSION` → `1.0.1`, release workflow publishes fixed binary |
| 2026-05-26 | Delete `v0.1.0` release + tag from GitHub; `/releases/latest` now only points at working build |

---

## macOS 26 launch crash (the important one)

### Symptom

Double-click `InstaDM.app` → window may flash → app quits. macOS reports "InstaDM quit unexpectedly." Crash log shows:

```
EXC_BREAKPOINT (SIGTRAP)
[0] URLRequest._unconditionallyBridgeFromObjectiveC(_:)
[1] WebView.Coordinator.webView(_:decidePolicyFor:decisionHandler:)
```

On **macOS 26.4.1 (Tahoe)**, within ~300 ms of launch, before any UI renders.

### Cause

WebKit headers declare `WKNavigationAction.request` and `WKFrameInfo.request` as **non-nullable** `NSURLRequest *`. Swift imports that as plain `URLRequest` (not optional). Access goes through `_unconditionallyBridgeFromObjectiveC`, which **traps** when the ObjC pointer is actually `nil`.

On macOS 26, the first `decidePolicyForNavigationAction` for the inbox load can have `nil` on `sourceFrame.request` (synthetic / session-restored frame). The v0.1.0 code did:

```swift
let sourcePath = navigationAction.sourceFrame.request.url?.path ?? ""
```

That single `.request` access was enough to crash.

### Fix (`InstaDM/WebView.swift`)

Private extensions read through KVC, which returns `Any?` and never traps:

```swift
private extension WKNavigationAction {
    var safeRequest: URLRequest? {
        (self as NSObject).value(forKey: "request") as? URLRequest
    }
}
private extension WKFrameInfo {
    var safeRequest: URLRequest? {
        (self as NSObject).value(forKey: "request") as? URLRequest
    }
}
```

All navigation delegate call sites use `navigationAction.safeRequest` and `sourceFrame.safeRequest`. Nil → treat as "not from a DM" (strictest safe default).

macOS 14/15 unaffected in practice; KVC of a non-nil property returns the same value as direct access.

### Verification

- Crash logs in `~/Library/Logs/DiagnosticReports/InstaDM-*.ips` — pre-fix builds show the stack above.
- `defaults read /Applications/InstaDM.app/Contents/Info CFBundleShortVersionString` → must be **`1.0.1`**, not `1.0`.
- v0.1.1 binary: launch → process stays alive (`pgrep InstaDM`).

---

## Reload loop fix (same session, earlier)

Separate bug from the crash. Documented in decision log; full reasoning in [[Risks and Failure Modes]] §7 `handleBlocked` row.

**Symptom:** Requests tab infinite-reloads when `/accounts/activity/?followRequests=1` 302s into a blocked URL.

**Fix:** `lastBounceAt` + 5 s cooldown in `handleBlocked`; cleared in `webView(_:didFinish:)`. Re-enabled `FollowRequests.available = true`.

---

## GitHub / distribution decisions

### Repo layout (what shipped)

| Item | Decision |
|---|---|
| Repo URL | `https://github.com/rquader/InstaDM` (public) |
| Bundle ID | `io.github.rquader.instadm` (committed — stable for maintainer + upstream) |
| License | **No `LICENSE` file** — source-available, default copyright; not inviting open contributions via `CONTRIBUTING.md` either |
| Install path | README leads with **download `.app` from Releases**; build-from-source under "For developers" |
| Icon | Canva free elements; credited in README under Acknowledgments per [Content License Agreement](https://www.canva.com/policies/content-license-agreement/) |
| CI | `.github/workflows/build.yml` — typecheck + unsigned Debug build on push/PR |
| Releases | `.github/workflows/release.yml` — on `v*` tag push, Release build + `InstaDM.app.zip` attached |

### Cutting a new release

```sh
git tag v0.2.0
git push origin v0.2.0
```

GitHub Actions builds on `macos-14` with Xcode 15.4. No local Xcode required for publishing binaries.

### Git commit identity

Commits use GitHub noreply email (`<github-noreply-email>`); display name (GitHub handle). Personal Gmail not in `git log`.

---

## Files changed (high level)

**Code**
- `InstaDM/WebView.swift` — bounce cooldown + `safeRequest` KVC workaround
- `InstaDM/FollowRequests.swift` — `available = true` again
- `InstaDM.xcodeproj/project.pbxproj` — bundle ID, `MARKETING_VERSION` 1.0.1

**Repo**
- `README.md`, `CHANGELOG.md`
- `.github/workflows/build.yml`, `release.yml`
- `InstaDM/Assets.xcassets/AppIcon.appiconset/*` — full icon set
- Removed: `LICENSE`, `CONTRIBUTING.md`, GitHub release `v0.1.0`

---

## Notes updated by this pass

- [[README]] — project status
- [[Maintenance and References]] — decision log + Phase 1 status
- [[Publishing and Data Exposure]] — shipped status, current paths
- [[Repository Hygiene]] — bundle ID + license stance
- [[Risks and Failure Modes]] — macOS 26 WebKit nullability + symptom row

---

## Open items (post-release)

- [ ] Network sniffer check per [[Privacy and Legal]] § Verification checklist
- [ ] End-to-end runtime walk of [[Implementation Guide]] verification checklist on logged-in account
- [ ] Requests tab: confirm follow-requests URL still valid in Safari (blank tab = stale URL, not a crash)
- [ ] Consider renaming "InstaDM" before any App Store attempt ([[Privacy and Legal]])
