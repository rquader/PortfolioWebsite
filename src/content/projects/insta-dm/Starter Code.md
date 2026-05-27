# Starter Code

Drop-in Swift files for the Phase 1 MVP. All files target macOS 14+ SwiftUI app target. Adjust app name as needed. Use a placeholder bundle ID (`com.example.instadm`) — see [[Repository Hygiene]] before pushing anywhere public.

**Dependencies**: Apple frameworks only. Do not add any Swift Package Manager packages. See [[Architecture and Tradeoffs]] § Zero external dependencies.

Order to create:
1. `NavigationPolicy.swift` — URL allowlist
2. `Theme.swift` — palettes + environment wiring (see [[UI Design and Theming]])
3. `Settings.swift` — settings enums + UserDefaults read interface
4. `NotificationManager.swift` — polls for unread, fires native notifications
5. `WebView.swift` — `WKWebView` wrapper
6. `ContentView.swift`
7. `SettingsView.swift` — Cmd-, preferences UI
8. `AppDelegate.swift` — quit-on-last-window-close
9. `InstaDMApp.swift` (replace the generated one)

---

## `NavigationPolicy.swift`

The single source of truth for what URLs the app allows. Edit this file as Instagram's URL structure changes.

```swift
import Foundation

enum NavigationPolicy {

    /// Hosts that are part of Instagram's auth / DM surface.
    private static let allowedHosts: Set<String> = [
        "www.instagram.com",
        "instagram.com",
        "accounts.instagram.com",
        // Add facebook.com hosts here if cross-app login is needed.
    ]

    /// Path prefixes allowed on instagram.com.
    private static let allowedPathPrefixes: [String] = [
        "/direct",        // DMs
        "/accounts",      // login, 2FA, recovery
        "/challenge",     // security checkpoints
        "/api",           // internal AJAX (let through to be safe)
        "/static",        // assets
        "/ajax",          // internal AJAX
    ]

    static func isAllowed(_ url: URL) -> Bool {
        guard let host = url.host else { return false }
        guard allowedHosts.contains(host) else { return false }

        if host == "accounts.instagram.com" { return true }

        let path = url.path
        if path.isEmpty || path == "/" {
            // Root is the feed. Block. Post-login redirect through "/" is
            // re-evaluated on the next navigation event, which goes to /direct.
            return false
        }
        return allowedPathPrefixes.contains(where: { path.hasPrefix($0) })
    }

    static let inboxURL = URL(string: "https://www.instagram.com/direct/inbox/")!
}
```

---

## `Theme.swift`

Palette definitions + SwiftUI environment plumbing. See [[UI Design and Theming]] for the design rationale and exact hex values.

