# ADR-002 — Hotkey Reliability Strategy

- **Date**: 2026-04-21
- **Status**: Accepted (revised; see revision note at bottom)

## Context

The app needs a keyboard shortcut that works while the user is in another app. On macOS there are three real APIs for observing keyboard events:

| API | Scope | Permission required | Can suppress key in other apps? |
| --- | --- | --- | --- |
| Carbon `RegisterEventHotKey` | A single specific combo, system-wide | **None** | Yes, for the registered combo only |
| `NSEvent.addGlobalMonitorForEvents` | All keyboard events, read-only | Input Monitoring | No |
| `CGEventTap` | All keyboard events, read/write | Accessibility | Yes |

The first row is the one most people miss. `RegisterEventHotKey` with `GetApplicationEventTarget()` is **not app-scope** — the `GetApplicationEventTarget` name refers to where the event is *delivered* (our event loop), not *when* the registration fires. The OS routes the single registered combo to our app regardless of which app is frontmost, and does so without any privacy prompt or entitlement. This is the same mechanism used by Alfred, Raycast, 1Password, iTerm2, VS Code's hide-window shortcut, and Electron's `globalShortcut`. Source: `blackboardsh/electrobun` issue #334 (explicit comparison of the APIs), Apple's Carbon Event Manager documentation, and the community write-up "Building a Better `RegisterEventHotKey`" by Aditya Vaidyam.

The second row is a permission-hungry read-only API. Practically useless for a counter: the `=` key would still get typed into the text editor.

The third row is what apps like Keyboard Maestro need — they want to replace keystrokes system-wide. A counter does not need this.

### What plain keys actually cost

"Plain `=` counts even while I'm typing in TextEdit" sounds nice, but it requires row 3 because we'd need to **suppress** the `=` before the text editor sees it. Otherwise the user presses `=` and their document gets `=` typed into it plus the counter increments. That is worse than either outcome alone. So plain-key global support isn't one API away; it's Accessibility away, and for a counter the trust cost is not justified.

## Decision

- **v1 uses Carbon `RegisterEventHotKey` exclusively.**
- **Combos work globally.** Any binding with at least one modifier (`⌃`, `⌥`, `⌘`, `⇧`) fires from any app without any permission prompt. This is the primary, on-by-default behaviour.
- **Default binding: `⌃⌥ =`.** Avoids `⌘`-based combos owned by other apps, avoids `⇧`-only combos that type characters, avoids function-row collisions.
- **Plain keys are discouraged.** Quiet Mode (on by default) refuses plain-key bindings and auto-promotes them to `⌃⌥ + key`. If the user turns Quiet Mode off and picks a plain key, we show an inline warning explaining the real consequence: "Plain keys collide with typing everywhere. Use a combo like `⌃⌥=` for a true global shortcut."
- **No Accessibility, no Input Monitoring, no entitlements** in v1. The product can deliver on its "works from anywhere" promise without them.

## Consequences

- The default installation has a true global hotkey with no permission prompt. New users see it "just work" on launch.
- No TCC prompt on first launch means no friction and no "what is this app asking for?" moment.
- Plain-key support is honestly limited, and the Settings copy says so. Users who insist on a plain key know exactly what they get.
- If we ever want to suppress a plain key in other apps, that's a conscious future change (see Future Work).

## Rejected alternatives

- **Ship a CGEventTap + Accessibility prompt from day one** to make *any* binding globally suppressible. Rejected because the trust surface is way out of proportion for a counter; a modifier combo solves the same real problem.
- **Default to plain `=` and warn.** Rejected because it sets the wrong expectation and breaks typing the moment the user focuses any of our own fields.
- **Use `NSEvent.addGlobalMonitorForEvents`.** Rejected because it needs Input Monitoring and still can't suppress the key — the worst of both worlds.

## Future work

If there is eventually a real user need for plain-key global support (e.g. "counter that fires on a plain `=` while I'm in a non-typing context like a PDF viewer"), the path is:
1. Add a `CGEventTap`-based `GlobalKeySuppressingService` alongside the Carbon one.
2. Expose an explicit "Use plain-key global shortcut" toggle that is off by default.
3. When toggled on, request Accessibility with clear explanation copy.
4. Fall back to Carbon if permission is declined.

This path was prototyped and deliberately cut from v1. See the `GlobalHotkeyService` / `PermissionService` scaffolding that was removed in the 2026-04-21 revision.

## Revision history

- **2026-04-21 (initial).** Claimed `RegisterEventHotKey` was app-scope and that going global required Accessibility. This was wrong — I conflated "where the event is delivered" with "when it fires." Carbon registers system-wide without permission for any single combo. The ADR and related settings copy were rewritten to reflect the corrected facts.
- **2026-04-21 (revised).** Current content. Decision unchanged in spirit (Carbon only for v1), but the *reason* is now correct: we don't need Accessibility for combos, and plain-key suppression is the only thing that would.

See also: [[ADR-004 Deferring Accessibility-Based Plain-Key Support]] for the explicit record of the prototype that was cut.
