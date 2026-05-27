# Main Feature List

| Feature | State | Notes |
| --- | --- | --- |
| Floating panel widget | Shipping | `NSPanel`, non-activating, borderless. |
| Click-to-increment | Shipping | Large central button; primary interaction. |
| Global hotkey (combos) | Shipping | Carbon `RegisterEventHotKey`. System-wide, any app frontmost. No permission prompt. |
| Modifier-aware binding | Shipping | Default `⌃⌥=`. |
| Quiet mode | Shipping | Forces a modifier to protect typing. |
| Target presets | Shipping | Off / 33 / 100 / Custom. |
| Progress ring | Shipping | Optional, theme-tinted, subtle. |
| Display mode | Shipping | Completed or remaining. |
| Themes | Shipping | 4 calm palettes, semantic roles. |
| Corner snap + manual drag | Shipping | Snap only on anchor change. |
| Reset with confirmation | Shipping | Alert dialog, destructive role. |
| Native `⌘,` Settings | Shipping | SwiftUI `Settings` scene, ~460×520. |
| Accessory activation policy | Shipping | No Dock icon. |
| Local persistence (UserDefaults) | Shipping | Versioned, forward-compatible decoding. |

See also: [[ADR-001 V1 Surface and Interaction Model]], [[ADR-002 Hotkey Reliability Strategy]], [[ADR-003 Themes and Natural Palettes]], [[ADR-004 Deferring Accessibility-Based Plain-Key Support]].
