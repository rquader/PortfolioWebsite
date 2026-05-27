# ADR-004 — Deferring Accessibility-Based Plain-Key Support

- **Date**: 2026-04-21
- **Status**: Accepted

## Context

During the [[ADR-002 Hotkey Reliability Strategy]] revision we considered adding a second hotkey backend — a `CGEventTap` that would allow plain keys (e.g. `=` alone) to be suppressed and observed globally across all apps. That path requires the user to grant Accessibility permission in System Settings.

The owner explicitly asked whether this was worth it, given the product's "works while you work in other apps" goal.

## Decision

- **We do not ship the CGEventTap path in v1.**
- v1 ships Carbon-only (see [[ADR-002 Hotkey Reliability Strategy]]). Combos work globally without permission; plain-key global suppression is not supported.
- A scaffold for the CGEventTap path was written and then deliberately removed from the codebase to avoid carrying unreachable code.

## Reasoning

1. A modifier combo (`⌃⌥=`) already solves the stated user goal: press a key from any app, count goes up. No permission required.
2. The CGEventTap path adds a TCC prompt on first launch, an "AdhkarCounter wants to observe every keystroke you type" trust ask, and ongoing responsibility to handle Accessibility revocation gracefully. That's a meaningful increase in surface area for a counter app.
3. If we later find that real users want plain-key global suppression, we can add the path as an explicit opt-in toggle. It does not need to be in v1 and shouldn't be the default.

## What was cut

- `Core/Services/PermissionService.swift` — wrapper around `AXIsProcessTrusted` / `AXIsProcessTrustedWithOptions` and a System Settings deep-link.
- Planned `GlobalHotkeyService` that would have chosen between Carbon and a CGEventTap based on binding shape and permission state.

Both files were written during exploration on 2026-04-21 and removed in the same session. The decision to cut them is preserved here so future sessions don't re-debate it without fresh evidence.

## When this decision should be revisited

- A concrete user story that genuinely requires a plain key to work globally (rare — most people prefer a combo once they think about it).
- A decision to expand beyond a pure counter into a more ambitious dhikr tool that legitimately wants to observe global context (unlikely in v1 scope).
