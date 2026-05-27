# System Architecture

SwiftPM executable target targeting macOS 14+. SwiftUI for the content tree, AppKit for the window surface and hotkey registration.

## Layers

```
App/
  AdhkarCounterApp.swift    // @main, Settings scene, NSApplicationDelegate.

Core/
  DesignSystem/
    DesignTokens.swift      // Spacing, radii, sizes, elevation, typography.
    Theme.swift             // AppTheme + ThemePalette (semantic roles).
  Model/
    AppState.swift          // Snapshot, TargetPreset, HotkeyBinding, etc.
  Services/
    HotkeyService.swift     // Carbon RegisterEventHotKey. System-wide for combos.
    PersistenceService.swift// UserDefaults snapshot with forward-compat decode.
    LaunchAtLoginService.swift // Placeholder protocol, deferred.
  Windowing/
    PanelController.swift   // NSPanel + NSHostingView, sizing.
    WindowPositioner.swift  // Corner snap math.

Features/
  Counter/
    CounterViewModel.swift  // @Observable, drives state + persistence.
    CounterWidgetView.swift // Root widget view.
    CounterSubviews.swift   // Header, numeral, ring, subtitle.
  Settings/
    SettingsView.swift      // Native grouped Form in the Settings scene.
    KeyCaptureField.swift   // NSViewRepresentable; captures key + modifiers.
```

## Runtime composition

1. `AppDelegate.applicationDidFinishLaunching` sets `.accessory`, creates the view-model and the `PanelController`.
2. `PanelController` instantiates the `NSPanel` and hosts `CounterWidgetView` via `NSHostingView`.
3. The view-model wires `HotkeyService.onHotkeyPressed` to its `increment()`.
4. `Settings` SwiftUI scene hosts `SettingsView`, bound to the same view-model.
5. `withObservationTracking` on `viewModel.widgetAnchor` re-runs the corner-snap when (and only when) the user changes the anchor.

## Why `NSPanel`, not `WindowGroup`

A `WindowGroup` produces a titled window with traffic lights and standard chrome. A dhikr widget wants less: borderless, rounded, non-activating. `NSPanel` with `[.borderless, .nonactivatingPanel]` matches that intent and still gives us `.floating` level, drag-by-background, join-all-spaces, and full-screen auxiliary behaviour.

## Hotkey scope

`HotkeyService` uses Carbon `RegisterEventHotKey`. This API registers a single specific combo **system-wide**: the OS watches for that exact key + modifier combination and, when it sees it, routes the event into our application's event loop. The `GetApplicationEventTarget()` argument controls delivery, not registration scope. No Accessibility or Input Monitoring permission is required, because the API only gives us the one combo we asked for — not a stream of all keystrokes. See [[ADR-002 Hotkey Reliability Strategy]] and [[ADR-004 Deferring Accessibility-Based Plain-Key Support]] for the full reasoning.

## Threading

- UI is MainActor by construction (`@Observable` plus SwiftUI).
- `HotkeyService` posts its callback on the main queue via `DispatchQueue.main.async` before invoking the view-model.
