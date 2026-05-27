---
tags: [working-agreements, canonical, durable]
---

# Working Agreements

> Canonical durable rules for how this project is built. Mirror of the `feedback_*` files in Claude memory — but **this file is the source of truth**. If you are a future agent or human picking this up, read this first.

## Why this file exists

The user is intentionally cross-tool: they may continue this project from a different Claude account, a different machine, or a different coding agent (Cursor, Aider, Codex, etc.). Claude memory is per-account/per-machine and doesn't survive those moves. So every persistent rule lives **here** as well as in memory, with this file canonical.

## 1. Tradeoff documentation is mandatory

For every non-trivial decision (tech, design, content pipeline, primitive inclusion/exclusion, performance vs. fidelity), write an ADR in `decisions/` with this structure:

- **Decision** — what we picked
- **Context** — what problem prompted the choice
- **Alternatives Considered** — at least 2
- **Benefits** — what we gain
- **Harms / Tradeoffs** — what we give up
- **Revisit If** — concrete future conditions that should re-open the decision

**Why:** the user wants future humans/agents to be able to revisit decisions and *understand the reasoning*, not just the outcome. He uses this pattern rigorously in `[[Manim_Wallpaper/decisions/_index]]` (ADR-001 through ADR-007).

**When to skip:** small obvious choices (CSS variable naming, file location of an obvious helper) don't need an ADR. Reserve ADRs for stack choice, content pipeline, primitive inclusion, performance vs. fidelity, anything where a reasonable alternative existed.

## 2. The site never reads from the personal Obsidian vault

The site repo (`~/Developer/Portfolio_Website/`) must never:
- symlink or import from `<vault>/`
- have the vault path appear in any source file, config, or build step
- have its build pipeline read from the vault, even in dev mode

All project notes that appear on the published site live in `site-repo/src/content/projects/<slug>/notes/*.md` as **hand-curated copies**.

**Why:** editorial control. Avoid leaking in-progress thoughts, collaborator names, private incidents, or anything the user hasn't yet decided is public. The vault path is also fragile (spaces + iCloud sync); the site shouldn't depend on it.

**The pipeline** between vault and site is documented in [[04 - Content Pipeline]] and is meant to be runnable by a cheaper Claude (Haiku) or a different agent. The user reviews the diff before commit.

## 3. Modular, senior-eng reviewable code

Hard requirements:

- TypeScript everywhere in `src/`. No `any` without an inline `// why this is required` comment.
- Every primitive (inertial typography, synesthesia, cursor companion, tree backdrop, etc.) is a self-contained module exposing `init(root: Element, opts): { stop(): void }`.
- No primitive reaches outside its assigned root element.
- The boot module (`src/lib/boot.ts`) is the *only* file that knows about all primitives.
- File-header docstrings explain the algorithm's intent. Inline comments are reserved for non-obvious tradeoffs, linked to the relevant ADR or Concept doc.
- Comments explain **why**, never **what**. (The well-named identifier explains what.)
- No globals on `window` outside dev mode.

**Why:** the user expects the code to pass scrutiny from both a senior software engineer (correctness, clarity) and an aesthete (the code itself is part of the artifact). He uses Claude Code's review tools.

## 4. Durable artifacts

This Obsidian folder is the **durable artifact**. The site code is the secondary artifact. If a future agent had only this folder and could see no chat history, they should be able to understand:

- what the project is ([[01 - Philosophy]], [[00 - Index]])
- how it's built ([[02 - Architecture]])
- what it contains ([[03 - Content Model]])
- how content gets in ([[04 - Content Pipeline]])
- each visual primitive's algorithm (`Concept - *.md`)
- every non-trivial decision and its alternatives (`decisions/ADR-*.md`)
- what was tried and rejected, what's deferred ([[Open Questions]], [[Process Journal]])
- the author ([[Author Profile]], this file)

When working on the project: **update Obsidian docs in the same turn as code changes**. A doc that goes stale is worse than no doc.

## 5. Memory mirroring policy

In Claude Code (this account), I (the assistant) write to memory at:
`<local-agent-memory>/` (path omitted from this public notes set)

That memory is a **convenience for warm-starting the current setup**, not durable across tools. The policy:

