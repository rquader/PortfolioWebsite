---
tags: [handoff, orientation]
---

# 06 — Next Agent Handoff

> **You're picking up Rafan Quader's portfolio website project.** Read this first. It exists so you can continue the work without having seen any prior conversation history.

## What this project is

A portfolio site for Rafan Quader — a Computer Science undergraduate at San José State University. Real, impressive, modular, deployable to Cloudflare Pages' free tier. Inherits visual language from his [[Legendary UI-UX/Legendary UI-UX|Legendary UI/UX]] sibling project, ports his Manim `recursive_tree_v2` scene to canvas as a signature backdrop. See [[01 - Philosophy]] for the full position.

## State as of 2026-05-27 (media pass)

| | status |
|---|---|
| Obsidian docs (this folder) | ✅ maintained — ADR-019 + content model updated |
| Site code (`~/Developer/Portfolio_Website/`) | ✅ built — home copy + `/projects` + seven real projects |
| `/projects` redesign | ✅ editorial rows, notes popup, story/info toggle, WIP dialog |
| Live body copy | ✅ from user PDF + Legendary UI/UX revision |
| Resume PDF | ✅ `public/Rafan_Quader_Resume.pdf` |
| Top nav GitHub | ✅ `github ↗` → profile |
| Project media (GIFs/PNGs) | ✅ all seven chapters — carousel / stack / single per [[decisions/ADR-019-project-media-carousel]] |
| Manim carousel | ✅ 10 slides, default `05_recursive_tree_v2` |
| Portfolio repo links | ⏳ add `github_url` / `web_url` when published |
| Cloudflare Pages hosting | ⏳ planned |
| Custom domain | ⏳ user will decide |

## How to start

0. **Read the compressed brief:** `~/Developer/Portfolio_Website/SESSION_HANDOFF.md` (repo) — then `AGENT_HANDOFF.md` for detail.
1. **Read [[Working Agreements]] first.** Especially:
   - `1. Tradeoff documentation is mandatory` — write ADRs in `decisions/` for new decisions.
   - `2. The site never reads from the personal Obsidian vault` — hard rule. The vault path *must not appear* in any source file or build step.
   - `5. Memory mirroring policy` — if you have a memory system, mirror to Obsidian here. Obsidian is canonical.
   - `7. The user writes all live-site body copy` — do not invent voice; home/projects copy is live from the user's PDF (2026-05-27).
2. **Read [[01 - Philosophy]] and [[02 - Architecture]].** ~20 minutes total.
3. **Then [[05 - Bootstrap Guide]]** for the step-by-step build path.

Open Concept docs and ADRs on demand as you reach each piece. They are not required reading upfront.

## Reading order (priority)

If you only have 30 minutes:

1. Repo `SESSION_HANDOFF.md` (compressed).
2. This file (you are here).
3. [[Working Agreements]].
3. [[01 - Philosophy]].
4. [[02 - Architecture]].
5. [[03 - Content Model]] (skim).
6. [[05 - Bootstrap Guide]] (skim).

If you have an hour, also read the Concept docs for the primitive you're implementing first.

## What's done in these docs

The docs in this folder collectively specify the entire project:

- [[00 - Index]] — navigation across all docs
- [[01 - Philosophy]] — why this site is the way it is
- [[02 - Architecture]] — tech stack, repo layout, modular rules
- [[03 - Content Model]] — every section and where its content lives
- [[04 - Content Pipeline]] — how vault notes become public notes
- [[05 - Bootstrap Guide]] — step-by-step start-coding instructions
- [[06 - Next Agent Handoff]] — this file
- [[Author Profile]] — about Rafan
- [[Working Agreements]] — the durable rules
- [[Reference - Paths]] — paths to vault, code, sibling projects
- [[Process Journal]] — what happened so far, chronologically
- [[Open Questions]] — deferred decisions, awaiting user, quietly unsolved
- [[Sources & Inspirations]] — credits and the things we deliberately didn't use
- `Concept - *.md` (6 files) — each design primitive
- `decisions/ADR-*.md` (6 files) — every tech and design choice with tradeoffs

## What's NOT done

