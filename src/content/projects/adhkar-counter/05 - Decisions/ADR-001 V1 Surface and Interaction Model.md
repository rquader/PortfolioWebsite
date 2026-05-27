# ADR-001 — V1 Surface and Interaction Model

- **Date**: 2026-04-21
- **Status**: Accepted (minor revision; see bottom)

## Context

The app needs to be "always available" while the user works in other apps. The original scaffold used SwiftUI `WindowGroup`, which produces a titled window with traffic lights and full chrome. That does not match the product intent of a tiny, respectful dhikr widget, and the expanding side-panel for Settings added complexity that was not paying for itself.

## Decision

- **Main surface**: a borderless `NSPanel` created in `NSApplicationDelegate.applicationDidFinishLaunching`, hosting `CounterWidgetView` via `NSHostingView`.
  - `styleMask = [.borderless, .nonactivatingPanel]`.
  - `level = .floating`.
  - `collectionBehavior = [.canJoinAllSpaces, .fullScreenAuxiliary, .stationary]`.
  - `isMovableByWindowBackground = true`.
- **Activation policy**: `.accessory`. No Dock icon, no app-switcher entry.
- **Settings surface**: the SwiftUI `Settings` scene, opened via `⌘,` or the widget gear. Sized ~460×520.
- **Primary increment**: click anywhere on the central numeral region.
- **Secondary increment**: global hotkey (modifier combo) via Carbon. Works from any app without a permission prompt. See [[ADR-002 Hotkey Reliability Strategy]].
- **Reset** stays as a tertiary button in the subtitle row and always confirms via an alert.

## Consequences

- The app *feels* like a widget, not a mini document window.
- Clicks on the panel do not steal focus from the frontmost app (`.nonactivatingPanel`), which is the right posture for a persistent overlay.
- The global hotkey still works from any app because Carbon's `RegisterEventHotKey` is system-wide — it does not require AdhkarCounter to be the key app.
- SwiftUI `Settings` gives us native menu integration (`⌘,`) and avoids rolling our own preferences window.

## Rejected alternatives

- `WindowGroup` with a custom style modifier — still carries traffic-light chrome and default window menus, wrong tone.
- `MenuBarExtra` as the sole surface — the persistent floating number is part of the product's spiritual intent; hiding it inside a menu-bar popup works against that.
- Side-expanding settings panel from the widget — visually awkward, makes the widget look like a mini-dashboard.

## Revision history

- **2026-04-21 (initial).** Described the hotkey as "focus-scoped" and said it "only fires when the user explicitly interacts with AdhkarCounter." That was based on a wrong reading of `RegisterEventHotKey`. Corrected alongside [[ADR-002 Hotkey Reliability Strategy]].
- **2026-04-21 (revised).** Current content. The surface + interaction decision is unchanged; only the hotkey consequence bullet was corrected.
