---
title: 'ADR-004: Flat lib/ Layout + Per-File sys.path Bootstrap'
tags: [adr, decision]
status: accepted
date: 2026-05-13
---

# ADR-004: Flat `lib/` layout + per-file sys.path bootstrap

## Context

Scene files in `scenes/` need to import shared utilities from `lib/`.
Manim's CLI imports scene files using `importlib.util.spec_from_file_location`,
which does **not** add the file's directory (or the project root) to
`sys.path`. So a naive `from lib.config import ...` raises
`ModuleNotFoundError: No module named 'lib'`.

Options for resolving this:

1. **Install the project as an editable package** (`pip install -e .`)
   with a `pyproject.toml` declaring `lib` and `scenes` as packages.
2. **Make scenes a Python sub-package** of a top-level `manim_wallpaper`
   package, then invoke Manim with the package path.
3. **Add a two-line `sys.path.insert(...)` shim** at the top of each
   scene file so `from lib.X import ...` works.
4. **Bake `PYTHONPATH=project_root` into the render script** so the
   shim isn't needed.

## Decision

Option 3 + Option 4 (both). Each scene file has a tiny sys.path shim:

```python
import pathlib
import sys
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent))
```

…and `render.sh` *also* sets `PYTHONPATH` to the project root. The
sys.path shim is the defensive belt; the PYTHONPATH is the
suspenders.

## Alternatives considered

1. **Editable install with pyproject.toml.** Rejected for cost: it's
   real overhead (pyproject.toml, package layout convention, an
   activate step) for a project that fits in one developer's head.
   Right call if the project grows to dozens of contributors; wrong
   call today.

2. **Sub-package layout.** Rejected: requires invoking Manim with
   `manim_wallpaper.scenes.recursive_tree:RecursiveTreeWallpaper`
   style paths, which is harder to remember than
   `scenes/recursive_tree.py RecursiveTreeWallpaper`.

3. **Just PYTHONPATH, no shim.** Rejected because then a contributor
   who runs `manim scenes/foo.py` directly (without `render.sh`)
   gets `ModuleNotFoundError` and has to debug. The shim makes the
   file work standalone.

4. **Just the shim, no PYTHONPATH.** Rejected because the shim is
   ugly and a reader's first thought is "what is this?". Having
   `render.sh` set PYTHONPATH means the shim is *only* there for the
   raw-`manim` case, not the normal case.

## Consequences

- Two lines of boilerplate at the top of every scene file. Acceptable
  cost.
- The project root is implicitly the "Python source root" — anything
  under it can import anything else under it. This works as long as
  `lib/` and `scenes/` are the only top-level directories that get
  imports.
- A future migration to a proper package layout (pyproject.toml +
  `src/manim_wallpaper/`) is straightforward — change two import lines
  per file, delete the shim. Doesn't have to be a big rewrite.