- **Portfolio Website** chapter `github_url` / `web_url` when repo is public.
- **demo_url** / **cover_video** on any project (schema ready; GIF demos used instead for V1).
- Hosting / custom domain.
- Deeper vault note curation (minimal `field/` stubs shipped; expand via [[04 - Content Pipeline]]).
- GIF re-encoding / WebM fallback if page weight becomes a deploy blocker (see [[decisions/ADR-019-project-media-carousel#Revisit if]]).

## Useful artifacts that exist

**V1 ground-truth references** (the scene the V1 site ports):
- **`~/Developer/Manim_Wallpaper/output/finals/05_recursive_tree_v2.mp4`** — Manim render of recursive_tree_v2. The TypeScript canvas port should match this visually. See [[Manim_Wallpaper/wallpapers/05_recursive_tree_v2]] for the algorithm.

**V1.1 candidates** (scenes designed but not in V1 site scope):
- **`07_network_nodes.mp4`** — backdrop tuned specifically for "on the work" section. DDD-themed: sparse graph + messages traversing edges. See [[Manim_Wallpaper/wallpapers/07_network_nodes]] and [[Open Questions#per-section backdrops (tier-2 design exploration)]].

**Tier-2 / reference renders**:
- `06_aurora.mp4` — full aurora scene; tier-2 if a "sound room" or backdrop appears later
- `01_recursive_tree.mp4` — v1 of the tree, kept for comparison with v2
- `02_falling_leaves.mp4`, `04_constellation.mp4` — additional generative scenes available as reference

**Phyllotaxis note:** the user dislikes phyllotaxis as a *canvas port / backdrop candidate* (do not port it), but it **is included** in the `/projects` Manim GIF carousel for completeness per [[decisions/ADR-019-project-media-carousel]].

**Manim design docs** (read for context on the scenes' intent):
- [[Manim_Wallpaper/07_v2_concept_design]] — design rationale for v2 (tree-v2, aurora, mountains, meadow)
- [[Manim_Wallpaper/08_backdrop_concepts]] — design rationale for v3 backdrops (network_nodes, drift_field, aurora_subtle)

The site does not deploy any of these MP4s. They live in the Manim repo as algorithm ground truth and as visual references for any port effort.

## Key user-stated constraints (verbatim or near-verbatim)

- *"Computer Science @ SJSU. Aspiring to participate in meaningful applications of Computer Science, nudging humanity (well, hopefully at least some of it) forward!"* — this is the tagline. **Do not paraphrase.**
- *"I don't want you necessarily writing things for me that don't exist in my accounts and that I've already written."* — never write copy as him.
- *"I don't really like the phyllotaxis."* — don't port it.
- *"It'll just be an upper-body photo of me probably… I might add that later."* — photo deferred; design for drop-in.
- *"Modular, human-readable… meticulously reviewed by a senior software engineer who catches all bugs and loves clean code and a aesthetics connoisseur who loves great aesthetic websites."* — both audiences. Code quality and visual taste both matter.
- *"I might use different chats, might end up on a different Claude account (or possibly even using another coding agent)."* — durability is non-negotiable. This Obsidian folder is the source of truth.

## How to communicate progress in this folder

- **Append to [[Process Journal]]** at the end of each work session. New `## YYYY-MM-DD · time-of-day · short title` block. The genre is "what I did, what I decided, what I'd flag." Not a sales report.
- **Update [[Open Questions]]** when you defer something or unblock something.
- **Write new ADRs** in `decisions/` for any new non-trivial decision. Index in [[decisions/_index]].
- **Update Concept docs** if the spec changes during implementation. Don't let docs and code drift.
- **Update [[00 - Index]]** if the file inventory changes.

## How to communicate progress to the user

Suggested practice when ending a session:

- Summarize in 3–5 sentences what changed, what's next, what needs his input.
- Reference the doc that has more detail (e.g., "see [[Open Questions]] for the deferred items").
- Don't summarize the whole project — he knows what it is.

## Common pitfalls

- **Writing as Rafan.** Easy mistake — you read his Legendary docs and pick up the literary register. The Legendary docs were generated by an earlier AI pass and are not his canonical voice. Use `[PLACEHOLDER]` markers, not synthetic prose.
- **Linking to the vault.** Easy to think you'll save effort by pointing the build at the vault. Don't.
- **Treating Legendary as gospel.** Its aesthetic is the starting point; its specific choices are not all transferable. See [[decisions/ADR-006-aesthetic-primitives-inherited-and-cut]].
- **Over-decorating.** Restraint is the floor.
- **Adding audio.** No audio by default. User must explicitly request.

## See also

- [[00 - Index]] — for full doc inventory and navigation
- [[Working Agreements]] — durable rules
- [[05 - Bootstrap Guide]] — for the build path