```swift
import SwiftUI

// MARK: - Palette

struct Palette: Equatable {
    let background: Color
    let surface: Color
    let primary: Color
    let accent: Color
    let text: Color
    let textSecondary: Color
    let divider: Color
}

// MARK: - Theme

enum ThemeID: String, CaseIterable, Identifiable {
    case sage, forest, mist

    var id: String { rawValue }

    var displayName: String {
        switch self {
        case .sage:   return "Sage"
        case .forest: return "Forest"
        case .mist:   return "Mist"
        }
    }

    func palette(for scheme: ColorScheme) -> Palette {
        switch (self, scheme) {

        // MARK: Sage
        case (.sage, .light):
            return Palette(
                background:    Color(hex: 0xF7F7F2),
                surface:       Color(hex: 0xF0F2EA),
                primary:       Color(hex: 0x6B8C5F),
                accent:        Color(hex: 0x4A6B3C),
                text:          Color(hex: 0x2A332A),
                textSecondary: Color(hex: 0x5C6B5A),
                divider:       Color(hex: 0xD9DDD0)
            )
        case (.sage, .dark):
            return Palette(
                background:    Color(hex: 0x161A15),
                surface:       Color(hex: 0x1F241D),
                primary:       Color(hex: 0x9CB58F),
                accent:        Color(hex: 0xB8D1A8),
                text:          Color(hex: 0xE4E6DF),
                textSecondary: Color(hex: 0x8E948A),
                divider:       Color(hex: 0x2A3028)
            )

        // MARK: Forest
        case (.forest, .light):
            return Palette(
                background:    Color(hex: 0xF2EFE5),
                surface:       Color(hex: 0xEAE6D7),
                primary:       Color(hex: 0x2D5A3D),
                accent:        Color(hex: 0x1B4332),
                text:          Color(hex: 0x1B2A1B),
                textSecondary: Color(hex: 0x4A5A4A),
                divider:       Color(hex: 0xC4BFB0)
            )
        case (.forest, .dark):
            return Palette(
                background:    Color(hex: 0x0E1612),
                surface:       Color(hex: 0x15201A),
                primary:       Color(hex: 0x4A8067),
                accent:        Color(hex: 0x6FA88B),
                text:          Color(hex: 0xD8D4C6),
                textSecondary: Color(hex: 0x7A8579),
                divider:       Color(hex: 0x1F2A24)
            )

        // MARK: Mist
        case (.mist, .light):
            return Palette(
                background:    Color(hex: 0xF4F6F1),
                surface:       Color(hex: 0xE9EDE3),
                primary:       Color(hex: 0x88A786),
                accent:        Color(hex: 0x5F8A6A),
                text:          Color(hex: 0x2E3A2E),
                textSecondary: Color(hex: 0x5E6B5E),
                divider:       Color(hex: 0xD5DCCB)
            )
        case (.mist, .dark):
            return Palette(
                background:    Color(hex: 0x131914),
                surface:       Color(hex: 0x1B2219),
                primary:       Color(hex: 0xA8C8A8),
                accent:        Color(hex: 0xC8E0C8),
                text:          Color(hex: 0xE8ECE3),
                textSecondary: Color(hex: 0x8E948A),
                divider:       Color(hex: 0x262E26)
            )

        @unknown default:
            return palette(for: .light)
        }
    }
}

// MARK: - Color Scheme Preference

enum ColorSchemePreference: String, CaseIterable, Identifiable {
    case system, light, dark

    var id: String { rawValue }

    var displayName: String {
        switch self {
        case .system: return "System"
        case .light:  return "Light"
        case .dark:   return "Dark"
        }
    }

    /// Returns the ColorScheme to apply, or nil to follow system.
    var preferredColorScheme: ColorScheme? {
        switch self {
        case .system: return nil
        case .light:  return .light
        case .dark:   return .dark
        }
    }
}

// MARK: - Environment

private struct ThemeKey: EnvironmentKey {
    static let defaultValue: Palette = ThemeID.sage.palette(for: .light)
}

extension EnvironmentValues {
    var theme: Palette {
        get { self[ThemeKey.self] }
        set { self[ThemeKey.self] = newValue }
    }
}

// MARK: - Color hex helper

extension Color {
    /// Initialize from a 24-bit RGB integer like 0xF7F7F2.
    init(hex: UInt32, opacity: Double = 1.0) {
        let r = Double((hex >> 16) & 0xFF) / 255.0
        let g = Double((hex >>  8) & 0xFF) / 255.0
        let b = Double( hex        & 0xFF) / 255.0
        self.init(.sRGB, red: r, green: g, blue: b, opacity: opacity)
    }
}
```

---

## `Settings.swift`

Enums for typed settings + a static read interface. Views read/write via `@AppStorage` against the same keys; non-view code (NotificationManager) reads via this struct. Single source of truth: `UserDefaults.standard`.

> ⚠️ **Don't name the read interface `Settings`.** SwiftUI already has a type called `Settings` (the preferences-pane scene used in `InstaDMApp.swift`). A module-local `enum Settings` shadows it and `Settings { SettingsView() }` then fails to compile with "Settings cannot be constructed because it has no accessible initializers." Use `AppSettings` (or another distinct name) instead.