- Memory files are short (1–3 sentences) and **point at the canonical Obsidian doc**.
- Anything I'd put in memory, I also put in an Obsidian doc.
- This file ([[Working Agreements]]) is the canonical mirror of all `feedback_*.md` memory items.
- [[Author Profile]] is the canonical mirror of `user_rafan.md`.
- [[Reference - Paths]] is the canonical mirror of `reference_obsidian_paths.md`.
- [[00 - Index]] + [[01 - Philosophy]] is the canonical mirror of `project_portfolio_website.md`.

A future agent without access to memory loses nothing — it's all here.

## 8. Clarify ambiguous terms before executing

Terms used in this project that have *multiple plausible meanings* — including but not limited to: **symlink**, **opener**, **backdrop**, **primitive**, **scene**, **room**, **section**, **render**, **port**, **scaffold** — should be clarified with the user, or at minimum have my interpretation **stated explicitly before acting on it**.

**Why:** during the 2026-05-17 session the user redirected my interpretation three separate times:

1. *"Symlink as needed"* — I read filesystem symlinks; he meant Obsidian wikilinks.
2. *"Opening sections to show that then scroll into the page"* — I read pre-threshold intro video; he meant the threshold itself (a top-of-page section you scroll down from and scroll back up to).
3. *"Designing Manim designs for the background"* — I read wallpapers; he meant *backdrops* (persistent, behind body content, with subtle animation).

Each redirection cost session time and produced artifacts I had to undo. The cost of stating interpretation up front ("I'm reading 'symlink' as wikilinks — confirm?") is far smaller than the cost of executing on a misread.

**How to apply:**
- When the user uses one of the terms above (or any term whose meaning could differ between technical default and this project's context), say what you're reading the term as *in the response that announces what you'll do*. One sentence is enough.
- If you're confident from context, go ahead. If genuinely uncertain, ask.
- Don't proliferate questions — make the interpretation visible, then execute. The user can correct without re-asking.

## 7. The user writes all live-site body copy

For any text that will appear on the live portfolio site (bio, project stories, DDD narrative, the "on recursion" annotation, the "on the trail" prose), **Rafan writes the words**. Components use marker-style placeholders like `[PLACEHOLDER — your bio here, ~80–120 words, first-person]`, not prose-shaped synthetic content written in his voice.

**Why:** the user explicitly said *"I don't want you necessarily writing things for me that don't exist in my accounts and that I've already written."* He wants to do this himself. Synthetic placeholder prose in his voice creates ambiguity — it's not his words but it reads close enough that the boundary blurs when he comes back to edit.

**Why also:** much of the prose in his Legendary UI-UX and Manim_Wallpaper Obsidian docs was generated by earlier AI passes without his line-by-line direction. Those docs are useful aesthetic/structural reference but **not the canonical version of his voice**. Don't echo their literary register into new live-site content.

**Exceptions:**
- Content he has explicitly written verbatim (e.g., the tagline from his stated objective in [[Author Profile]]) — reproduce exactly.
- Operating docs in Obsidian, ADRs, build pipeline docs, this Working Agreements file — these describe the project to a future agent and can be in any clear voice.

**How to apply:**
- In any component, use `[PLACEHOLDER — <what + target length>]` for unwritten content.
- Visible Lorem ipsum is also acceptable if Rafan prefers a pure layout placeholder.
- When in doubt about whether a piece of copy is "his voice" or "synthetic placeholder," it's synthetic — mark it as placeholder.

## 6. Photo & personal-content insertions

The user may drop in a portrait photo and personal text later. The site must be designed so:

- Dropping `public/images/portrait.{jpg,webp,avif}` and a one-line copy edit is sufficient for the hero. See [[Concept - Threshold Hero]].
- Replacing placeholder bio prose is a single-file edit (`src/components/OnMe.astro`).
- Adding a new project is folder-additive: drop a folder into `src/content/projects/<new-slug>/`, no other edits required. The gallery auto-discovers.

**Why:** the user values being able to edit the site without code changes for the high-frequency edits (text tweaks, new project, photo swap).

## see also

- [[Author Profile]]
- [[Reference - Paths]]
- [[decisions/_index]]
- [[04 - Content Pipeline]]
