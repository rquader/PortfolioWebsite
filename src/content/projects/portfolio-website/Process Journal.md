---
tags: [diary, process]
---

# Process Journal

The chronological diary. Not edited for posterity. Mirrors the pattern in [[Legendary UI-UX/Process Journal]] and [[Manim_Wallpaper/03_process_log]].

---

## 2026-05-17 · late evening · alignment

The user opened a Claude Code session in `~/Developer/Portfolio_Website` (empty folder). The brief, condensed: *make an impressive portfolio, photo of upper body dimming into the site, school + research, manila-folder Obsidian-like gallery of small projects, modular & senior-eng-reviewable, document the process in Obsidian.*

He pointed at three reference bodies of work:

- His Legendary UI-UX project (`~/Developer/legendaryUI:UX/legendary.html` + `<vault>/Programming/Legendary UI-UX/`) — the aesthetic anchor. I read the manifesto's Philosophy, Architecture, and Concept-Synesthesia docs, plus the Process Journal. The voice — lowercase, intimate, "demonstration is the argument" — became the obvious starting point.
- His resume PDF — Reed Systems Group / DDD research, 3.83 GPA, started SJSU in Aug 2025.
- His Manim_Wallpaper project (`~/Developer/Manim_Wallpaper/` + the vault docs) — generative wallpapers, FOREST palette, the `recursive_tree_v2.py` scene. He suggested using one as a site backdrop, "maybe literally a version of recursive_tree_v2."

**First pass at a position.** A portfolio that inherits Legendary's voice but actually functions as a portfolio. Same warm-dark room, same restraint. Where the manifesto asks "what if a page had a pulse?" — this one asks "what if a portfolio could be read like an essay?" Captured in [[01 - Philosophy]].

**Tech.** Astro + TypeScript, Cloudflare Pages (free, free CDN). No React, no Tailwind, no third-party UI. The hand-written-CSS + canvas-2D primitives approach from Legendary, just modularized. See [[decisions/ADR-001-tech-stack-astro]] and [[decisions/ADR-002-hosting-cloudflare-pages]].

**Aesthetic primitives.** Inherited: inertial typography, synesthesia (scoped — not its own tab, just the goals paragraph), cursor companion, optionally phosphor. Cut: aurora, constellation, mnemonic margin, audio drone, reading tide. See [[decisions/ADR-006-aesthetic-primitives-inherited-and-cut]] for why each.

**The tree decision.** Big call: port `recursive_tree_v2.py` to TypeScript/canvas-2D, NOT embed the rendered MP4. Reasons in [[decisions/ADR-004-tree-backdrop-canvas-vs-mp4]] — but the headline is that a *live* recursive tree on a CS-student's portfolio is the medium-as-argument principle applied literally. ~10 KB JS beats ~3.6 MB MP4. Plus it can recolor per section and resize fluidly.

User confirmed: hero backdrop (low opacity) + dedicated "on recursion" tab (full opacity, with annotation, optional live parameter sliders). Engine designed so future scenes (aurora, constellation, falling_leaves) can be dropped in. NOT phyllotaxis ("I don't really like the phyllotaxis"). Captured in [[decisions/ADR-005-tree-role-and-scene-engine]].

**Content pipeline.** The user does not want the site to read from his vault. So a separate pipeline (documented in [[04 - Content Pipeline]] and runnable by a cheaper model like Haiku) takes a vault project folder and produces a cleaned site-repo folder. User reviews the diff. Reasons in [[decisions/ADR-003-content-pipeline-curated-not-vault-link]].

**Photo.** Deferred. Design the threshold so a portrait drop-in is a single-file edit with a pre-built fade-to-ink mask. See [[Concept - Threshold Hero]].

**Working agreement.** The user emphasized: every non-trivial decision needs an Obsidian ADR with explicit benefits / harms / future considerations. He's seen this pattern work in his Manim_Wallpaper `decisions/` folder. I made this canonical in [[Working Agreements#1. Tradeoff documentation is mandatory]] and the corresponding memory entry.