```swift
import Foundation

enum NotificationLevel: String, CaseIterable {
    case off
    case badgeOnly
    case standard
    case fullPreview

    var displayName: String {
        switch self {
        case .off:          return "Off"
        case .badgeOnly:    return "Badge only"
        case .standard:     return "Notify (no preview)"
        case .fullPreview:  return "Notify with preview (experimental)"
        }
    }
}

enum PollingInterval: Double, CaseIterable {
    case fast    = 15
    case normal  = 30
    case slow    = 60
    case slower  = 120

    var displayName: String {
        switch self {
        case .fast:   return "Every 15 seconds"
        case .normal: return "Every 30 seconds"
        case .slow:   return "Every minute"
        case .slower: return "Every 2 minutes"
        }
    }
}

enum SettingsKey {
    static let notificationLevel = "notificationLevel"
    static let notificationSound = "notificationSound"
    static let pollingInterval   = "pollingInterval"
    static let themeID           = "themeID"
    static let colorSchemePref   = "colorSchemePref"
}

enum AppSettings {

    static var notificationLevel: NotificationLevel {
        let raw = UserDefaults.standard.string(forKey: SettingsKey.notificationLevel)
            ?? NotificationLevel.standard.rawValue
        return NotificationLevel(rawValue: raw) ?? .standard
    }

    static var notificationSound: Bool {
        UserDefaults.standard.object(forKey: SettingsKey.notificationSound) as? Bool ?? true
    }

    static var pollingInterval: TimeInterval {
        let raw = UserDefaults.standard.double(forKey: SettingsKey.pollingInterval)
        return raw > 0 ? raw : PollingInterval.normal.rawValue
    }

    static var themeID: ThemeID {
        let raw = UserDefaults.standard.string(forKey: SettingsKey.themeID) ?? ThemeID.sage.rawValue
        return ThemeID(rawValue: raw) ?? .sage
    }

    static var colorSchemePref: ColorSchemePreference {
        let raw = UserDefaults.standard.string(forKey: SettingsKey.colorSchemePref)
            ?? ColorSchemePreference.system.rawValue
        return ColorSchemePreference(rawValue: raw) ?? .system
    }
}
```

---

## `NotificationManager.swift`

Singleton that polls the web view's `document.title` for the unread count, drives the dock badge, and fires native notifications when the count goes up and the app isn't focused. See [[Notifications]] for the design.

```swift
import Foundation
import UserNotifications
import AppKit
import WebKit

final class NotificationManager: NSObject {
    static let shared = NotificationManager()

    private weak var webView: WKWebView?
    private var pollTimer: Timer?
    private var lastSeenCount: Int?   // nil = haven't polled yet; don't notify on first read

    private override init() {
        super.init()
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(settingsChanged),
            name: UserDefaults.didChangeNotification,
            object: nil
        )
    }

    func attach(to webView: WKWebView) {
        self.webView = webView
        requestPermissionIfWanted()
        restartTimer()
    }

    func detach() {
        pollTimer?.invalidate()
        pollTimer = nil
        lastSeenCount = nil
        NSApp.dockTile.badgeLabel = nil
    }

    @objc private func settingsChanged() {
        restartTimer()
        if AppSettings.notificationLevel == .off {
            NSApp.dockTile.badgeLabel = nil
        }
    }

    private func requestPermissionIfWanted() {
        let level = AppSettings.notificationLevel
        guard level == .standard || level == .fullPreview else { return }
        UNUserNotificationCenter.current().requestAuthorization(
            options: [.alert, .badge, .sound]
        ) { _, _ in }
    }

    private func restartTimer() {
        pollTimer?.invalidate()
        pollTimer = nil
        guard AppSettings.notificationLevel != .off else { return }
        let interval = AppSettings.pollingInterval
        pollTimer = Timer.scheduledTimer(withTimeInterval: interval, repeats: true) { [weak self] _ in
            self?.poll()
        }
        poll()
    }

    private func poll() {
        guard AppSettings.notificationLevel != .off, let webView else { return }
        webView.evaluateJavaScript("document.title") { [weak self] result, _ in
            guard let self, let title = result as? String else { return }
            let count = Self.parseUnreadCount(from: title)

            DispatchQueue.main.async {
                NSApp.dockTile.badgeLabel = count > 0 ? "\(count)" : nil
                if let previous = self.lastSeenCount, count > previous {
                    self.fireNotification(previous: previous, current: count)
                }
                self.lastSeenCount = count
            }
        }
    }

    private static func parseUnreadCount(from title: String) -> Int {
        guard let match = title.range(of: #"^\((\d+)\)"#, options: .regularExpression) else {
            return 0
        }
        let captured = String(title[match])
            .trimmingCharacters(in: CharacterSet(charactersIn: "()"))
        return Int(captured) ?? 0
    }

    private func fireNotification(previous: Int, current: Int) {
        let level = AppSettings.notificationLevel
        guard level == .standard || level == .fullPreview else { return }

        // Don't bother the user if they're already looking at the window.
        if NSApp.isActive, NSApp.keyWindow != nil { return }

        let content = UNMutableNotificationContent()
        content.title = "Instagram"
        let added = current - previous
        content.body = added == 1 ? "1 new message" : "\(added) new messages"
        if AppSettings.notificationSound { content.sound = .default }

        // Full-preview extension (Phase 2):
        // - Run a second JS call to scrape the inbox sidebar DOM.
        // - Fill content.subtitle = sender, content.body = preview.
        // - Brittle; see Notifications.md "Option B".

        let request = UNNotificationRequest(
            identifier: UUID().uuidString,
            content: content,
            trigger: nil
        )
        UNUserNotificationCenter.current().add(request)
    }
}
```

