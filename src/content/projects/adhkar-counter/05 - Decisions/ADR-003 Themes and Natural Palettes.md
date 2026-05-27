# ADR-003 — Themes and Natural Palettes

- **Date**: 2026-04-21
- **Status**: Accepted

## Context

Themes should feel natural — greens, sepia, forest, ocean — and never loud. The scaffolded theme enum returned a `LinearGradient` for its panel fill, which made views tightly coupled to the shape of a colour value and made both modes (light / dark) harder to reason about.

## Decision

- Split themes into two types:
  - `AppTheme` — an enum of identities (`naturalGreen`, `sepiaSand`, `forestMoss`, `oceanBlue`) that is persisted and user-facing.
  - `ThemePalette` — a struct of semantic colour roles: `accent`, `tint`, `stroke`, `shadow`, plus a surface strategy flag (`usesSystemSurface`) and an optional custom `warmSurface` gradient.
- Views compose with roles, not literals. `WidgetSurface` picks the right fill based on the palette's surface strategy (`.regularMaterial + tint` for system-blended themes, or a custom warm gradient for Sepia Sand).
- Accent is used **only** for: the numeral on completion, the progress ring stroke, and any subtle tint layer. Never as a panel background.

## Consequences

- Adding a new theme is one palette value, not a new switch-case in every view.
- Both light and dark modes stay intentional because three of the four themes rely on system materials and therefore inherit system-correct contrast; Sepia Sand is the one hand-tuned exception.
- The accent stays quiet, which is important for the "never loud" feel.

## Rejected alternatives

- A single theme with only dark/light variants — too little expressive range for a utility you look at all day.
- A fully bespoke palette per theme — more flexibility than we need, and would have required hand-tuning L/D variants for every theme.