**Memory mirroring.** Later in the same session, the user surfaced an important durability concern: he might continue this project from a different Claude account, a different machine, or another agent entirely. Claude memory is per-account/per-machine. So policy is now: anything in memory is also in Obsidian; **Obsidian is canonical**. Memory files become short summaries with a pointer to the canonical doc. Mirror map lives in [[Working Agreements#5. Memory mirroring policy]] and in the memory index. Created `[[Author Profile]]`, [[Working Agreements]], [[Reference - Paths]] to capture what was in memory.

**Statusline.** A side-detour: the user invoked `/statusline` mid-conversation; a statusline-setup subagent built a clean default (cwd · model · context %) and dropped it in `~/.claude/statusline-command.sh`. Mentioned for completeness; not portfolio scope.

**What I'm doing next session-tonight.** Finishing the Concept docs (Threshold Hero, Inertial Headings, Synesthesia Goals, Cursor Companion, Manila Folder Gallery, Recursive Tree Backdrop) and the six ADRs. Then scaffolding the actual repo (`~/Developer/Portfolio_Website/`) with Astro and the rAF-loop primitive engine.

**What I'd flag to the user before the first PR.**
- The placeholder bio is mine, not his — he must rewrite (see [[03 - Content Model#on me]]).
- The placeholder DDD story is mine — same caveat.
- The list of projects to feature in the gallery (see [[03 - Content Model#initial gallery roster]]) — final pick is editorial. I have candidates but no final ordering.
- Possible feature creep: live-parameter sliders on the "on recursion" tab. Cool, but I'd build the section without them first and add them after a working baseline. Tracked in [[Open Questions#live-parameter knobs]].

---

## 2026-05-17 · later evening · two corrections from the user

After I'd written the first batch of docs (00–04 Index/Philosophy/Architecture/Content Model/Content Pipeline + Working Agreements + Author Profile + Reference Paths + Process Journal + Open Questions + Sources & Inspirations + decisions index), the user pushed back on two things:

1. **Tone of the Philosophy doc.** My one-liner — *"a portfolio that does not feel like a portfolio — that reads more like one of my Obsidian notes opened in public"* — was wrong. The user wanted a portfolio that's actually impressive and cool first, with literary discipline on top, not "this isn't really a portfolio." Rewrote [[01 - Philosophy]] to be practical-first, with the Legendary aesthetic as starting point (not gospel) and explicit acknowledgement that much of Legendary's prose was earlier-AI-generated and not the user's authoritative voice.

2. **No synthetic body copy in his voice.** I'd written placeholder bio prose, a placeholder DDD story, and a placeholder "on recursion" annotation that sounded like him. The user said don't — he wants to write his own words. Replaced all three with marker-style `[PLACEHOLDER — your bio here, ~80–120 words]` directives in [[03 - Content Model]]. Added [[Working Agreements#7. The user writes all live-site body copy]] as a durable rule and a corresponding feedback memory.

Also explained how Claude memory works (per-account/per-machine) and changed policy: **anything in memory also gets an Obsidian mirror, Obsidian canonical**. Created [[Author Profile]], updated [[Working Agreements]], created [[Reference - Paths]]. Memory files now point at their canonical Obsidian docs. See [[Working Agreements#5. Memory mirroring policy]].

What I'm doing next: writing the remaining Concept docs (Threshold Hero, Inertial Headings, Synesthesia Goals, Cursor Companion, Manila Folder Gallery, Recursive Tree Backdrop) and the six ADRs. Pacing — these will be more concise than the first batch; the literary register I borrowed from Legendary was over-deployed.

---

## 2026-05-17 · later that night · Manim renders + cross-vault wikilinks

User came back to ask: render v2 Manim scenes for use with the portfolio, work on incomplete ones, "tab backgrounds or opening sections to show that then scroll into the page," symlink as needed, update Manim docs. Said "one pass."

**What I did:**

- Rendered `~/Developer/Manim_Wallpaper/scenes/recursive_tree_v2.py` → `output/finals/05_recursive_tree_v2.mp4` (4.3 MB, 12s loop).
- Rendered `~/Developer/Manim_Wallpaper/scenes/aurora.py` → `output/finals/06_aurora.mp4` (3.4 MB, 12s loop).
- Did NOT render: `golden_hour_mountains` or `wildflower_meadow` — neither exists as Python code. Both have design docs in `<vault>/Programming/Manim_Wallpaper/07_v2_concept_design.md` but coding them was out of scope for one pass.
- Created Manim vault docs: [[Manim_Wallpaper/wallpapers/05_recursive_tree_v2]], [[Manim_Wallpaper/wallpapers/06_aurora]].
- Updated [[Manim_Wallpaper/00_index]] with v2 wallpapers section + a sibling-project reference back to this portfolio.
- Appended a section 9 to [[Manim_Wallpaper/03_process_log]] documenting the v2 renders.

**The two mid-session corrections:**

1. **I overreached by symlinking the MP4s into `~/Developer/Portfolio_Website/public/videos/`.** That contradicts [[decisions/ADR-004-tree-backdrop-canvas-vs-mp4]]. The user caught it: *"hold up why is there public/videos if you were doing the light-weight version of the backdrops??"* Reverted the symlinks. The MP4s live exclusively in the Manim repo.
2. **"Symlink as needed" meant Obsidian wikilinks, not filesystem symlinks.** I'd misread the ask entirely. The right interpretation is: knit Manim docs ↔ Portfolio docs together with `[[wikilinks]]` so each project's docs can reference the other. Done — the Manim v2 wallpaper docs link back to this portfolio's Concept and ADR docs; this portfolio's Recursive Tree Backdrop Concept doc points at the v2 wallpaper as the source-of-truth algorithm.

**The clarified mental model after the back-and-forth:**

- The "opener" the user described — *"the canvas port version that you can scroll up to, basically opening the tab and you can scroll down from there into the tab"* — IS the threshold. It's a normal document-flow section with the canvas tree backdrop, positioned at the top, scrollable down from, scrollable back up to. Nothing new needed.
- The MP4 renders are reference artifacts for the JS port (verify the canvas matches the Manim ground truth), not site content.
- The user has floated *persistent MP4 backdrops throughout the page* as a tier-2 idea worth keeping on the table. Documented as such in [[Open Questions#persistent mp4 backdrops vs canvas (tier-2 evaluation)]] and in the updated [[decisions/ADR-004-tree-backdrop-canvas-vs-mp4#tier-2 option: persistent mp4 backdrops]].

**Updated portfolio docs in this session:**

- [[decisions/ADR-004-tree-backdrop-canvas-vs-mp4]] — added a 2026-05-17 status update with the tier-2 tradeoff matrix.
- [[Open Questions]] — added the persistent-MP4 evaluation entry and the "threshold IS the opener" resolution.
- [[Concept - Threshold Hero]] — clarified that the threshold IS the opener (scroll-down-from / scroll-up-to behavior).
- This Process Journal entry.

**Status at end-of-session:**

- All Obsidian docs (Manim + Portfolio) reflect the agreed model.
- The site code repo remains intentionally empty except for `README.md`.
- The next agent (or future Rafan) can pick up from [[06 - Next Agent Handoff]] → [[05 - Bootstrap Guide]] without context loss.
- Memory state mirrored to Obsidian per [[Working Agreements#5. Memory mirroring policy]].

---

## 2026-05-17 · late · v3 backdrop family

Continuing on the same day. User opened a new direction: the backdrops aren't just *openers*, they sit persistently behind text on every section. With subtle animation. *"What works subtly with other nodes or designs or things in front of them?"*

This is a meaningful re-think. A backdrop has different constraints than a wallpaper:
- Center of frame must be quiet (where body text lives).
- Motion amplitudes an order of magnitude lower than wallpaper.
- Negative space dominates.
- Per-section content can shape the backdrop's content.

**What I built:**

1. **[[Manim_Wallpaper/08_backdrop_concepts]]** — a design conversation doc covering three new backdrop concepts (network nodes, drift field, subtle aurora variant), with the constraint matrix wallpaper → backdrop.
2. **`scenes/network_nodes.py`** + render (`output/finals/07_network_nodes.mp4`, 456 KB) — the most novel of the three. Sparse graph of 16 nodes, low-opacity edges fading in/out, occasional "message" dots traversing edges on a deterministic schedule. Themed for the DDD research section: the visual is a distributed-system graph with intermittent message delivery.
3. **`scenes/drift_field.py`** — stub of the minimal-most backdrop concept (just slowly drifting particles). Coded but not rendered this pass.
4. **`scenes/aurora_subtle.py`** — stub config for a tier-2 subtle aurora variant (top-of-frame, restrained, no stars). Not directly runnable without an aurora.py refactor.
5. **Manim doc additions:** [[Manim_Wallpaper/wallpapers/07_network_nodes]], updated 00_index and process_log.

**What this means for this portfolio:**

- **The V1 design is unchanged.** Threshold + on-recursion tree only; no V1 ship of per-section backdrops.
- **A V1.1 direction now exists.** [[Open Questions#per-section backdrops (tier-2 design exploration)]] holds the proposal: each section gets a content-appropriate backdrop, with the network_nodes scene as the proof of concept that "match the visual to the section's content" is achievable in this aesthetic.
- **[[decisions/ADR-006-aesthetic-primitives-inherited-and-cut]] got a clarification.** The cuts of aurora and constellation as *primitives* (foreground, interactive) don't necessarily apply to *backdrop* use (passive, atmospheric). I updated those two entries inline. The original V1 reasoning still holds; backdrop use is a separate question.

**The session's pattern so far:**

The user has redirected my interpretation of his asks twice today, and both redirections were valuable corrections:

1. **"Symlink as needed"** meant Obsidian wikilinks, not filesystem symlinks. I'd put MP4s in the site repo prematurely.
2. **"Background opener"** meant a section *at the top* (the threshold), not a play-once intro. Then later, *"backdrops that work behind content"* — meaning backdrops are persistent across the page, not just the top.

The recurring lesson: when the user uses words like "symlink," "opener," "backdrop," I should ask what they mean *in this project's context* rather than reaching for the technical default. The discipline going forward: clarify before executing on terms that have multiple plausible readings.

**Status at end-of-session:**

- All Manim work in place: v1 (4 rendered), v2 (2 rendered: tree-v2 + aurora), v3 (1 rendered: network_nodes; 2 stubbed: drift_field + aurora_subtle).
- All Portfolio Obsidian docs reflect the corrected mental model.
- The site code repo remains intentionally empty except for `README.md`.
- The next session can pick up from [[06 - Next Agent Handoff]] → [[05 - Bootstrap Guide]].
- Memory state mirrored to Obsidian per [[Working Agreements#5. Memory mirroring policy]].

---

## 2026-05-17 · early afternoon · Phase 1 — Astro skeleton + tree backdrop port

First code session. Picked up from [[06 - Next Agent Handoff]]. The site repo went from "empty + README" to "Astro skeleton + scaffolded layout + working recursive tree backdrop port, type-checked and dev-server-verified."

**Permissions / autonomy setup (per user request to enable an uninterrupted block):**

- Walked the user through the bash patterns I'd need (`npm install`/`build`/`dev`, `lsof`, `pkill -f astro`, `curl http://localhost:4321/*`, `mkdir -p`) and the file-write scopes (site repo, Obsidian docs, memory).
- The user wanted the new bash permissions session-only, NOT persistent. Reverted my initial settings.local.json additions; relied on runtime "session" approvals for each new pattern as it fired.
- **One thing did get persisted to `.claude/settings.local.json`** at user direction: a PostToolUse `Bash` hook that appends every Bash command this project runs to a new Obsidian-side log at `Bash Log.md` (top-level of this docs folder, auto-created). Helper script: `~/Developer/Portfolio_Website/.claude/hooks/log-bash.py`. After the first iteration, enhanced it to add a "_added N packages_" detail line for `npm install` commands specifically — and retroactively enriched the existing entry.

**Departure from the Bootstrap Guide that I want flagged:**

- `05 - Bootstrap Guide` step 1 says use `npm create astro@latest -- --template minimal --typescript strict --install --git`. I **hand-wrote** the four-file minimal skeleton instead (`package.json`, `tsconfig.json`, `astro.config.mjs`, `src/pages/index.astro` placeholder) and ran `npm install`. Reason: the official create command is interactive (can prompt unpredictably) and refuses non-empty directories — and the repo already had `README.md`, `.claude/`, `public/` to preserve. Same end state, deterministic. Not ADR-worthy (both paths produce the same Astro 5.x skeleton), but logging the deviation here.

**What's now in the site repo:**

| layer | files |
|---|---|
| skeleton | `package.json`, `tsconfig.json` (extends `astro/tsconfigs/strict`, path alias `~/* → src/*`), `astro.config.mjs`, `.gitignore`, `src/env.d.ts` |
| layout | `src/layouts/Base.astro` — wires tokens + global CSS, adds skip-link, starts the rAF loop via `boot.startBoot()` |
| tokens / globals | `src/styles/tokens.css` (warm-paper-on-ink palette + FOREST tones + type + layout), `src/styles/global.css` (resets, body baseline, `prefers-reduced-motion` CSS gate) |
| rAF infrastructure | `src/lib/boot.ts` (single rAF, `registerTick(fn)`, dt clamped to 50ms, loop stops entirely under reduced motion via `onReducedMotionChange`), `src/lib/reduced-motion.ts` (live media-query read + change-subscribe) |
| recursive tree backdrop | `src/lib/backdrop/{rng,easing,palettes,tree-algorithm,leaf,particle,tree,scenes}.ts` — full port of `recursive_tree_v2.py`. Manim-native coordinates throughout (origin at frame center, +y up); the canvas adapter (`makeCanvasMap` in `tree.ts`) flips y only at the draw call. Keeps the math 1:1 with the Python source. DPR-aware sizing via `ctx.setTransform(dpr,…)`. Resize via `ResizeObserver` (rebuilds at new dimensions, keeps seed → tree identity preserved). |
| component scaffolds | `src/components/Threshold.astro`, `OnMe.astro`, `OnTheWork.astro`, `OnTheArtifacts.astro`, `OnRecursion.astro`, `OnTheTrail.astro`, `Coda.astro`, `ProjectCard.astro` — placeholder-only bodies, marker-style per Working Agreement 7. The OnTheTrail coursework + tools lists are filled from [[Author Profile]] (facts, not voice). The Coda's tagline is verbatim from [[Author Profile#Stated objective]]. The Coda's contact links are public facts. |
| primitive stubs | `src/lib/primitives/{inertial-type,synesthesia,cursor-companion}.ts` — header docstrings + `export {}`. Implementations land in Bootstrap steps 3.3 / 3.6 / 3.7. |
| content collection | `src/content/config.ts` — Astro 5 `glob` loader pointing at `src/content/projects/**/index.md` with the schema from `02 - Architecture#content collection schema`. Empty until projects are populated via [[04 - Content Pipeline]]. |
| test page (dev-only) | `src/pages/test-tree.astro` — full-bleed canvas mounting the tree at full opacity. **DELETE BEFORE DEPLOY.** |

**Verification status:**

- ✅ `npm run build` clean (one expected `glob-loader` warning for the empty projects collection).
- ✅ `npm run check` (= `astro check`) — 0 errors / 0 warnings / 0 hints across 27 files under TS strict.
- ✅ Dev server boots in ~190 ms, serves `/test-tree` with HTTP 200 (6.6 KB). HTML contains the `<canvas>` element with the right id/class and both module scripts wired (Base.astro's boot + test-tree's `mountTree` call).
- ⚠ **Visual fidelity vs. Manim reference is NOT verified.** I can't see the canvas pixels from a headless shell. User needs to run `npm run dev` and open `http://localhost:4321/test-tree`, then eyeball against `~/Developer/Manim_Wallpaper/output/finals/05_recursive_tree_v2.mp4`. Acceptance criterion (from [[Concept - Recursive Tree Backdrop#verification]]): same tree shape from seed=42, same dual-frequency sway profile; canvas-vs-Manim antialiasing differences are fine.

**What's NOT done in Phase 1 (deferred to subsequent steps):**

- Cursor companion primitive (Bootstrap step 3.3).
- Inertial typography primitive (3.6).
- Threshold composition (3.5) — depends on the tree (now ready).
- Synesthesia primitive (3.7).
- DDD card styling / Manila gallery JS / scroll-spy / nav.
- Any live-site body copy. Marker-style placeholders only.
- Git init / commits — deferred to the user (per Claude Code default).
- Cloudflare Pages setup — deferred until first ship-candidate.

**What I'd flag to the user before they pick up next:**

- **The test page renders structurally; eyeball the visual against the Manim MP4** when convenient. If the canvas port looks ~95% as good as the MP4, the V1 plan (canvas everywhere) holds and the tier-2 MP4 path in [[Open Questions#persistent mp4 backdrops vs canvas (tier-2 evaluation)]] can probably be closed.
- The Astro 5.18.1 install warned about a 6.x being available. Sticking with 5.x; revisit when the project is closer to ship.
- `npm audit` mentioned 6 moderate vulnerabilities (transitive dev deps). Not blocking; can be addressed at the same time as the 6.x upgrade decision.
- The dev-only `src/pages/test-tree.astro` ships a route at `/test-tree` if not removed. Reminder to delete it before the first production deploy.

**Memory mirror:** updated `project_portfolio_website.md` with a one-liner that points back to this entry as the latest state. No other memory changes.

---

## 2026-05-17 · late afternoon · Phase 2 — primitives, threshold composition, full single-page scroll

Continuing the same day after the user confirmed Phase 1's tree backdrop renders cleanly in the browser. The push this block: finish the remaining client-side primitives and compose every room so the site is one continuous scroll.

**New code:**

| layer | files |
|---|---|
| primitives (filled from stubs) | `src/lib/primitives/cursor-companion.ts` (fixed-position dot + breathing ring with one-frame lag, hidden on touch, accent via `--companion-color`), `src/lib/primitives/inertial-type.ts` (per-letter spring physics; supports both explicit `data-inertial` spans and a `data-inertial-text` auto-split attribute; IntersectionObserver-gated), `src/lib/primitives/synesthesia.ts` (hover-coloring on `[data-syn-word]` words, room-tint via `--syn-r/g/b` CSS vars + `.syn-tinted` class with 1.2s transition) |
| scroll-spy | `src/lib/scroll-spy.ts` (new) — IntersectionObserver picks the most-visible `[data-section-id]`, writes the slug to `html[data-section]`, and toggles `.is-current` on `[data-nav-link]` anchors. Active-nav highlight is CSS-driven from that class. |
| site-init | `src/lib/site-init.ts` (new) — single client entry point called from `Base.astro`'s `<script>`. `startBoot()` + each primitive's `init…`, each a no-op when its target markup is absent. |
| nav | `src/components/TopNav.astro` (new) — fixed top-nav with anchor links to each room, hidden < 720px. Bordered active link uses `--companion-color` so it stays in sync with the scroll-spy. |
| threshold composition | `src/components/Threshold.astro` (full) — lowercase name in two `data-inertial-text` block-spans, verbatim tagline, optional portrait (auto-discovered at build time via `fs.readdirSync` on `public/images/portrait.*`), low-opacity tree backdrop, scroll cue. Style in `src/styles/threshold.css`. |
| other rooms | `OnMe.astro` (synesthesia placeholder with two demo `data-syn-word` spans + scoped on-me/.syn-tinted bg-tint CSS), `OnTheWork.astro` (DDD card with left-accent border), `OnTheArtifacts.astro` (auto-discovers from content collection; empty-state PLACEHOLDER if no projects), `ProjectCard.astro` (real component reading `CollectionEntry<'projects'>`), `OnRecursion.astro` (full-bleed tree at opacity 1.0 + ink-blurred annotation overlay), `OnTheTrail.astro` (coursework/tools grids + how-I-work placeholder + resume link), `Coda.astro` (verbatim tagline + contact list + closing placeholder). All have `data-section-id` for scroll-spy and `data-inertial-text` on the h2. |
| index | `src/pages/index.astro` — Base + TopNav + the seven rooms in scroll order. |
| styles | `src/styles/tokens.css` (per-section `--companion-color` map keyed off `:root[data-section]`), `src/styles/global.css` (`.section` baseline + inertial-letter inline-block + full cursor-companion CSS), `src/styles/threshold.css` (filled), `src/styles/manila-folder.css` (filled — closed-state cards only; reading panel deferred), `src/styles/on-recursion.css` (filled) |
| dep | `npm install -D @types/node` — needed for the `fs.readdirSync` build-time portrait check in `Threshold.astro`. |

**Verification:**

- ✅ `npm run check` (`astro check`) — 0 errors, 0 warnings, 0 hints across 31 Astro/TS files.
- ✅ `npm run build` — 2 pages built. Total client JS: ~13 KB raw, ~6 KB gzipped. (Budget: under 50 KB compressed → comfortably under.)
- ✅ Dev server: both `/` (40 KB HTML, all 7 sections present, both tree canvases present, nav present) and `/test-tree` (9.7 KB) serve HTTP 200, no warnings beyond the expected empty-collection notice.
- ⚠ Visual / interaction verification still needs human eyes. The big ones to spot-check when convenient:
  - Threshold name letters wobble on hover (inertial typography).
  - Hovering "meaningful" or "nudging" in the on-me placeholder tints the section + ignites letters (synesthesia).
  - Cursor companion: small dot + breathing ring follows pointer; colour shifts on scroll between sections.
  - Top-nav link highlight tracks the visible section.
  - Both trees: low-opacity behind threshold, full-bleed on `/on-recursion`.

**Decisions taken in this block (none warranted a full ADR):**

- Portrait auto-discovery uses `fs.readdirSync` at build time (Node `process.cwd()`). Alternatives considered: `import.meta.glob` (doesn't work for `public/`), hard-coded filename (would force a specific extension). The fs approach lets the user drop *any* of `portrait.{avif,webp,jpg,jpeg,png}` and have it pick up. Trivial enough to log here, not ADR-worthy.
- Active nav-link state uses a JS-managed `.is-current` class, NOT a CSS cascade from `:root[data-section]`. Reason: Astro per-component scoped styles add `[data-astro-cid-X]` to compound selectors and break `:root [.class]` cascades that cross component boundaries. JS toggle is simpler and reliable.
- Inertial typography supports both explicit `data-inertial` spans (verbose, unambiguous) and a `data-inertial-text` wrapper (terse). Hero name uses the wrapper form; section h2s also use it.

**What I'd flag for the user:**

- **Astro 6.x available.** Sticking with 5.18.1 for now; revisit when the site is closer to ship and dependencies have settled.
- **`npm audit` 6 moderate vulns** still present (transitive dev deps). Not blocking; can be addressed at the same time as the 6.x upgrade.
- **The Manila gallery card visuals exist but the reading panel + accordion don't.** Clicking a project card currently navigates to `#project-<slug>` (a no-op anchor since the target doesn't exist). Bootstrap step 3.9 will fill in the slide-up panel.
- **`src/pages/test-tree.astro` is still in the build.** Routes at `/test-tree`. Delete before deploy (or wrap with `import.meta.env.DEV`).
- **The portrait is still deferred** — drop `public/images/portrait.{avif,webp,jpg,jpeg,png}` and the threshold will pick it up automatically on next build.
- **Body copy placeholders still everywhere** — bio (`OnMe.astro`), DDD story (`OnTheWork.astro`), how-I-work (`OnTheTrail.astro`), recursion annotation (`OnRecursion.astro`), Coda closing line. User's to fill in.

**What's left from the original Bootstrap Guide:**

- 3.9: Manila gallery reading-panel + field-note accordion (visuals done, interaction not).
- Final visual polish across sections (some sections may need spacing/typography tweaks once content is in).
- Cloudflare Pages deploy + custom-domain setup (deferred until ship-candidate).
- Deletion of `src/pages/test-tree.astro` (pre-deploy).
- First content-pipeline run for any project the user wants to feature ([[04 - Content Pipeline]]).

**Memory mirror:** updated `project_portfolio_website.md` to reflect Phase 2 completion. Pointer-only.

---

## 2026-05-17 · evening · Phase 3 — gallery interaction, sliders, Legendary hover-colour, polish

Continuing into a third block after the user opened the site, said *"OOH I love the test-tree"*, then *"add some of the colors from legendary ui/ux like when you hover over with the colors… the goal primarily is to look clean and look cool. I really like the text wobbling and all that, pretty cool job so far!"*. Two tracks this block: finish the remaining Bootstrap items + add the Legendary letter-colour reveal the user explicitly asked for.

**New code:**

| layer | files |
|---|---|
| manila gallery interaction | `src/components/ReadingPanel.astro` (new — slide-up overlay rendered outside `<main>` so the manila primitive can `inert` main while open; each project's article statically rendered via `render(entry)` and toggled with `hidden`), `src/lib/primitives/manila.ts` (new — handles open/close/escape/url-hash; uses `inert` for focus-trap so no JS focus-loop), full reading-panel CSS in `manila-folder.css`. URL is `#project-<slug>` when open; direct links open the right project on cold load. |
| sample project | `src/content/projects/sample/index.md` — a clearly-marked placeholder so the gallery renders something. Schema-conformant. Marked for deletion in the body. |
| meta / polish | `src/pages/404.astro` (warm-dark "wrong room" page), inline SVG favicon in `Base.astro` (the "rq" mark on the FOREST ink tone), OG / Twitter meta in `Base.astro`, `public/robots.txt`, `@astrojs/sitemap` integration in `astro.config.mjs` (filters out `/test-tree`). |
| live-parameter sliders | Three range inputs in `OnRecursion.astro` (depth 5–10, angle 14–40°, shrink 60–85%) that mutate the tree in real time via the existing `TreeHandle.setOverrides()` API. Slider styling in `on-recursion.css`. Setting depth also updates `LEAF_DEPTH_MIN` so the leaves stay attached to the canopy. |
| Legendary hover-colour | `src/lib/palette/syn-colors.ts` (new — the 26-letter Rimbaud/Sean-Day palette, shared by synesthesia + inertial-type), `inertial-type.ts` extended with proximity-based colour reveal on elements marked `[data-color-letters]` (flashlight-style, 60 px radius — smaller than the wobble radius so it feels selective). CSS transition handles the fade; only edge-transitions are written, so the tick doesn't thrash the DOM. Applied to: hero name + every section h2. |
| polish | Scroll-driven progress bar (CSS-only, `animation-timeline: scroll(root block)`; quietly degrades on browsers without scroll-driven animations support), global `:focus-visible` outline keyed off `--companion-color`, full `@media print` ruleset that strips ambient chrome and forces black-on-white, fade-in animation on both tree canvases on initial load, `content-visibility: auto` on `.section` (paint-skip for off-screen rooms), aria-live announcer in `Base.astro` driven by the scroll-spy. |
| tree internals | `tree-algorithm.ts`: widened `TreeConstants` from `typeof TREE_CONST as const` (literal types) to an `interface` (number-typed), so the slider's `setOverrides({ MAX_DEPTH: <number> })` actually type-checks. No behavioural change. |

**The Legendary colour reveal — design notes (no separate ADR, logged here):**

- The palette is the same 26-letter table that synesthesia already uses; extracted to `src/lib/palette/syn-colors.ts` so both primitives import the canonical source.
- Two radii in inertial-type: `POINTER_R = 90` (motion influence) and `COLOR_R = 60` (colour reveal). The smaller colour radius makes the effect feel like a flashlight on one or two letters at a time rather than washing the whole heading.
- Edge-triggered: each letter has an `isLit` flag; styles are only written on transitions. With CSS `transition: color 0.4s ease, text-shadow 0.4s ease` on every inertial letter, the fade-in/out is smooth without per-frame writes.
- Opt-in via `data-color-letters` on the heading or any ancestor — the primitive checks `r.closest('[data-color-letters]')` for each `[data-inertial-text]` root. Hero name (`<h1 data-color-letters>`) and every section h2 opt in. Easy to opt-out later by removing the attribute.

**Verification:**

- ✅ `npm run check` — 35 .astro/.ts files, 0 errors / warnings / hints under TS strict.
- ✅ `npm run build` — 3 pages built (index, 404, test-tree). Sitemap-index + sitemap-0.xml + robots.txt produced. Total client JS: ~16.5 KB raw, ~7 KB gzipped (Base.astro script 8.5 KB → 3.3 KB gz now that it includes manila + colour-reveal; tree 6.2 KB → 2.7 KB gz). Comfortably under the 50 KB compressed budget.
- ✅ Dev server: index = 200 / 56 KB HTML (full markup includes reading-panel + sample project article + 6 `data-color-letters` elements + 15 `recursion-knobs` references + scroll-progress bar). robots.txt = 200. /sitemap-index.xml = 200 in build, not generated in dev (Astro behaviour).
- ⚠ User-eye verification still needed. The five things to spot-check when convenient:
  1. Hover individual letters in `rafan / quader` — letter wobbles AND tints (its synesthesia hue) with a glow.
  2. Same on section h2s ("on me", "on the work", etc.).
  3. Click the sample-project card → reading panel slides up. Esc / backdrop / × all close it. Direct link `/#project-sample` opens it on cold load.
  4. Move the depth/angle/shrink sliders in `on recursion` — the tree should rebuild in real time.
  5. A thin teal-to-cream progress bar at the very top should fill as you scroll.

**Decisions taken this block (no full ADRs warranted):**

- Reading panel rendered outside `<main>` and uses `inert` on main for focus trap. Cleaner than a hand-rolled focus-loop, native a11y semantics.
- Site URL set to `https://rafanquader.com` as a placeholder in `astro.config.mjs`. **TBD** — update when the user picks a domain. OG/canonical/sitemap URLs all derive from this; one search-and-replace at deploy time.
- `data-color-letters` opt-in rather than always-on. Reasoning: some inertial elements (future tagline / other body inertia) might not benefit from colour reveal. Easier to enable on a case-by-case basis than to disable everywhere.
- The synesthesia palette has some quite-dark letters (e.g., `a: #332019`, `d: #664439`) which read as near-invisible against the dark `--ink-0` background. Kept anyway — the wobble already communicates interaction, and the dimness reads as part of the aesthetic (like Rimbaud's "A noir"). If the user finds it illegible later, a brighten-for-dark-bg helper is one-line.

**What I'd flag for the user:**

- **Sample project to delete:** `src/content/projects/sample/` is a placeholder so the gallery has visible content during phase-3 verification. Delete the directory or replace with a real entry via the content pipeline. Until then the empty-collection warning won't fire.
- **Site URL placeholder:** `astro.config.mjs` uses `https://rafanquader.com`. Update when the domain is picked (also: `public/robots.txt` references the same URL).
- **`/test-tree` still in the build.** Filtered out of the sitemap and `robots.txt` Disallows it, but the route still ships. Delete `src/pages/test-tree.astro` before production deploy.
- **`npm audit`: 6 moderate vulns.** Transitive dev deps. Bundle with the Astro 6.x upgrade when ready.

**What's left from the original spec:**

- Field-note accordion inside the reading panel (`notes/*.md` per project) — the structure is reserved in `ReadingPanel.astro` but no notes-collection loader has been added. Quick add when the user runs the content pipeline for a real project.
- Touch-equivalent for inertial type (currently degrades to static on touch). Deferred per `[[Open Questions#Inertial typography on touch devices]]`.
- Phosphor touch trail — still in the "decide after first paint" bucket per `[[Open Questions#Phosphor touch trail]]`. Site has enough motion for the phase-3 evaluation; my recommendation is to leave it out unless the user finds the page too quiet.
- Cloudflare Pages deploy + custom domain — deferred until ship candidate.
- Real body copy (`OnMe`, `OnTheWork`, `OnRecursion` annotation, `OnTheTrail` how-I-work, `Coda` closing) — user's to write.

**Memory mirror:** updated `project_portfolio_website.md` status to "Phase 3 done". Pointer-only.

---

## 2026-05-17 · later evening · Phase 4 — field notes, phosphor, hand-off polish

> This entry is **in progress**. A new chat can read top-to-bottom to see
> exactly what state the repo is in. Each sub-section below is a discrete
> piece of work — completed unless tagged `[WIP]`.

### Field notes accordion (DONE)

The Manila reading panel's "field notes" section was reserved in Phase 3 but no content collection backed it. Added now.

**Code:**
- `src/content/config.ts` — added a second collection `projectNotes` with `loader: glob({ pattern: '*/notes/*.md', base: './src/content/projects' })`. Schema is minimal: optional `title` + `sort_order` (default 0). The note's id format is `<project-slug>/notes/<note-name>`; we split on `/` to find the parent project.
- `src/components/ReadingPanel.astro` — fetches `projectNotes`, groups by parent slug, sorts by `sort_order` then alpha, renders each project's notes as a `<section class="rp-notes">` containing `<details>` elements (native browser accordion, full keyboard + a11y for free).
- `src/styles/manila-folder.css` — accordion styling: `▸` rotator on `[open]`, hover/focus states, indented body with left-rule, mono "field notes" sub-header.
- `src/content/projects/sample/notes/architecture.md` + `journal-sample.md` — two sample notes so the UI demonstrates with content.

**Verified:** type-check 0 errors; build clean (3 pages, ~17 KB raw JS); rendered HTML contains 16 `rp-note` references, 3 `rp-notes`, 2 sample notes by title.

### Phosphor touch trail [WIP — next]

Coming next: canvas-based particle trail behind the cursor, very low opacity, fades over ~600ms. Touch-disabled (no pointermove on touch). Reduced-motion = entirely off.

---

## 2026-05-19 · morning · Phase 5 — sepia redesign begin

User asked for a brighter, sepia-leaning, softer redesign with a dark-mode toggle and nicer fonts. Brainstormed direction in a long terminal+visual-companion session; locked decisions and burned through the foundation in one push.

**Decisions locked (brainstorm):**

| | |
|---|---|
| scope | skin + tasteful re-composition — every primitive and room kept |
| mode | light default; dark via toggle in TopNav; persisted under `rq-theme` in localStorage |
| fonts | Fraunces (display, variable, SOFT+WONK axes) + Newsreader (text, variable). Self-hosted woff2. System serif stack as CSS fallback. **Working Agreement change** — web fonts now allowed under one curated pair with ADR (ADR-008). |
| palette | A · parchment / walnut / terracotta. Light bg `#F5EAD4` · text `#3A2615` · accent `#7A3E1C`. Dark bg `#1F1812` · text `#ECDEC5` · accent `#E08A52`. |
| tree backdrop | residue threshold (no full tree drawn; canopy + drifting particles only at opacity 0.05) + tree-mode overlay (opacity 1.0). Both modes get autumn-sepia palette (SEPIA_LIGHT / SEPIA_DARK in palettes.ts). |
| slider labels | CS default `depth · angle · ratio` (with refactor `LENGTH_SHRINK → LENGTH_RATIO`). Click any label → swap all three to botanical `generations · spread · taper`. Persists under `rq-tree-labels`. |
| synesthesia | dual palette — SYN_COLORS_DARK keeps Phase 4 values; new SYN_COLORS_LIGHT is darkened/deepened so letters stay visible on parchment. `synColor()` and `activeSynPalette()` resolve per-theme. |
| hand-written feel | section H2s use Fraunces with `WONK 1` + italic — slightly wobbled, hand-script-adjacent. Also a `.handwritten` / `.field-note` utility class for asides. |

**Code changes (Phase 5 round 1):**

- `src/styles/tokens.css` — full rewrite with light + dark modes under `[data-theme]`. Legacy aliases (`--ink-*`, `--paper-*`, `--forest-*`) map to new semantic tokens so all Phase 4 stylesheets keep working. Cleanup of aliases planned for a later phase.
- `src/styles/fonts.css` (new) — `@font-face` declarations for Fraunces + Newsreader (regular + italic). Files referenced at `/fonts/*.woff2` — **not yet downloaded**; site currently falls back to system serif via the font-family stack.
- `src/styles/global.css` — section H2s use `--face-display` with `font-variation-settings: 'SOFT' 80, 'WONK' 1` + italic. New `.handwritten` / `.field-note` utility class.
- `src/styles/threshold.css` — `.name` and `.tagline` updated to use new tokens + display face for `.name`. Slight tracking + line-height refinements for Fraunces. Added `.tree-mode-label-toggle` styling (inline, dotted-underline, accent on hover).
- `src/lib/theme-toggle.ts` (new) — 60-line module. Exports `getTheme`, `setTheme`, `initThemeToggle`, `THEME_EVENT`, `THEME_STORAGE_KEY`. Cross-tab sync via `storage` event. Dispatches `rq:theme` CustomEvent so canvas primitives can re-paint without polling.
- `src/lib/site-init.ts` — wires `initThemeToggle()` first (before any primitive reads `data-theme`).
- `src/layouts/Base.astro` — inline FOUC script in `<head>` runs synchronously before first paint, sets `data-theme="light|dark"` from `localStorage`. Imports `fonts.css`.
- `src/components/TopNav.astro` — text toggle `light · dark` in the right slot. Gradient bg uses `color-mix(in srgb, var(--bg-0), ...)` so it adapts per-mode. Toggle is smaller than the first cut (user feedback) — `0.62rem` mono, tight padding, inactive word at 0.45 opacity.
- `src/components/Threshold.astro` — removed the `.threshold-tree-open` button (user found it noisy). Tree mounted with `palette: 'sepia'`, `opacity: 0.05`, `numParticles: 24` — the residue treatment. Slider labels rewritten with `[data-label]` toggle buttons carrying `data-label-cs` + `data-label-bot` attrs.
- `src/lib/backdrop/palettes.ts` — `SEPIA_LIGHT` and `SEPIA_DARK` added next to `FOREST`. `currentSepiaPalette()` reads `[data-theme]`.
- `src/lib/backdrop/tree.ts` — `palette` option accepts `'forest' | 'sepia'` (default `'sepia'`). Subscribes to `rq:theme`; rebuilds + redraws on theme change.
- `src/lib/backdrop/falling-leaves.ts` — same swap. The page-leaves backdrop now drifts in autumn colors and re-palettes live.
- `src/lib/palette/syn-colors.ts` — `SYN_COLORS_DARK` + new `SYN_COLORS_LIGHT` (hand-darkened for parchment legibility). `synColor()` resolves per-theme. `SYN_COLORS` kept as a backwards-compat alias of the dark table.
- `src/lib/primitives/synesthesia.ts` — uses `activeSynPalette()` instead of the static import.
- `src/lib/backdrop/tree-algorithm.ts` — `LENGTH_SHRINK → LENGTH_RATIO` rename (4 occurrences). Pure refactor, no behavior change.
- `src/lib/primitives/tree-mode.ts` — slider vars renamed (`shrink → ratio`), `LENGTH_RATIO` write, click-to-toggle CS/botanical labels under `rq-tree-labels` localStorage key.

**Verified:**

- ✅ `npm run check` — 39 .astro/.ts files, 0 errors / 0 warnings / 0 hints.
- ✅ `npm run build` — 2 pages built in 480ms.
- ⚠ Fonts: `public/fonts/*.woff2` not yet present. Site renders fine on the system-serif fallback; type upgrade lands the moment the woff2 files are dropped in. Next step: a tiny `scripts/get-fonts.sh` that downloads from Adobe Source / Production Type and subsets.

**User feedback after first view (in-session):**

- Tree re-coloring confirmed visually working (autumn-sepia tones).
- Open-the-tree button removed (felt noisy).
- Theme toggle resized smaller (was "a bit much").
- Tree on threshold dialled to opacity 0.05 ("residue") so it doesn't compete with the name.
- Hand-written feel surfaced via Fraunces WONK on section H2s; user noticed and asked for more.

**Open / next:**

- Download + subset the woff2 files into `public/fonts/`.
- Write **ADR-007** (palette shift), **ADR-008** (web fonts now allowed under one curated pair), **ADR-009** (light/dark mode toggle), **ADR-010** (slider labels + botanical click-swap), **ADR-011** (residue threshold). The Process Journal entry above + the in-code header doctrings are interim references until the ADRs land.
- Update [[Working Agreements]] to record the web-fonts policy change.
- Update [[02 - Architecture]] tokens.css / fonts.css description.
- Manila gallery → user wants to reconsider. Open question: tabbed architecture vs annotated index (book-TOC style) vs grid-of-plates. Discussed in the in-session terminal (Sonnet's take: tabs aren't the right metaphor for a portfolio gallery — items are parallel, not mutually exclusive; an annotated index reads more literary and would replace manila cleanly).
- More drastic moves user wants explored: hero-on-left / portrait-on-right page-1-of-a-book layout; marginalia track on wide screens; "ex libris" colophon at the bottom; chapter-break leaf glyphs between sections.
- Synesthesia placement: extend from `on me` bio to selectively word-tinted tagline + coda echo; keep off nav, labels, and ordinary body prose. (Rule: words that carry values / commitments → tint; descriptive prose → don't.)

---

## 2026-05-22 · evening · Phase 6 — gallery v2 + photo + tree click-hint (design only)

User returned after a 3-day gap with a concrete creative brief:

1. A "click here" sticker that pops up briefly on first load to advertise the
   tree's edit affordance.
2. They explicitly reject the existing manila-gallery look. New direction
   (paraphrased from their words): a **tabbed project view** where each
   active project shows a clickable image/video next to story prose, with a
   **spread of clickable papers on the side** for the Obsidian docs +
   traceability, plus framing text at top and bottom of the section.
3. Clean photo integration. Two candidates dropped at `~/Desktop/portfolio_website_photos/`
   (`IMG_6565.jpg` preferred, `IMG_6566.jpg` alternate). Both speaking-podium
   shots from what appears to be a URO research-presentation event (URO badge
   on the polo visible).

User then went AFK: *"I'll leave you be autonomously for some time, so you can
think about this."* So I worked the design solo, brainstormed each sub-feature,
and wrote a spec.

**Design decisions taken (each fully argued in the spec):**

- **Sticker.** Hand-applied paper visual (washi-tape strip + walnut italic
  caption + small drop-shadow + -3° rotation), bottom-right of the threshold
  tree, 800 ms in / 4 s held / 240 ms out. Doubles as a `[data-tree-open]`
  button — clicking dismisses *and* enters tree-mode. localStorage flag for
  once-per-user. Reduced-motion compliant.
- **Gallery v2.** Tabs across the top; one active project at a time; two-column
  spread (clickable media left, story right); scattered/tilted "papers" stack
  to the side (each = one `.md` file from the `projectFiles` collection);
  one-line framing prose above and below the spread. Deletes `FolderShelf`,
  `FolderCard`, `FolderReader`, `folder-reader.ts`, `manila-folder.css`,
  `Concept - Manila Folder Gallery.md`. Replaces with `src/components/spread/`
  (5 files) + `src/lib/primitives/spread.ts` + `Concept - Project Spread.md`.
  All content SSR'd, JS toggles `hidden` (no async fetch).
- **Photo.** Build a reusable `<Photo>` primitive with sepia-frame, click-to-
  lightbox, AVIF/WebP/JPG `<picture>` markup, walnut italic caption. Place
  `IMG_6565` in **`on the work`** (the URO badge ties to the DDD research
  narrative; the threshold portrait slot stays reserved for a future actual
  portrait). `IMG_6566` reserved — likely Coda placement, decided later.

**Three ADRs to write after spec approval:**

- ADR-012 — gallery v2 (tabbed spread vs accordion vs restyle-current)
- ADR-013 — photo placement: `on the work` over threshold
- ADR-014 — ambient-hint sticker primitive (timing, dismiss, persistence)

**Backlog ADRs 008–011** (web fonts, light/dark toggle, slider labels, residue
threshold) — still owed from Phase 5. The spec explicitly excludes them from
this pass to keep the implementation focused; flagged in the spec's §6.

**Spec written to:** [[specs/2026-05-22-gallery-v2-photo-sticker-design]].
Status: draft-awaiting-user-review. The spec's §5 ("Interpretations made")
is the user's review starting point — every place I had to guess is itemized
there with the alternative I rejected.

**Next, when the user returns:**

1. Review spec §5 (interpretations) — override anything I read wrong.
2. Approve / request changes to the design.
3. On approval: invoke `superpowers-extended-cc:writing-plans` to produce the
   implementation plan.
4. Then: write ADR-012/013/014, then implement.

**No code touched this session.** Pure design.

### rev2 — user-corrected (same session, later)

User came back and corrected several rev1 misreadings. Key changes:

- "Tab with projects" actually means **a separate `/projects` route**
  navigated to from the top nav — not in-section tab switching. Architecture
  flipped: spread/* directory dropped; new `src/pages/projects.astro` +
  `src/components/project/` (ProjectChapter + ProjectMedia + ProjectNotes).
- Per-project structure is **chapter spread**: heading, cover media,
  narrative prose, native `<details>` accordion of cleaned notes (grouped
  by directory), inline status + links, chapter rule. Reads as continuous
  scroll, not a switcher.
- The home page **loses** `on the artifacts` entirely — the room becomes
  a page. Home order: threshold · on me · on the work · on the trail · coda.
- Top-nav gains a `/projects ↗` link (with a small glyph signaling "this
  one navigates away").
- "More photos" was misread by rev1 as more personal photos. User
  clarified: that meant **project cover images / videos**. Only one
  personal photo (IMG_6565). IMG_6566 dropped entirely.
- Personal-photo placement moves from `on the work` to **threshold,
  top-right** — the page-1-of-a-book composition. Replaces the deferred
  portrait slot in [[Concept - Threshold Hero]] (slot is reclaimed by
  this photo; the "future portrait" deferral resolved).
- Photo treatment: **soft-feathered radial mask + warm sepia overlay**
  via CSS (no photo editing, no background-removal). Hover removes the
  grade. Click opens a lightbox at original colors / full size. This is
  the "fade-to-parchment" evolution of the original portrait-slot mask.
- Backlog ADRs 008–011 confirmed as a separate doc-pass, not in this
  implementation.

Spec rewritten to rev2 status: still `draft-rev2-awaiting-user-review`.
Revision log captured in spec §10. Awaiting user approval of the rev2
spec before transitioning to writing-plans.


## 2026-05-23 · night · Phase 6 rev2 — IMG_6565 photo iteration + tree clearing

Picked the Phase 6 rev2 implementation back up from a prior session that had landed the bulk of the gallery-v2 work (separate `/projects` route, `ProjectChapter`/`ProjectMedia`/`ProjectNotes` components, `Photo` primitive with lightbox, tree-hint sticker, full removal of the manila gallery). Two threads remained: the sticker wasn't appearing, and the personal photo `IMG_6565` needed to actually be integrated into the threshold.

Sticker first. The hint button was rendering but dismissing immediately. Walked through `tree-hint.ts`: the cleanup path was triggering off `scroll`, `keydown`, and `touchstart` listeners attached at the same moment the sticker appeared. The embedded preview browser fires `keydown`/`touchstart` during HMR reloads and `scroll` fires for sub-pixel layout shifts. Fixed by (a) removing the keyboard/touch dismissals entirely (the timer + click + scroll are enough), (b) gating scroll dismissal behind `window.scrollY > 20`, and (c) adding an `activeHandle` guard so when HMR re-runs `initTreeHint`, the prior instance's stale timers can't dismiss the new one. Sticker now appears at ~900ms and stays visible until the user actually does something.

Then the photo. Four iterations — the journey is worth recording because each rejection clarified a constraint that wasn't explicit in the spec.

**Iteration 1: feathered radial mask + sepia overlay** (matches spec rev2). Shipped first because the spec said so. User reaction: *"does it change the photo or just make it brighter when you hover over it? I think just brightness and stuff, I don't want like a filter that wrongfully changes the photo, also, it still doesn't feel right. Take a screenshot of the whole Canvas, you see how it doesn't fully match and maybe messes too much with the tree??"* Sepia → true on hover is a visible color shift — dishonest. Constraint #1 surfaced: **brightness-only lift on hover; no filters at rest**.

**Iteration 2: circular cameo.** Pivoted to `clip-path: circle()` with an accent ring — yearbook headshot energy, dropped the rectangular dark backdrop, took the "mass on parchment" complaint head-on. Made dark mode visible by aggressively lifting brightness/contrast there. User reaction: *"i don't like the circular cutout b/c it cuts my hand off, rethink my instructions."* The cropped gesturing hand was the deal-breaker — the photo's *meaning* depends on the gesture. Constraint #2 surfaced: **never crop the subject**.

**Iteration 3: print treatment.** Re-spec'd the photo primitive's third treatment as `print` — full-frame rectangle, no mask, no clip; integration entirely at the edge via a hairline accent ring and a soft drop shadow; `filter: none` at rest; `brightness(1.06)` (light) / `brightness(1.1)` (dark) on hover. New theme tokens: `--photo-print-{rest, hover, radius, ring, shadow}`. This honors constraints #1 + #2 simultaneously by refusing to alter the pixels at all and only adding a frame.

Then the user asked: *"how can we make the tree working with this properly and cleanly??"* This is constraint #3 — **don't fight the tree**. Looking at the screenshots: the tree's canopy reached into the photo's quadrant, and the photo's rectangular edge sliced branches like a guillotine. Three families of fix considered: (a) move the tree (asymmetric, feels apologetic), (b) blend-mode the photo (doesn't address the at-the-edge problem), (c) make the tree literally avoid the photo's footprint.

**Iteration 4 (current): print + tree clearing.** Went with (c). Added a CSS radial mask on the `.threshold-tree` canvas — `mask-image: radial-gradient(ellipse 19% 19% at 88% 22%, transparent 0%, transparent 38%, rgba(0,0,0,0.55) 62%, rgba(0,0,0,0.92) 82%, black 100%)`. The tree fades to transparent inside an ellipse centered on the photo, opaque everywhere else. Branches gracefully thin out as they approach the photo's footprint — the canopy visibly *steps back* to make room. Pure CSS, no tree-rendering code changes.

The clearing is disabled in `body[data-tree-mode="on"]` (the photo is hidden, tree reads edge-to-edge) and at `@media (max-width: 640px)` (photo is no longer floating). Hover isolation also added: `.threshold:hover:not(:has(.threshold-photo:hover)) .threshold-tree` — so when the pointer is on the photo, the tree doesn't ALSO get its hover-brightening lift, preventing a fight for the hover state.

Browser-verified across light + dark, both with the photo hover-rest cycle and with the threshold-empty hover. Light mode reads as a small printed photo on parchment with the tree gently parting around it. Dark mode reads as a print on a walnut wall, same parting behavior. The composition feels intentional now; the photo doesn't feel like a foreign object on the tree.

**Docs updated.** Spec rev4 (print treatment) + rev5 (tree clearing) added to §4.3.10. [[Concept - Threshold Hero]] now has a "Current implementation (2026-05-23)" section that overrides the original deferred-portrait design — the deferred-portrait section is preserved for traceability but flagged. New ADR-013 captures the four-iteration decision narrative with all alternatives.

**What I learned.** Three constraints (preserve the photo, preserve the subject, don't fight the tree) only emerged through iteration and rejection. The lesson isn't "I should have asked all three up front" — they only become legible *after* the wrong design exposes them. Rev2's spec said "soft-feathered + sepia overlay" because that was a reasonable a-priori guess; the rejection chain refined "reasonable" into "honest at rest, full subject, tree-respecting." The print + clearing solution wouldn't have been my first instinct without the journey.

The clearing technique generalizes: any future floating element on the threshold that needs to coexist with the canvas (a callout, a second photo, an overlay) can carry its own CSS mask contribution. The current implementation hard-codes one clearing; if a second is ever needed, the masks compose with `mask-image: <a>, <b>` (multiplying transparency).

**Open follow-ups (not blocking).** The clearing's center + radius are static percentages — if the photo's CSS placement changes substantially, the clearing must be re-tuned. A future refinement would be JS-derived clearing coordinates from the photo's bounding box at runtime, but the static version is correct for the current layout and the right complexity *now*. Added to [[Open Questions]] for whenever the topic next comes up.


## 2026-05-27 · content pass — PDF copy, seven projects, vault sync

Completed the portfolio **content fill** plan (user PDF + follow-up edits):

- **Home:** threshold tagline (`Computer Science @ SJSU` + `Research · Claude Code · Education`), on me (synesthesia words), DDD story, simplified on the trail (no "how I work"), resume button, coda tagline.
- **TopNav:** persistent `github ↗` → https://github.com/rquader (visible on mobile).
- **`/projects`:** info/story intro+outro, seven project folders (samples deleted), WIP sticker + dialog, empty media placeholders.
- **Resume:** `public/Rafan_Quader_Resume.pdf` from `Rafan_Quader_Resumé (1).pdf`.
- **Legendary UI/UX:** user-revised info + story in content collection.
- **Obsidian:** updated [[03 - Content Model]], [[Open Questions]], [[06 - Next Agent Handoff]], [[Reference - Paths]], [[decisions/_index]] + [[ADR-018-project-wip-sticker-dialog]].
- **Repo:** `AGENT_HANDOFF.md` status bumped.

Deferred: cover images, Manim carousel, `demo_url` / `cover_video`, portfolio site public URLs.


## 2026-05-27 · session handoff doc

Added repo `SESSION_HANDOFF.md` (compressed context for the next large step). Rewrote `AGENT_HANDOFF.md` to remove stale sample-project TL;DR and point at the handoff. Vault [[00 - Index]] and [[06 - Next Agent Handoff]] now link to the repo file first.


## 2026-05-27 · project media integration — GIFs, carousel, stack

Shipped the **project media** pass: all seven `/projects` chapters now show real GIF/PNG assets from user exports (desktop folder → `src/content/projects/<slug>/images/`).

**Schema & UI:**
- `media_items`, `media_mode` (`single` | `carousel` | `stack`), `media_default` on projects collection.
- `ProjectMediaAsset`, `ProjectMediaCarousel`, `ProjectMediaStack`; `project-media-carousel.ts` with lazy load + IntersectionObserver.
- `project-media-url.ts` resolves co-located assets via `import.meta.glob`.
- Legacy `cover_image` / `cover_video` preserved.

**Per-project rules (user-specified):**
- **manim-wallpapers** — 10-slide carousel (`01`–`10`, including phyllotaxis + v3 `09_drift_field`, `10_aurora_subtle`); default slide index 4 = `05_recursive_tree_v2`.
- **arabic-dialect-map** — stack: screenshot + demo gif both visible; screenshot uses `contain` + natural aspect ratio.
- **web-crossword-generator**, **adhkar-counter** — 2-slide carousel (photo first, gif second).
- **legendary-ui-ux**, **insta-dm**, **portfolio-website** — single gif each.
- **insta-dm** — follow-up fit tweak: `16/9` + `contain` so full demo frame visible.

**Docs:** [[decisions/ADR-019-project-media-carousel]], [[03 - Content Model]], [[Open Questions]] (carousel resolved), [[06 - Next Agent Handoff]], repo `SESSION_HANDOFF.md` + `AGENT_HANDOFF.md`.

**Still deferred:** `demo_url` / `cover_video`, portfolio public URLs, Cloudflare deploy, GIF→WebM optimization if weight bites.


## 2026-05-27 · projects header — Obsidian notes line

Added a **shared** paragraph to the `/projects` page header (visible in both info and story modes, below the mode-specific intro, above the toggle):

> For most of these projects, you can also access my primarily (if not entirely) AI-generated Obsidian notes. I can use these notes to better understand a project's architecture and as context for AI agents!

Info and story **header intro is a single always-visible block** (not mode-swapped). Fixed story mode: removed `hidden` from story body slots — visibility is CSS-only via `[data-page-mode]`. Documented in [[03 - Content Model#Page header (live copy)]].
