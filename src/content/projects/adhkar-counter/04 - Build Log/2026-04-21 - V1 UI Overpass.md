# 2026-04-21 — V1 UI Overpass

Full pass over the scaffolded v1 to align code with product intent. Treated as refactor + redesign + polish.

## What changed

### Design system

- Replaced the flat `DesignTokens` with nested `Spacing`, `Radius`, `Size`, `Elevation`, `Typography` scales.
- Refactored `Theme.swift` to expose `AppTheme` as an enum of identities and a `ThemePalette` struct carrying semantic roles (accent, tint, stroke, shadow, surface strategy). Views no longer reach for raw colours.

### State model

- Introduced `HotkeyModifiers` (`OptionSet`) and extended `HotkeyBinding` with a modifier mask.
- Added `AppStateSnapshot.quietMode` and `AppStateSnapshot.showProgressRing`.
- Wrote a custom `init(from:)` that uses `decodeIfPresent` for every key so older snapshots load cleanly and plain-key hotkeys upgrade to `⌃⌥ + key` when Quiet Mode is on.

### Hotkey policy

- `HotkeyService` now registers a Carbon hotkey with a real modifier mask. Default binding changed from plain `=` to `⌃⌥ =`.
- Split Carbon key-code + modifier mapping into `HotkeyKeyCodes` to keep Carbon specifics out of the view-model.
- `KeyCaptureField` now captures key **and** modifiers, renders with a `shortDescription` like `⌃⌥=`, and refuses to store a plain-key binding while Quiet Mode is on (auto-promotes to `⌃⌥ + key`).

### Windowing

- Removed the old `WindowConfigurator` view and the `WindowGroup`-based main surface.
- New `PanelController` owns a borderless, non-activating `NSPanel` hosting `CounterWidgetView` via `NSHostingView`.
- App is now `.accessory` (no Dock icon, no app-switcher entry).
- Settings is the SwiftUI `Settings` scene (native `⌘,`).
- Corner snap is driven by `withObservationTracking` on `viewModel.widgetAnchor` — no polling, no Combine.

### Widget view

- Split `CounterWidgetView` into `WidgetHeaderView`, `CounterNumeralView`, `ProgressRingView`, `WidgetSubtitleView`, and a `WidgetSurface` background.
- The entire central region is the increment button.
- Added a subtle 180 ms spring scale pulse on increment (triggered via `pulseToken`).
- Added an optional progress ring behind the numeral when a target is set.
- Reset and gear are tertiary colour until hover, secondary on hover.

### Settings

- Rebuilt `SettingsView` around a grouped `Form` in a proper Preferences window.
- Added Display mode (completed / remaining) and Show-progress-ring toggle.
- Added Quiet Mode toggle with an inline warning when the user opts out and picks a plain key.
- Added a `ThemeRow` with a colour swatch to make themes feel grounded.

### Notes created

- Full Obsidian folder structure under `AdhkarCounterNotes/` with ADRs, product notes, engineering notes and this build log.

## Known follow-ups

- Persist manual panel position between launches.
- Add `MenuBarExtra` as an optional alternate surface.
- Wire `SMAppService.mainApp` for launch-at-login behind a toggle.
- Decide if plain-key global suppression (CGEventTap + Accessibility) is ever needed. Not in v1.

## Correction — same day, second session

Earlier in this session I said the Carbon hotkey was "app-scope" and that a truly global hotkey would need Accessibility permission. This was wrong. The `GetApplicationEventTarget` parameter to `RegisterEventHotKey` controls **where the event is delivered** (our event loop), not **when it fires**. Carbon's `RegisterEventHotKey` registers the specific combo **system-wide**, and the OS routes it to our app's event loop regardless of which app is frontmost. No Accessibility or Input Monitoring permission is required. This is the same mechanism that Alfred, Raycast, 1Password, iTerm2 and Electron's `globalShortcut` use.

What changed as a result:

- Rewrote [[ADR-002 Hotkey Reliability Strategy]] with corrected facts and an explicit revision history.
- Added [[ADR-004 Deferring Accessibility-Based Plain-Key Support]] recording that a CGEventTap path was explored and deliberately cut.
- Updated the Settings copy in `Features/Settings/SettingsView.swift`: hotkey footer now says combos work globally with no permission prompt, and the plain-key warning explains the real consequence ("Plain keys collide with typing everywhere").
- Updated the doc comment on `HotkeyService` in code to reflect the corrected scope.
- Fixed every other note that used "focus-scoped", "app-scope", or "works while AdhkarCounter is focused" language: [[Adhkar Counter - Home]], [[Vision and Principles]], [[MVP Scope]], [[Main Feature List]], [[Design and UX Principles]], [[System Architecture]], [[V1 Delivery Plan - Privacy and Safety First]], [[Roadmap]], [[Resume Handoff - UI Hotkey Windowing]], [[ADR-001 V1 Surface and Interaction Model]].
- Removed an exploratory `Core/Services/PermissionService.swift` that was added during the wrong-policy phase and no longer has a caller.

The actual code behaviour did not change — the Carbon registration was already global. Only the copy, comments and documentation changed to match reality. This is recorded here rather than as a silent rewrite so future sessions can see the mistake and its correction.
