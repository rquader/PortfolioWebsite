# Design and UX Principles

## Visual tone

- Accent is used only for: numeral at completion, progress ring stroke, subtle tints. Never as a background.
- Themes lean on `.regularMaterial` over `windowBackgroundColor` plus a 6–8 % accent tint, except Sepia Sand which uses a custom warm gradient (by design).
- Strokes are hairline (0.7 pt) so the surface looks drawn, not "framed."
- Shadow is `y:3 radius:14 black @ 12%`. Enough to separate, not enough to feel heavy.

## Typography

- Numeral: SF Rounded, semibold, 48 pt, monospaced digits. Rounded because it reads softer; monospaced because we don't want jitter when digits change.
- Title / captions: 11 pt semibold / regular.
- Body (settings): 13 pt regular.

## Motion

- Increment: a 180 ms spring scale from 1.0 → 1.04 → 1.0. Imperceptible unless you're looking for it.
- Numeric transitions: SwiftUI `contentTransition(.numericText())`.
- Progress ring: `easeOut(duration: 0.25)` on `trim`.

## Interaction

- **Primary**: click the numeral. The entire large central region is the button.
- **Secondary**: hotkey. A modifier combo (default `⌃⌥=`) works globally from any app with no permission prompt. Plain keys are discouraged because they would collide with typing everywhere — see [[ADR-002 Hotkey Reliability Strategy]].
- **Tertiary**: Reset (confirms) and Settings (opens preferences).

## Visual hierarchy

1. The numeral.
2. Anything semantically critical (progress, completion state).
3. The subtitle.
4. The reset and settings controls — visible but tertiary colour until hover.

## Copy

- Direct, non-preachy. Say what works and what doesn't.
- Never shame the user (no "you broke your streak"). The app does not track streaks.
- Keep explanations to one short sentence.
