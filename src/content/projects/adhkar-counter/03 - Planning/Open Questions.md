# Open Questions

- Should the panel remember its manual position between launches? (Lean: yes, v1.1.)
- Should completion play any subtle sound? (Lean: no; non-invasive posture.)
- Should the app appear in the menu bar as an alternative compact surface? (Lean: yes for v1.1, behind a toggle.)
- Should we offer a "Mute for 1 hour" toggle that temporarily unregisters the hotkey? (Lean: nice-to-have, not blocking.)
- How much dhikr content do we want to pre-bundle? What's the licence story for translations / transliterations?

## Resolved

- **Global hotkey vs privacy.** Resolved by [[ADR-002 Hotkey Reliability Strategy]] and [[ADR-004 Deferring Accessibility-Based Plain-Key Support]]. Carbon registers modifier combos globally with no permission, so the product promise is met without any TCC prompt or accessibility hook. Plain-key global suppression would need Accessibility and is deferred until a concrete user need justifies it.
