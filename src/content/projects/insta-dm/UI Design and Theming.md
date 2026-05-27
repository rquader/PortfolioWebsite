# UI Design and Theming

The visual system for the app. Natural green palette, clean, native macOS feel, light + dark modes, three theme variants. All implemented with Apple frameworks only — no third-party UI kits, no custom fonts, no design system libraries.

## Design philosophy

- **Native first.** Standard SwiftUI/AppKit controls. The macOS system already does most of the visual heavy-lifting; we don't fight it. No reskinned toggles, no custom-drawn pickers.
- **System font (SF Pro).** Comes with the OS. Zero font assets to ship, no licensing, perfect macOS aesthetic.
- **Quiet and natural.** The app's purpose is *anti-doomscroll*. The visual tone should feel calm — desaturated greens, generous whitespace, no exclamation points, no popups, no badges that pulse.
- **Theme affects what we own.** Settings window, accent color (which system controls inherit), dock badge tint, notification tint. The Instagram web view is not themed in Phase 1 (Instagram owns that surface); see Phase 2 below if you want to push further.

## The surfaces we actually style

| Surface | What we control |
|---|---|
| Main DM window | Title bar (standard), the `WKWebView` inside (Instagram's web UI, untouched in Phase 1) |
| Settings window | All of it — form, sections, picker accents, footer text |
| App accent color | System-wide tint for our app's native controls (`.tint(theme.primary)`) |
| Dock badge | Color is system-default, but our app icon (which the badge sits on) is themed |
| Notifications | OS-controlled appearance; we provide title + body strings only |
| App icon | Static asset; designed once, themed-static (Sage palette) |

Phase 1 styling is concentrated on the Settings window. Don't try to theme the title bar of the main window — it would clash with Instagram's purple/blue inside it. Standard title bar is the right call.

## Palettes

Three options. All values verified for WCAG AA contrast on body text in both modes. Hex values are authoritative; Swift code in [[Starter Code]] § `Theme.swift` converts to `Color`.

### 🌿 Sage *(default — soft, balanced)*

| Role | Light | Dark |
|---|---|---|
| background | `#F7F7F2` | `#161A15` |
| surface | `#F0F2EA` | `#1F241D` |
| primary | `#6B8C5F` | `#9CB58F` |
| accent | `#4A6B3C` | `#B8D1A8` |
| text | `#2A332A` | `#E4E6DF` |
| textSecondary | `#5C6B5A` | `#8E948A` |
| divider | `#D9DDD0` | `#2A3028` |

Mood: warm, lived-in, like a sunlit greenhouse.

### 🌲 Forest *(deeper, richer)*

| Role | Light | Dark |
|---|---|---|
| background | `#F2EFE5` | `#0E1612` |
| surface | `#EAE6D7` | `#15201A` |
| primary | `#2D5A3D` | `#4A8067` |
| accent | `#1B4332` | `#6FA88B` |
| text | `#1B2A1B` | `#D8D4C6` |
| textSecondary | `#4A5A4A` | `#7A8579` |
| divider | `#C4BFB0` | `#1F2A24` |

Mood: established, deliberate, like an old library bound in green leather.

### 🌫️ Mist *(lighter, cooler, almost teal)*

| Role | Light | Dark |
|---|---|---|
| background | `#F4F6F1` | `#131914` |
| surface | `#E9EDE3` | `#1B2219` |
| primary | `#88A786` | `#A8C8A8` |
| accent | `#5F8A6A` | `#C8E0C8` |
| text | `#2E3A2E` | `#E8ECE3` |
| textSecondary | `#5E6B5E` | `#8E948A` |
| divider | `#D5DCCB` | `#262E26` |

Mood: cool morning fog over wet grass.

## Color scheme behavior

User can pick from three modes in Settings (`@AppStorage("colorSchemePref")`):

- **System** *(default)* — follow `@Environment(\.colorScheme)`. Updates automatically when macOS toggles dark mode.
- **Light** — force light palette regardless of system.
- **Dark** — force dark palette regardless of system.

Implementation: read the preference, resolve to a concrete `ColorScheme`, then apply both the right palette variant *and* `.preferredColorScheme()` so system controls (sheets, alerts) follow.

## Settings window — visual spec

```
┌──────────────────────────────────────────────────────┐
│  ●  ●  ●                                             │
│                                                      │
│   Appearance                                         │
│   ────────────────────────────────────               │
│   Theme         (●) Sage   ( ) Forest   ( ) Mist     │
│   Color scheme  [   System   ▾   ]                   │
│                                                      │
│   Allowed Surfaces                                   │
│   ────────────────────────────────────               │
│   Show Requests tab            [ ]                   │
│   Open shared posts in app     [✓]                   │
│   Each toggle opens a non-DM Instagram surface.      │
│                                                      │
│   Notifications                                      │
│   ────────────────────────────────────               │
│   Level         [   Notify (no preview)   ▾   ]      │
│   Play sound    [✓]                                  │
│   Check every   [   Every 30 seconds   ▾   ]         │
│                                                      │
│   ────────────────────────────────────               │
│   All settings stored locally on this Mac.           │
│   Nothing is sent anywhere except Instagram itself.  │
│                                                      │
└──────────────────────────────────────────────────────┘
```

Layout details:
- 480 × 460 px window. Resizable: no.
- Two `Section` blocks. Section header is `textSecondary`, body text is `text`.
- Background: `theme.background`.
- Section internal background: `theme.surface` (`Form` provides this automatically when using a tinted accent).
- Theme picker: SwiftUI `Picker` with `.pickerStyle(.segmented)` showing all three palette names — instantaneous switch, no save button needed.
- Color scheme picker: dropdown.
- Footer text: small, `textSecondary`, italicized — a quiet reminder of the privacy stance.

When the user picks a different theme, the change is immediate everywhere because the palette propagates through `@Environment(\.theme)`.

## Main DM window — visual spec

In Phase 1, deliberately minimal:

```
┌──────────────────────────────────────────────────────┐
│  ●  ●  ●               DMs                           │   ← standard macOS title bar
├──────────────────────────────────────────────────────┤
│                                                      │
│   [   Instagram's own DM web UI fills this space  ]  │
│                                                      │
│                                                      │
└──────────────────────────────────────────────────────┘
```

The window:
- Standard `WindowGroup("DMs")` — no custom title.
- 800 × 600 minimum, user-resizable.
- The `WKWebView` fills the content area completely.
- No toolbar in Phase 1. (Adding a toolbar with a "Settings" button is fine but unnecessary — Cmd-, opens Settings already.)

Why no custom chrome around the web view: Instagram's UI inside has its own visual language. Wrapping it in heavy green chrome creates ugly contrast. Better to be transparent and let the OS title bar match system theme.

## How it all wires together

```
            ┌──────────────────────────────────────────┐
            │  InstaDMApp                              │
            │  @AppStorage("themeID")     → "sage"     │
            │  @AppStorage("schemePref")  → "system"   │
            │  @Environment(\.colorScheme) (system)    │
            │                                          │
            │  Computes Palette from above             │
            │       ↓                                  │
            │  .environment(\.theme, palette)          │
            │  .preferredColorScheme(resolvedScheme)   │
            │  .tint(palette.primary)                  │
            │       ↓                                  │
            │  ┌──────────────┐    ┌────────────────┐  │
            │  │ WindowGroup  │    │ Settings scene │  │
            │  │ ContentView  │    │ SettingsView   │  │
            │  │  └─ WebView  │    │ uses theme     │  │
            │  │     (Insta)  │    │ for backgrounds│  │
            │  └──────────────┘    └────────────────┘  │
            └──────────────────────────────────────────┘
```

Three things happen at the App level:
1. **`.environment(\.theme, palette)`** — palette is available everywhere via `@Environment(\.theme)`.
2. **`.preferredColorScheme(scheme)`** — forces light/dark when user overrode the system preference.
3. **`.tint(palette.primary)`** — system controls (Pickers, Toggles) pick up the theme's primary as their accent.

Code is in [[Starter Code]] § `Theme.swift` and the updated `InstaDMApp.swift` / `SettingsView.swift`.

## Light/dark mode resolution algorithm

```
let pref = UserDefaults.standard.string(forKey: "colorSchemePref") ?? "system"
let scheme: ColorScheme = switch pref {
    case "light": .light
    case "dark":  .dark
    default:      systemColorScheme  // from @Environment
}
let palette = themeID.palette(for: scheme)
```

## App icon

A green leaf or simple geometric shape in the Sage palette's primary/accent. Static asset (PNG @ 1x, 2x for all the macOS icon sizes — 16, 32, 64, 128, 256, 512, 1024). Not themed at runtime (changing the icon requires the app to relaunch and isn't worth the complexity).

