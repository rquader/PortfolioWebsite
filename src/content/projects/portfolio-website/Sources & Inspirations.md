---
tags: [credits, inspirations]
---

# Sources & Inspirations

> Honest accounting of where the ideas came from. Borrowed wholesale, borrowed in spirit, or built original.

## Self-borrowed (the most important)

### Legendary UI-UX (own work)
- **Path:** `~/Developer/legendaryUI:UX/legendary.html` (~75 KB, single file)
- **Vault:** `<vault>/Programming/Legendary UI-UX/`
- **What was borrowed:** the entire aesthetic position. The lowercase-intimate voice. The "demonstration is the argument" principle. Specific primitives — inertial typography, synesthesia, cursor companion, the warm-paper-on-ink palette. The single-rAF-loop architecture. The "honoured at three levels" `prefers-reduced-motion` handling.
- **What was NOT borrowed:** the four-tab format (this is a scrolling portfolio); the aurora visualiser, the constellation, the mnemonic margin, the audio drone, the reading tide. Those argued things in the manifesto that don't have a home in a portfolio.

### Manim_Wallpaper (own work)
- **Path:** `~/Developer/Manim_Wallpaper/` (Python)
- **Vault:** `<vault>/Programming/Manim_Wallpaper/`
- **What was borrowed:** the recursive_tree_v2 algorithm — DFS-build a flat branch list, forward-pass-resolve world positions per frame, dual-frequency sin sway, 5-pointed leaf polygons, drifting particles. Ported to TypeScript canvas-2D. The FOREST palette. The ADR-style decision-log structure (`decisions/ADR-NNN-*.md`).
- **Ground-truth references rendered 2026-05-17:**
  - `output/finals/05_recursive_tree_v2.mp4` (4.3 MB) — the algorithm in motion. Use to verify the TS port.
  - `output/finals/06_aurora.mp4` (3.4 MB) — second scene rendered for future scene-engine use; not in V1.
- **Vault docs for the rendered scenes:** [[Manim_Wallpaper/wallpapers/05_recursive_tree_v2]] and [[Manim_Wallpaper/wallpapers/06_aurora]].

## External (no code, just spirit or research)

### Cheng Lou — pretext
- **Repo:** https://github.com/chenglou/pretext
- **What we owe it:** the conviction that text geometry can be arithmetic, not the DOM's accident. The synesthesia primitive's word-physics treats letter positions as math, not reflow. We do not import pretext (zero deps); we honor the technique.

### Rimbaud — *Voyelles* (1871)
- **Reference:** the original color-vowel mapping (A black, E white, I red, U green, O blue). The synesthesia primitive's palette diverges from his but exists in his shadow.

### Sean Day — grapheme-color synesthesia statistics
- **Reference:** statistical compilations of self-reports by synesthetes that informed which letters tend to be red/yellow/etc. Used to calibrate the synesthesia palette directionality.

### "ambient animation" body of design writing
- A diffuse tradition (no single canonical author) that argues for low-amplitude, low-contrast motion on web pages — motion as atmosphere rather than feedback. The dual-frequency sway in `recursive_tree_v2` is a direct application of this idea ("layered motion" so a single primitive doesn't read mechanically).

## Technical references (libraries, platforms)

| | what | why credited |
|---|---|---|
| **Astro** | static site generator | the framework; markdown-as-content + zero-JS-default fits the project's constraints. |
| **Cloudflare Pages** | hosting | free, fast CDN, simple custom-domain. |
| **TypeScript** | language | type safety for the primitives, especially the boot/registry layer. |
| **System fonts** | type | "New York" + "SF Mono" on Mac, serviceable fallbacks elsewhere. No web fonts ever (Legendary precedent). |
| **Canvas 2D API** | rendering | for the recursive tree backdrop. WebGL was considered and deliberately avoided (no shader build step). |

## Things deliberately not used (and why)

- **WebGL / fragment shaders for the tree.** Would be richer but adds shader source + a build complexity that fights the simple-is-better posture. (Same reasoning as Legendary's architecture doc.)
- **A CSS framework (Tailwind, etc.).** A portfolio of this size is hand-styleable. Token-CSS-vars are sufficient.
- **A React-ish framework.** Astro's "vanilla DOM + selective hydration" model is exactly what's needed.
- **A heavy 3D library (three.js).** No 3D content.
- **Web fonts.** System fonts give the portfolio the right "this could be a book" feel.
- **External analytics.** No GA, no Plausible, no fingerprinting. (If the user wants visit counts, Cloudflare Pages provides aggregated metrics for free with no client-side script.)

## Future references to track

If/when porting additional scenes from Manim_Wallpaper (aurora, constellation, falling_leaves), credit the corresponding Python source files and any external research those scenes cited. The Manim Aurora doc, for example, has its own credits page (`<vault>/Programming/Manim_Wallpaper/credits/`) that should propagate when the JS port ships.

## see also

- [[01 - Philosophy]]
- [[02 - Architecture]]
- [[Legendary UI-UX/Sources & Inspirations]] — the original credits doc this one descends from
