# V1 Delivery Plan — Privacy and Safety First

The v1 plan holds two rules above all:

1. No data leaves the machine. No network calls. No analytics. Period.
2. The user cannot accidentally destroy their count.

## Shipping checklist

- [x] Builds cleanly as a SwiftPM executable.
- [x] Launches as `.accessory` (no Dock icon, no app-switcher entry).
- [x] Floating borderless `NSPanel` with theme-aware surface.
- [x] Click the numeral to increment; subtle motion confirms.
- [x] Global hotkey works for modifier combos from any app (Carbon `RegisterEventHotKey`, no permission prompt). Default `⌃⌥=`.
- [x] Quiet Mode prevents plain-key bindings unless the user explicitly opts out.
- [x] Reset always confirms.
- [x] Settings is a native `⌘,` Preferences window.
- [x] Theme persists; target persists; count persists.
- [x] Forward-compatible snapshot decoding (old snapshots decode cleanly, plain-key hotkeys upgrade to `⌃⌥ + key` when Quiet Mode is on).

## Explicitly out

- Network, analytics, accounts, cloud sync.
- Plain-key global suppression (would need Accessibility; see [[ADR-004 Deferring Accessibility-Based Plain-Key Support]]). Modifier combos already work globally in v1 with no permission prompt.
- Launch-at-login (the protocol exists but is a no-op in v1).