**Design brief if you make one yourself**: rounded square, single color block on a slightly darker rounded backdrop. Avoid using Instagram's gradient or color palette — it should look like *our* app, not Instagram. Two-color minimum, no text, readable at 16×16.

**Placeholder option**: just use the system "message" symbol tinted Sage primary. Render via `NSImage(systemSymbolName: "bubble.left.and.bubble.right.fill", accessibilityDescription: nil)?.withSymbolConfiguration(...)`. Generate once, export PNGs, drop into `Assets.xcassets`. Good enough for personal use.

## Dock badge

Default macOS behavior (red rounded rectangle with white digit). The badge color isn't easily customizable via standard APIs without subclassing `NSDockTile`, which isn't worth the complexity. The badge is small and red — it doesn't clash with the green palette aesthetically.

## Notifications

OS-controlled appearance. We can't theme the banner background. The notification icon shown is the app icon — which inherits the Sage palette via the icon asset.

## Phase 2 — theme injection into Instagram's web view *(deferred)*

If you ever want the actual Instagram DM UI to look green-tinted, you can inject CSS via `WKUserScript`. Selectors to target:

- Unread thread badges (currently red dots).
- The "Send" button.
- Active thread highlight.
- Link colors.
- Selection highlight.

This is brittle — Instagram changes class names every few months. Make it opt-in via Settings → "Tint Instagram's UI (experimental)". Don't make it the default.

