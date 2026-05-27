---
sort_order: -1
title: Decision Records
tags: [manim, wallpaper, decisions]
---

# Decision Records

Architecture Decision Records (ADRs) — one file per non-obvious
choice made while building the project. Each records:

- **Context** — what we were trying to do.
- **Decision** — what we chose.
- **Alternatives considered** — what we did *not* do, and why not.
- **Consequences** — what this commits us to.

ADRs are useful precisely when "why did we do it this way?" matters
more than "what is the code." If you're modifying the project, read
the relevant ADR before reverting a non-obvious choice — there's
probably a reason.

## Index

- [[ADR-001-resolution-and-aspect]] — render at 2560×1664 with an
  aspect-correct frame.
- [[ADR-002-seamless-loops]] — integer-cycle counts as the
  loop-seamlessness mechanism.
- [[ADR-003-palette-strategy]] — palettes as named dataclass
  instances, not Manim color constants.
- [[ADR-004-lib-vs-package-structure]] — `lib/` flat layout + per-file
  sys.path bootstrap.
- [[ADR-005-tree-flat-list-vs-nested-vgroups]] — DFS-ordered flat
  branch list for the recursive tree.
- [[ADR-006-rotation-delta-pattern]] — rotation cached externally,
  applied as deltas.
- [[ADR-007-render-config-pattern]] — `WallpaperConfig.apply()` at
  module load time.
