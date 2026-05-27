# Roadmap

## v1 (shipping)

- Floating panel, theming, global hotkey for modifier combos (Carbon, no permission prompt), target + progress ring, native Settings, corner snap, privacy copy, reset confirmation.

## v1.1 candidates

- Remember manual panel position (`NSPanel.saveFrame` / `frameAutosaveName`).
- Menu-bar extra (`MenuBarExtra` scene) as an alternative surface.
- Simpler alternate hotkeys: a small list of recommended combos (`⌃⌥=`, `⌃⌥Space`, `⌘⌥P`, etc.) that the user can pick from with one click.
- Persist daily totals in a tiny local log (still zero network).

## v1.2 candidates

- Optional Dhikr library: pre-loaded set of adhkar, selectable per session. Strictly local content. See [[Research - Dhikr Content Integrations]] when written.
- Launch-at-login via `SMAppService.mainApp` (macOS 13+).

## Post-v1 (hard questions)

- Plain-key global suppression would require a `CGEventTap` and the Accessibility permission. Modifier combos already work globally without it, so this is only worth adding if a concrete user story demands plain keys. See [[ADR-004 Deferring Accessibility-Based Plain-Key Support]].
- iCloud sync changes the privacy story and is out of scope until we have a clear, user-owned design for it.
