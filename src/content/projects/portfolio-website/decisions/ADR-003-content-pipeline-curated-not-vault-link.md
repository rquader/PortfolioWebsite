---
tags: [adr, content, pipeline]
---

# ADR-003 — Content pipeline: curated copies, not vault links

**Status:** accepted
**Date:** 2026-05-17

## Context

The user maintains a rich personal Obsidian vault with project notes, design decisions, process journals. Much of this content would make excellent public material for the portfolio's manila-folder gallery. But the vault also contains personal observations, in-progress thoughts, collaborator names, internal references, and other things the user has not chosen to publish.

The question: how does vault content end up on the site?

## Decision

**Curated copies, not live links.** Project notes that appear on the site live in `~/Developer/Portfolio_Website/src/content/projects/<slug>/notes/` as hand-curated `.md` files. The build process never reads from the vault. A documented [[../04 - Content Pipeline|content pipeline]] handles the cleaning step — typically run by a cheaper Claude (Haiku) or another agent — and produces a diff the user reviews before commit.

## Alternatives considered

### Live build-time read from the vault

`astro.config.mjs` configures a content source pointing at `<vault>/Programming/`. Each project's vault folder becomes a project entry. The build step filters by frontmatter (`public: true`) and strips lines marked private.

- *Why-not:* personal content leak risk is high. A note the user forgot to flag goes public. Filtering rules are fragile (regex, allowlist). The vault path has spaces and lives in iCloud, making the build environment-dependent. Production-deploying from a build that depends on iCloud is fragile.

### Symlink the project folder into the site repo

`ln -s <vault>/AdhkarCounterNotes ~/Developer/Portfolio_Website/src/content/projects/adhkar-counter/notes/`. Build reads symlinked content.

- *Why-not:* same leak risk, plus iCloud sync can corrupt symlinks. Reviewer cannot see what's actually in the repo. Git treats symlinks specially. Bad.

### Manual hand-write everything in the site repo

The user types the public versions of his notes directly into `src/content/projects/<slug>/notes/*.md`. No pipeline.

- *Why-not:* the user's existing vault is the source of his thinking; rewriting everything by hand loses value and is tedious. The pipeline preserves the work he's already done while gating the leak surface.

### Frontmatter `public: true` flag in the vault

Vault notes that should be published get a `public: true` flag added by the user. Build pulls only those.

- *Why-not:* requires the user to maintain editorial flags inside the vault — which is exactly the discipline the user wants to NOT have to maintain in his private notes. Also: a "public: true" note may still contain a private aside that needs cleaning. The flag is binary; cleaning is granular.

## Benefits

- **Editorial control.** Every line on the site has been seen by the user (in the diff review) before deployment.
- **No leak surface.** The site simply cannot publish vault content because it cannot read the vault.
- **Pipeline is portable and replaceable.** It's documented as a prompt + procedure (in [[../04 - Content Pipeline]]). Any agent can run it. Today's Claude, tomorrow's Cursor, etc.
- **Build environment is clean.** No iCloud dependency. Production-deployable from anywhere with the repo.
- **Repo is self-contained.** A future contributor cloning the repo gets everything they need to build, with no broken references to a personal path.

## Harms / Tradeoffs

- **Manual step required to publish new project notes.** Adding a project = running the pipeline + reviewing diff + committing. Not zero-friction. Mitigation: pipeline is documented to be runnable by Haiku/Sonnet in a few minutes per project.
- **Vault and site can drift.** If the user updates a vault note and forgets to re-run the pipeline, the site shows the old version. Mitigation: this is a feature, not a bug — the site reflects what was reviewed. If staleness becomes a problem, set a calendar reminder or build a "vault update notifier" later.
- **Two copies of content.** Storage-wise trivial; mentally we now have "private vault note" + "public site note" and they can drift in content. Acceptable.
- **No automatic propagation of edits.** If the user fixes a typo in the site copy, the vault version is unchanged. Same in reverse. Acceptable for a portfolio.

## Revisit if

- The pipeline becomes painful (>10 min per project refresh on average). Then consider:
  - A more automated cleaning script with an allowlist.
  - A frontmatter-gated live-build approach with a strict denylist as belt-and-suspenders.
- The user expresses fatigue around running the pipeline for small edits. Then consider a "fast path" for trivial copy edits done in the site repo only.
- The user's vault structure changes significantly (e.g., he restructures his Programming folder). Then update the pipeline doc.

## See also

- [[../04 - Content Pipeline]] — the pipeline procedure itself
- [[../Working Agreements#2. The site never reads from the personal Obsidian vault]]
- [[../03 - Content Model#on the artifacts]]
