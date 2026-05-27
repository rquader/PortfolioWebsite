# State Model

All persistent state lives in a single `AppStateSnapshot` encoded as JSON into `UserDefaults` under the key `adhkar_counter.snapshot.v2`.

## Schema

```swift
struct AppStateSnapshot: Codable {
    var currentCount: Int
    var targetPreset: TargetPreset   // off | thirtyThree | oneHundred | custom
    var customTarget: Int?
    var displayMode: DisplayMode     // completed | remaining
    var hotkey: HotkeyBinding        // { key, modifiers }
    var quietMode: Bool              // plain-key lockout
    var widgetAnchor: WidgetAnchor   // topLeft | topRight | bottomLeft | bottomRight
    var theme: AppTheme              // naturalGreen | sepiaSand | forestMoss | oceanBlue
    var showProgressRing: Bool
}
```

## Runtime state (not persisted)

- `CounterViewModel.isResetConfirmationShown` — alert plumbing.
- `CounterViewModel.pulseToken` — drives the micro-animation on increment.
- Panel frame / drag position — owned by `NSPanel` itself, not persisted in v1 (deferred until we add "remember my position").

## Forward-compatibility

`AppStateSnapshot.init(from:)` is custom. Every field is read via `decodeIfPresent`, falling back to sensible defaults. This lets future versions add fields without losing data from older builds, and lets us migrate shape changes (e.g. plain-key hotkeys get auto-promoted when Quiet Mode is on during decode).

## Invariants

- `currentCount >= 0`.
- `targetPreset == .custom` implies `customTarget != nil` for `targetCount` to produce a value.
- `quietMode == true` implies the view-model refuses to store a plain-key hotkey (see `enforcePolicy(on:)`).