---

## `WebView.swift`

`NSViewRepresentable` wrapping `WKWebView`, with the navigation delegate enforcing the policy and the `NotificationManager` attached.

```swift
import SwiftUI
import WebKit
import AppKit

struct WebView: NSViewRepresentable {

    func makeCoordinator() -> Coordinator { Coordinator() }

    func makeNSView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        config.websiteDataStore = .default()  // persistent cookies

        // Cosmetic: hide Instagram's nav links via CSS. Real defense is the
        // navigation delegate; this is just so they aren't tempting.
        let css = """
        a[href='/']:not([href*='direct']),
        a[href^='/explore/'],
        a[href^='/reels/'] { display: none !important; }
        """
        let js = """
        (function() {
            var s = document.createElement('style');
            s.innerHTML = `\(css)`;
            document.head.appendChild(s);
        })();
        """
        let userScript = WKUserScript(
            source: js,
            injectionTime: .atDocumentEnd,
            forMainFrameOnly: true
        )
        config.userContentController.addUserScript(userScript)

        let webView = WKWebView(frame: .zero, configuration: config)
        webView.navigationDelegate = context.coordinator
        webView.uiDelegate = context.coordinator
        webView.allowsBackForwardNavigationGestures = false

        webView.load(URLRequest(url: NavigationPolicy.inboxURL))
        NotificationManager.shared.attach(to: webView)
        return webView
    }

    func updateNSView(_ nsView: WKWebView, context: Context) { }

    static func dismantleNSView(_ nsView: WKWebView, coordinator: Coordinator) {
        NotificationManager.shared.detach()
    }

    final class Coordinator: NSObject, WKNavigationDelegate, WKUIDelegate {

        func webView(_ webView: WKWebView,
                     decidePolicyFor navigationAction: WKNavigationAction,
                     decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
            guard let url = navigationAction.request.url else {
                decisionHandler(.cancel)
                return
            }
            if NavigationPolicy.isAllowed(url) {
                decisionHandler(.allow)
                return
            }
            // User-initiated link clicks → open in default browser.
            // Other (e.g. JS redirect to feed) → bounce to inbox.
            if navigationAction.navigationType == .linkActivated {
                NSWorkspace.shared.open(url)
            } else {
                DispatchQueue.main.async {
                    webView.load(URLRequest(url: NavigationPolicy.inboxURL))
                }
            }
            decisionHandler(.cancel)
        }

        // Open any window.open() / target=_blank in default browser.
        func webView(_ webView: WKWebView,
                     createWebViewWith configuration: WKWebViewConfiguration,
                     for navigationAction: WKNavigationAction,
                     windowFeatures: WKWindowFeatures) -> WKWebView? {
            if let url = navigationAction.request.url {
                NSWorkspace.shared.open(url)
            }
            return nil
        }
    }
}
```

