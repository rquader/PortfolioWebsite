# Resume Handoff — UI, Hotkey, Windowing

Open this first when starting a new session. It's the "pick up where I left off" note.

## TL;DR

- SwiftPM macOS executable, macOS 14+, SwiftUI for content + AppKit for window surface.
- Accessory app (`NSApp.setActivationPolicy(.accessory)`), no Dock icon.
- Main surface is a borderless `NSPanel` managed by `Core/Windowing/PanelController.swift`, hosting `CounterWidgetView` via `NSHostingView`.
- Settings is the SwiftUI `Settings` scene (`⌘,`), sized ~460×520.
- All persistent state is one `AppStateSnapshot` in `UserDefaults` under `adhkar_counter.snapshot.v2`.
- **Hotkey is global for combos.** `⌃⌥=` by default, fires from any app, no permission prompt. See [[ADR-002 Hotkey Reliability Strategy]].

## Hotkey — important correction

Earlier in this project I incorrectly claimed the Carbon-based hotkey was "app-scope only" and that going global required Accessibility permission. That was wrong. `RegisterEventHotKey` with `GetApplicationEventTarget()` registers the specific combo **system-wide** — the OS routes it to our event loop no matter which app is frontmost. No permission, no entitlement, no TCC prompt. Full detail (including sources) is in [[ADR-002 Hotkey Reliability Strategy]]; the decision to stay Carbon-only for v1 (and defer any CGEventTap path) is in [[ADR-004 Deferring Accessibility-Based Plain-Key Support]].

Practical consequence: the default install gives the user a working global shortcut immediately.

## UI layer

- `CounterWidgetView` composes `WidgetHeaderView`, `CounterNumeralView` (optionally overlaid with `ProgressRingView`), and `WidgetSubtitleView` on top of a `WidgetSurface` background.
- Numerals: SF Rounded, monospaced digits, 48 pt semibold.
- Motion: 180 ms spring scale pulse on increment, driven by `CounterViewModel.pulseToken` + `.onChange`.
- Themes are `AppTheme` identities mapped to a `ThemePalette` struct of semantic roles (accent, tint, stroke, shadow, surface strategy). See [[ADR-003 Themes and Natural Palettes]].

## Hotkey layer

- `Core/Services/HotkeyService.swift` wraps Carbon `RegisterEventHotKey`.
- `HotkeyBinding { key, modifiers }` persists in the snapshot.
- Quiet Mode (default on) refuses plain-key bindings in the view-model and auto-promotes them to `⌃⌥ + key`. Off-by-choice plain keys are accepted but the Settings UI warns that plain keys will collide with typing everywhere.

## Windowing layer

- `PanelController` creates an `NSPanel` with `[.borderless, .nonactivatingPanel]`, level `.floating`, `canJoinAllSpaces`, `fullScreenAuxiliary`, `stationary`, `isMovableByWindowBackground = true`, `hasShadow = true`.
- The panel's container view has a rounded CALayer so the system drop shadow follows the widget's rounded shape.
- `WindowPositioner` snaps to the four screen corners. Snap is applied only when the user changes the `widgetAnchor` — manual drags are preserved. The observation uses `Observation.withObservationTracking` on the view-model, no Combine, no polling.

## State layer

- `AppStateSnapshot` is decoded with `decodeIfPresent` for every key, so older builds' snapshots load cleanly.
- On decode, a persisted plain-key binding is auto-promoted to `⌃⌥ + key` if Quiet Mode is on.

## Where to start next

- Persist the panel's manual drag position between launches (`setFrameAutosaveName` or explicit save in the snapshot).
- Optional `MenuBarExtra` alternate surface (v1.1 candidate).
- `SMAppService.mainApp` launch-at-login (wire up the placeholder `LaunchAtLoginService`).
- Explicit opt-in CGEventTap path for plain-key global suppression if a real user need emerges (see [[ADR-004 Deferring Accessibility-Based Plain-Key Support]] for why it was cut from v1).

## Obsidian note hygiene

If you change a load-bearing decision (hotkey strategy, window surface, theme model, privacy posture), update:

1. The relevant ADR under `05 - Decisions/` — add a revision-history entry, don't silently rewrite facts.
2. This handoff note's TL;DR.
3. [[Vision and Principles]] only if a principle itself changes (rare).
4. The build log entry for the day.

Copy in code that users read (Settings footers, warnings, tooltips) must match the ADR. A grep for `focused`, `app-scope`, `global` across the notes and the Swift sources is a good sanity check after changes.
