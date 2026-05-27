# MVP Scope

The v1 ship goal is a single, trustworthy counter that respects the user's time and privacy.

## In scope

- Borderless floating panel (`NSPanel`) that stays above other windows.
- Accessory app (no Dock icon, no app-switcher entry).
- Increment by clicking the numeral, or by pressing a configurable modifier combo from any app (global, no permission prompt).
- Optional target (Off / 33 / 100 / Custom) with a quiet progress ring.
- Reset with confirmation dialog.
- Theme picker: Natural Green, Sepia Sand, Forest Moss, Ocean Blue.
- Display mode: completed count vs remaining count.
- Snap the widget to a screen corner; otherwise respect manual drag.
- Native Settings window via `⌘,`.
- Local persistence with forward-compatible snapshot schema.

## Deferred to post-v1

- Menu-bar extra (status item) as an alternative surface.
- Plain-key global suppression (requires Accessibility permission; see [[ADR-004 Deferring Accessibility-Based Plain-Key Support]]). Modifier combos are already global in v1.
- Dhikr library with specific adhkar / morning + evening sets.
- iCloud sync and multi-device state.
- Launch-at-login management (protocol exists but is a no-op).
- Sounds / haptics.
- Widget / Control Center integrations.
- Dhikr content integrations (see [[Research - Dhikr Content Integrations]] when written).

## Out of scope (v1)

- Any kind of network request.
- Any telemetry or analytics — even "anonymous" metrics.
- Any gamification.