---

## `ContentView.swift`

```swift
import SwiftUI

struct ContentView: View {
    var body: some View {
        WebView()
            .frame(minWidth: 800, minHeight: 600)
    }
}
```

---

## `SettingsView.swift`

The Cmd-, preferences UI. Uses `@AppStorage` directly so SwiftUI auto-refreshes when settings change, and `UserDefaults.didChangeNotification` triggers `NotificationManager` to restart its timer. Pulls colors from `@Environment(\.theme)`.

```swift
import SwiftUI

struct SettingsView: View {

    // Notification settings
    @AppStorage(SettingsKey.notificationLevel) private var levelRaw    = NotificationLevel.standard.rawValue
    @AppStorage(SettingsKey.notificationSound) private var sound       = true
    @AppStorage(SettingsKey.pollingInterval)   private var intervalRaw = PollingInterval.normal.rawValue

    // Appearance settings
    @AppStorage(SettingsKey.themeID)         private var themeIDRaw     = ThemeID.sage.rawValue
    @AppStorage(SettingsKey.colorSchemePref) private var schemePrefRaw  = ColorSchemePreference.system.rawValue

    @Environment(\.theme) private var theme

    private var levelBinding: Binding<NotificationLevel> {
        Binding(get: { NotificationLevel(rawValue: levelRaw) ?? .standard },
                set: { levelRaw = $0.rawValue })
    }
    private var intervalBinding: Binding<PollingInterval> {
        Binding(get: { PollingInterval(rawValue: intervalRaw) ?? .normal },
                set: { intervalRaw = $0.rawValue })
    }
    private var themeBinding: Binding<ThemeID> {
        Binding(get: { ThemeID(rawValue: themeIDRaw) ?? .sage },
                set: { themeIDRaw = $0.rawValue })
    }
    private var schemeBinding: Binding<ColorSchemePreference> {
        Binding(get: { ColorSchemePreference(rawValue: schemePrefRaw) ?? .system },
                set: { schemePrefRaw = $0.rawValue })
    }

    private var level: NotificationLevel { levelBinding.wrappedValue }

    var body: some View {
        Form {
            Section {
                Picker("Theme", selection: themeBinding) {
                    ForEach(ThemeID.allCases) { theme in
                        Text(theme.displayName).tag(theme)
                    }
                }
                .pickerStyle(.segmented)

                Picker("Color scheme", selection: schemeBinding) {
                    ForEach(ColorSchemePreference.allCases) { pref in
                        Text(pref.displayName).tag(pref)
                    }
                }
            } header: {
                Text("Appearance")
                    .foregroundStyle(theme.textSecondary)
            }

            Section {
                Picker("Level", selection: levelBinding) {
                    ForEach(NotificationLevel.allCases, id: \.self) { level in
                        Text(level.displayName).tag(level)
                    }
                }
                Toggle("Play sound", isOn: $sound)
                    .disabled(level == .off || level == .badgeOnly)
                Picker("Check for new messages", selection: intervalBinding) {
                    ForEach(PollingInterval.allCases, id: \.self) { interval in
                        Text(interval.displayName).tag(interval)
                    }
                }
                .disabled(level == .off)
            } header: {
                Text("Notifications")
                    .foregroundStyle(theme.textSecondary)
            }

            Section {
                Text("All settings are stored locally on this Mac. Nothing is sent anywhere except Instagram itself.")
                    .font(.footnote)
                    .italic()
                    .foregroundStyle(theme.textSecondary)
            }
        }
        .padding()
        .frame(width: 460, height: 340)
        .background(theme.background)
        .foregroundStyle(theme.text)
    }
}
```

