---
tags: [open-questions, deferred]
---

# Open Questions

> Things deferred, undecided, or needing user input. Each entry has a status and a "what unlocks it" note.

## Awaiting user input

### Portrait photo
- **Status:** **RESOLVED 2026-05-23.** `IMG_6565` is now integrated in the threshold top-right as a "print" treatment with a tree-canvas clearing carved around it. See [[decisions/ADR-013-personal-photo-threshold-print]] for the four-iteration decision narrative and [[specs/2026-05-22-gallery-v2-photo-sticker-design#4.3.10 CURRENT TREATMENT — "print" + tree clearing (rev4 + rev5)|spec §4.3.10]] for the current implementation. The original "fade-to-ink mask" design from [[Concept - Threshold Hero]] was superseded — the deferred-portrait section in that doc is preserved for traceability only.
- **Listed here for the archive.** Move to "resolved" log if/when this file gets a resolved section.

### Tree-photo clearing: static vs dynamic (deferred refinement)
- **Status:** new 2026-05-23. The CSS radial mask that carves a no-tree zone around `IMG_6565` uses static viewport-percentage coordinates (`ellipse 19% 19% at 88% 22%`). It matches the current photo placement but is not derived from the photo element's actual bounding box.
- **What unlocks it:** the photo's placement changes substantially (size, position, orientation) and the clearing visibly desyncs. Then: replace the static gradient with a runtime computation that reads the photo's `getBoundingClientRect()` and writes derived CSS custom properties onto `.threshold-tree` (likely in a small primitive at `src/lib/primitives/photo-clearing.ts`, debounced on resize).
- **Cost of doing it now:** a primitive + ResizeObserver + RAF debounce for what's currently a 6-line CSS gradient. Not worth it until the layout actually changes.
- **See:** [[decisions/ADR-013-personal-photo-threshold-print#Harms / Tradeoffs]].

### Which projects to feature in the gallery
- **Status:** **RESOLVED 2026-05-27.** Seven projects live under `src/content/projects/`: `web-crossword-generator`, `arabic-dialect-map`, `adhkar-counter`, `legendary-ui-ux`, `insta-dm`, `manim-wallpapers`, `portfolio-website`. Sample fixtures removed.

### Bio and DDD story prose
- **Status:** **RESOLVED 2026-05-27.** Copy from user's PDF in `OnMe.astro`, `OnTheWork.astro`. Legendary UI/UX info/story updated separately by user.

### Project cover images and Manim carousel
- **Status:** **RESOLVED 2026-05-27.** All seven projects have GIF/PNG media via `media_items`. Manim carousel ships 10 numbered scenes (`01`–`10`, including phyllotaxis, `09_drift_field`, `10_aurora_subtle`); default slide `05_recursive_tree_v2`. See [[decisions/ADR-019-project-media-carousel]] and [[03 - Content Model#project media (live 2026-05-27)]].

### Per-project media fit tweaks
- **Status:** live 2026-05-27. Arabic Dialect Map stack uses `contain` on screenshot; InstaDM single gif uses `16/9` + `contain`. Further projects needing custom fit → add slug rules in `projects.css` or extend schema (`media_fit`).

### Demo videos (`demo_url` / `cover_video`)
- **Status:** deferred. Schema fields exist; no project sets them yet.
- **What unlocks it:** hosted demo URL or inline video file + frontmatter. See [[03 - Content Model#adding media later]].

### Portfolio site repo URL on the portfolio-website chapter
- **Status:** `github_url` / `web_url` omitted until the repo is public on GitHub Pages.
- **What unlocks it:** user publishes repo and adds URLs to `portfolio-website/_index.md`.

### Audio?
- **Status:** the user did not ask for audio. Legendary has a quiet drone with a consent toggle. For a portfolio it would feel performative.
- **What unlocks it:** user requests it. Default is **no audio** unless asked.

### Domain / hosting destination
- **Status:** Cloudflare Pages chosen ([[decisions/ADR-002-hosting-cloudflare-pages]]). Subdomain or custom domain TBD.
- **What unlocks it:** user decides on a domain (e.g., `rafanquader.dev`, `rafanquader.com`, or just the auto-assigned `*.pages.dev` URL).

## Recently surfaced (2026-05-17)

### persistent MP4 backdrops vs canvas (tier-2 evaluation)
- **Status:** floated by user 2026-05-17 in the context of "we can consider persistent Manim backdrops that can serve as backdrops throughout the page." V1 keeps canvas per [[decisions/ADR-004-tree-backdrop-canvas-vs-mp4]]; MP4 backdrop persistence is a tier-2 path.
- **What unlocks it:** the canvas port is built and verified, then evaluated. If it visually disappoints relative to the Manim MP4 reference (which now exists at `~/Developer/Manim_Wallpaper/output/finals/05_recursive_tree_v2.mp4`), reconsider MP4.
- **Tradeoff matrix:** see [[decisions/ADR-004-tree-backdrop-canvas-vs-mp4#tier-2 option: persistent mp4 backdrops]].
- **Probably skip permanently if:** the canvas port looks ~95% as good as the MP4 (likely). Then MP4-backdrop never becomes worth the weight.

### the threshold IS the opener
- **Status:** clarified 2026-05-17. The user described "openers" as "the canvas port version that you can scroll up to, basically opening the tab and you can scroll down from there into the tab." That is exactly the [[Concept - Threshold Hero|threshold]] — a section at the top of the page, scrollable down from, scrollable up back to, with the canvas tree as backdrop.
- **What this means:** no separate "opener" section is needed. The threshold covers it. The earlier momentary direction toward a pre-threshold MP4 intro is dropped.
- **Resolved.** Listed here for traceability.

### per-section backdrops (tier-2 design exploration)
- **Status:** surfaced 2026-05-17 evening when the user clarified that backdrops are *more than openers* — they sit persistently behind body content with subtle animation. Currently the design has backdrops only on threshold (low-opacity tree) and on-recursion (full-opacity tree). User opened the door to having a subtle backdrop on more or all sections.
- **What was designed in response:** a v3 backdrop family in the Manim repo. See [[Manim_Wallpaper/08_backdrop_concepts]]. Three concepts:
  - **Network nodes** ([[Manim_Wallpaper/wallpapers/07_network_nodes]]) — sparse graph + occasional message dots. Coded and rendered. Tied thematically to the "on the work" section (DDD research).
  - **Drift field** — minimal particles-only fallback. Coded as stub, unrendered.
  - **Subtle aurora variant** — top-of-frame restrained aurora. Stub config; needs an `aurora.py` refactor to render.
- **Proposed per-section assignment** (the user picks):

| section            | proposed backdrop                  |
|--------------------|------------------------------------|
| threshold          | recursive_tree_v2 (canvas, low op) |
| on me              | drift field (canvas port)          |
| on the work        | **network nodes** (canvas port)    |
| on the artifacts   | drift field or none                |
| on recursion       | recursive_tree_v2 (canvas, full)   |
| on the trail       | drift field or none                |
| coda               | drift field at minimum opacity     |

- **What unlocks shipping this:** decision by user to expand the V1 scope from "tree-only backdrop" to "per-section backdrops." Each new scene requires a canvas port effort (similar to the recursive_tree port — ~200–300 lines TS per scene). Reasonable to ship tree-only for V1 and add network-nodes in V1.1.
- **Consequence for [[decisions/ADR-006-aesthetic-primitives-inherited-and-cut]]:** the cuts there were specifically about *foreground* primitives. Backdrop use is a separate question; aurora and constellation-style scenes may legitimately appear as passive backdrops without contradicting that ADR's reasoning. A future ADR (ADR-007 if needed) can lock the per-section-backdrop decision.
- **Tradeoffs of going wide on this:**
  - **Pros:** each section gets visual identity; reinforces "the medium is the argument" beyond just the tree; signals craft.
  - **Cons:** more JS to maintain (one canvas port per scene); more CPU per page (multiple primitives running, gated by visibility); risk of the site feeling busy if even one backdrop is too active for its section.

## Design decisions to revisit after first paint

### live-parameter knobs (on recursion tab)
- **Status:** described in [[03 - Content Model#on recursion]] as optional.
- **Recommendation:** ship the section *without* sliders first. Add after baseline works.
- **Why deferred:** the sliders are nice but a tier-2 feature; getting the tree, the annotation, and the layout right is tier 1.
- **What it would look like:** range inputs styled to match the warm-dark palette, three knobs: `MAX_DEPTH` (5–10), `BRANCH_ANGLE` (18–35°), `LENGTH_SHRINK` (0.65–0.82). Each writes to the tree's params and triggers a rebuild.

### Inertial typography on touch devices
- **Status:** Legendary's inertial typography is pointer-driven; touch doesn't have hover. Currently degrades to "no effect" on touch.
- **Recommendation:** ship as-is; revisit if mobile feedback suggests the headings feel inert.
- **What it could become:** scroll-velocity-driven instead of pointer-driven on touch, so the letters wobble on scroll. Would need a different physics tuning.

### Phosphor touch trail
- **Status:** I left this in as "optional, may include later" in [[01 - Philosophy]] and the architecture. Not in the V1 build.
- **Recommendation:** decide after first paint. If the site feels too quiet, add subtle phosphor trail. If it feels right, leave out.

### Live read of vault as an OPTIONAL build-time path
- **Status:** rejected for V1 ([[decisions/ADR-003-content-pipeline-curated-not-vault-link]]).
- **Revisit if:** the manual cleaning pipeline becomes a chore (>10 min per project refresh). Then consider a build-time read with a strict allowlist and a public-only flag in the vault notes' frontmatter.

### Cursor companion mobile behavior
- **Status:** Legendary hides the companion on touch (pointer-mode: coarse). Same here.
- **What it could become:** a touch-equivalent ambient pulse (e.g., a faint radial ripple at touch points). Not in V1.

## Quietly unsolved

### Inertial-type accessibility for keyboard-only users
- The pointer-driven physics has no keyboard equivalent. A keyboard user gets a static heading. Legendary noted the same in its Open Questions and never resolved it.
- **Possible future:** a focus-trap on a heading + arrow-key nudge. Niche; defer.

### Reduced-motion behavior of the tree
- **Status:** the tree's sway is disabled under `prefers-reduced-motion`, but the tree still renders (static). This is the right default.
- **Verify:** is a static tree image acceptable, or does it want to be hidden entirely under reduced motion? Probably acceptable. Verify with user once shipped.

### Cover-image-less projects
- Some projects don't have a screenshot worth showing (e.g. backend-only experiments).
- **Plan:** the manila folder degrades to a graphical pattern (using the project's accent color) if `cover_image` is absent. Tier-2 detail.

## Resolved

- **Should the tree be a video or live code?** Live code (canvas port). [[decisions/ADR-004-tree-backdrop-canvas-vs-mp4]].
- **Should the gallery live-read the vault?** No. [[decisions/ADR-003-content-pipeline-curated-not-vault-link]].
- **Astro vs single-file vs Vite-vanilla vs Next?** Astro. [[decisions/ADR-001-tech-stack-astro]].
- **GH Pages vs CF Pages vs Vercel vs Netlify?** CF Pages (GH Pages as documented fallback). [[decisions/ADR-002-hosting-cloudflare-pages]].
- **Phyllotaxis as a scene?** No — user said *"I don't really like the phyllotaxis."*
- **Memory or Obsidian as source of truth for project context?** Obsidian. [[Working Agreements#5. Memory mirroring policy]].