A starter CSS to inject:

```css
:root {
    /* Override Instagram's blues/purples with theme accent */
    --ig-primary-button-background: #6B8C5F !important;
    --ig-link-color: #4A6B3C !important;
}
/* Unread indicator — verify class name */
[class*="unread"] { background-color: #4A6B3C !important; }
```

Verify selectors in Safari DevTools first. Expect to maintain this once or twice a year. **Don't commit hours to it** — the theme as documented above is the real visual identity; the Instagram web view is a borrowed surface.

## Things to specifically NOT add

- ❌ Custom fonts. System font handles every weight and style we need. Adds binary size, licensing complexity, no real benefit.
- ❌ Animations beyond SwiftUI defaults. The point is calm, not flashy.
- ❌ A "create your own palette" UI. Three good options > infinite mediocre options.
- ❌ Sound effects, haptics. macOS doesn't do haptics, and a DM app does not need sound design.
- ❌ Theme assets stored remotely / downloadable themes. Stays local. See [[Privacy and Legal]].

## Decision log additions (post these to [[Maintenance and References]])

- Three palettes (Sage / Forest / Mist), Sage as default. Selected for calm natural feel matching the app's anti-doomscroll purpose.
- System font (SF Pro) only. No third-party font assets.
- Theme affects Settings + accent only in Phase 1. Web view stays as Instagram's surface.
- Color scheme preference (System / Light / Dark) stored in `UserDefaults`, applied via `.preferredColorScheme()`.