---

## `AppDelegate.swift`

Tiny — only here so we can opt into quit-on-last-window-close.

```swift
import AppKit

final class AppDelegate: NSObject, NSApplicationDelegate {

    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool {
        // User closes the window → app fully quits. No background process.
        return true
    }
}
```

---

## `InstaDMApp.swift`

Resolves the active theme + color scheme from settings and propagates them into every scene's environment.

```swift
import SwiftUI

@main
struct InstaDMApp: App {

    @NSApplicationDelegateAdaptor(AppDelegate.self) var appDelegate

    @AppStorage(SettingsKey.themeID)         private var themeIDRaw    = ThemeID.sage.rawValue
    @AppStorage(SettingsKey.colorSchemePref) private var schemePrefRaw = ColorSchemePreference.system.rawValue

    @Environment(\.colorScheme) private var systemColorScheme

    private var themeID: ThemeID {
        ThemeID(rawValue: themeIDRaw) ?? .sage
    }
    private var schemePref: ColorSchemePreference {
        ColorSchemePreference(rawValue: schemePrefRaw) ?? .system
    }
    private var resolvedScheme: ColorScheme {
        schemePref.preferredColorScheme ?? systemColorScheme
    }
    private var palette: Palette {
        themeID.palette(for: resolvedScheme)
    }

    var body: some Scene {
        WindowGroup("DMs") {
            ContentView()
                .environment(\.theme, palette)
                .preferredColorScheme(schemePref.preferredColorScheme)
                .tint(palette.primary)
        }
        .windowResizability(.contentSize)
        .commands {
            // Strip default "New Window" / "Open Recent" menu items.
            CommandGroup(replacing: .newItem) { }
        }

        Settings {
            SettingsView()
                .environment(\.theme, palette)
                .preferredColorScheme(schemePref.preferredColorScheme)
                .tint(palette.primary)
        }
    }
}
```

### How updates propagate
- User selects a new theme in Settings → `@AppStorage` writes to `UserDefaults` → `InstaDMApp`'s `@AppStorage` observers fire → `palette` recomputes → `.environment(\.theme, palette)` updates → every view reading `@Environment(\.theme)` re-renders. Instantaneous.
- User toggles macOS dark mode globally → `@Environment(\.colorScheme)` fires → same chain.
- User picks "Dark" override → `schemePref.preferredColorScheme` returns `.dark` → `.preferredColorScheme(.dark)` is applied to the scene → system controls + computed palette both go dark.

---

## Entitlements (`InstaDM.entitlements`)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>com.apple.security.app-sandbox</key>
    <true/>
    <key>com.apple.security.network.client</key>
    <true/>
</dict>
</plist>
```

If sandbox issues arise during development, set `app-sandbox` to `false`. The `UserNotifications` framework works in both sandboxed and non-sandboxed apps.

---

## File layout for the Xcode project

```
InstaDM/
├── InstaDMApp.swift
├── AppDelegate.swift
├── ContentView.swift
├── WebView.swift
├── NavigationPolicy.swift
├── Theme.swift
├── Settings.swift
├── SettingsView.swift
├── NotificationManager.swift
├── Assets.xcassets/
└── InstaDM.entitlements
```

Total: ~600 lines of Swift across 9 files. No external dependencies. No `Package.swift`.

---

## What's covered, what's not

**Covered by this code:**
- DM-only navigation enforcement.
- Persistent login.
- Standard-level notifications with dock badge.
- Quit on window close.
- Settings UI with 4 notification levels.
- Privacy: zero data leaves the device except Instagram traffic itself.

**Not covered (deferred):**
- Full-preview notifications — TODO stub in `fireNotification`. See [[Notifications]] § Option B.
- Native DM UI ([[Future Roadmap]] Phase 3).
- iOS port (architecture is friendly to this — see [[Future Roadmap]] § Cross-platform).
- Multi-window, multi-account, App Store distribution.
