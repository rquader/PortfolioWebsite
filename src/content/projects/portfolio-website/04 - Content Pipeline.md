---
tags: [pipeline, runnable, multi-model]
---

# 04 — Content Pipeline

> How a personal Obsidian vault note becomes a public, cleaned site note. **This document is the spec.** Any agent (Claude Haiku, Claude Sonnet, a future Claude, another tool) should be able to read this file and execute the pipeline.

## North-star principle

The personal vault stays private. The site shows curated, cleaned copies. The user reviews the diff before any commit. See [[Working Agreements#2. The site never reads from the personal Obsidian vault]].

## Pipeline at a glance

```
┌──────────────────────────────────┐         ┌───────────────────────────────────┐
│  vault                            │         │  site repo                         │
│  <vault>/Programming/<project>/   │  →clean→│  src/content/projects/<slug>/      │
│                                   │   →     │                                    │
│  - process journals               │         │  - index.md       (story)          │
│  - architecture notes             │         │  - notes/*.md     (cleaned notes)  │
│  - decisions                      │         │  - images/*       (screenshots)    │
│  - personal observations          │         │  - meta.yaml      (links, order)   │
└──────────────────────────────────┘         └───────────────────────────────────┘
       hand-off prompt → cheaper model → user review → commit
```

## Inputs

For project `<slug>`, the pipeline operator (human or AI) is given:

1. **The vault path** for that project's notes. Example: `<vault>/Programming/AdhkarCounterNotes/`.
2. **The slug** to use in the site repo. Example: `adhkar-counter` (lowercase-kebab, ASCII only).
3. **The output path** in the site repo. Example: `~/Developer/Portfolio_Website/src/content/projects/adhkar-counter/`.
4. **A list of acceptable images** to copy (paths inside the vault or paths to a separate Pictures folder).

The operator should **never** be given write access to the vault. Read-only.

## Outputs

A complete `<output>` folder containing:

- `index.md` — the user-facing story for this project. Frontmatter follows the schema in [[02 - Architecture#content collection schema]].
- `notes/*.md` — selected, cleaned field notes from the vault.
- `images/*` — selected screenshots, properly compressed.
- `meta.yaml` — additional metadata: `github_url`, `download_url`, `sort_order`, `status`.

## Cleaning rules

The output must NOT contain any of:

| category | what to strip / rewrite |
|---|---|
| **People** | Names of collaborators, professors, classmates, family, friends. ("Dr. Reed" → "my professor"; "Mom said" → omit.) |
| **Contact info** | Phone numbers, addresses, emails (other than the user's own public email if context calls for it). |
| **Tool credentials** | API keys, tokens, ngrok URLs, dev URLs that contain credentials, Slack/Discord channel IDs. |
| **Internal references** | "Ask X tomorrow about Y" — omit entirely. "Slack thread #ios-team" — omit. |
| **Live commercial opinions** | Strong claims about specific real companies/products that the user might not want to publish ("Stripe's API is bad", "Notion is overrated"). Soften or omit. |
| **In-progress thoughts** | TODO/FIXME/idk/maybe lines that don't read as intentional. The notes should feel finished, not draft. |
| **Religious / personal practice** | The user's `AdhkarCounter` notes contain religious framing. KEEP this — it is the user's voice and a public part of his identity. The exception is *specific* devotional content (specific names, prayers) that the user has not opted to publish; default to including if it's general framing, ask the user if it's specific text. |
| **Identifying schedule details** | Specific dates, addresses, room numbers, "Tuesday 2pm at the SU." Genericize to "a weekday afternoon" or omit. |
| **Sensitive personal events** | Health, family conflict, finances. Strip without trace. |

The output must PRESERVE:

| category | what to keep |
|---|---|
| **Engineering reasoning** | Why decisions were made, what tradeoffs were considered. The whole point. |
| **Self-reflection** | "I struggled with X" / "I learned Y" — this is the project's value as a public artifact. |
| **Voice** | First-person, present tense, lowercase intimate. Do not corporatize. |
| **Markdown structure** | Headings, lists, callouts, code blocks. |
| **Wiki-links between cleaned notes** | If `note-a.md` links to `note-b.md` and both survive, the link survives (with a relative path inside the `notes/` folder). |

## Pipeline prompt (for an AI operator)

Copy-paste this into a fresh chat with a cheaper Claude (Haiku or Sonnet) or another agent. Substitute the inputs.

> You are operating the content pipeline for Rafan Quader's portfolio site. You have read-only access to the Obsidian vault and write access only to a single destination folder.
>
> **Inputs**
> - Vault project folder: `<paste vault path>`
> - Output folder: `<paste output path>`
> - Slug: `<paste slug>`
> - Project title: `<paste title>`
> - Project tagline (one line): `<paste tagline>`
> - GitHub URL (or "none"): `<paste>`
> - Download URL (or "none"): `<paste>`
>
> **What to produce**
>
> 1. **`index.md`** — the project's story. ~250–400 words of finished, edited prose in Rafan's voice (first-person, present tense, lowercase intimate, no marketing-speak). Drawn from the vault's existing process journals, architecture notes, and any decisions doc. Open with a hook, walk through the project, end on what he learned or what he'd try next. Include this exact frontmatter at the top:
>     ```yaml
>     ---
>     title: <title>
>     tagline: <tagline>
>     sort_order: <integer — see meta.yaml in similar projects>
>     github_url: <url or omit>
>     download_url: <url or omit>
>     cover_image: ./images/<chosen cover>.<ext>
>     status: <archived | active | shipped>
>     ---
>     ```
>
> 2. **`notes/*.md`** — 2–4 cleaned field notes. Pick the most representative pieces from the vault: typically the architecture doc, one decision (ADR), and one process-journal-style entry. For each: copy the original, then apply the cleaning rules (see [[04 - Content Pipeline#Cleaning rules]] below). Name them descriptively: `architecture.md`, `decision-<topic>.md`, `journal-<topic>.md`.
>
> 3. **`images/*`** — copy up to 4 representative screenshots (only if the user has supplied them in a designated Pictures folder; do not invent or AI-generate). Re-encode JPEGs to ~80% quality; PNGs to optimized. Filenames lowercase-kebab.
>
> 4. **`meta.yaml`**:
>     ```yaml
>     github_url: <url or omit>
>     download_url: <url or omit>
>     sort_order: <integer>
>     status: <archived | active | shipped>
>     ```
>
> **Cleaning rules** — strip: real names of people, contact info, credentials, internal references, live commercial opinions, in-progress thoughts that read as draft, identifying schedule details, sensitive personal events. Preserve: engineering reasoning, self-reflection, voice, markdown structure, wiki-links between surviving notes.
>
> **DO NOT** write outside the output folder.
> **DO NOT** modify any vault file.
> **DO NOT** commit. Stop after producing the files. Print a one-paragraph summary of what you wrote so the user can review the diff.

## Review gate

The user reviews each produced project folder before commit. Suggested git workflow:

```bash
cd ~/Developer/Portfolio_Website
git diff --stat src/content/projects/<slug>/   # quick overview
git diff src/content/projects/<slug>/          # full review
```

If something leaks, the user edits or re-runs the pipeline with adjusted inputs. The site has no live read of the vault — there is no failure mode where vault content reaches the site without passing through this review.

## Adding a new project — first-time workflow

1. Decide on `slug` and `sort_order`. (Slugs are stable; once a project ships, don't rename it.)
2. Run the pipeline (above). Produce the output folder.
3. Drop screenshots into `images/` (manually, if not done in step 2).
4. Review the diff. Edit as needed.
5. Commit. Cloudflare Pages auto-deploys.

## Re-running the pipeline on an existing project

If the vault note has been updated and the user wants to refresh the public version, **delete the output folder first** and re-run the pipeline. This avoids stale files.

```bash
rm -rf src/content/projects/<slug>/
# … run pipeline … review diff … commit
```

## Special case: no vault notes exist

Some `~/Developer/` projects (e.g. small experiments) don't have Obsidian docs. For those:

1. The user writes the story directly in `src/content/projects/<slug>/index.md`.
2. Drops a screenshot into `images/`.
3. No `notes/` folder needed.

The pipeline above is for vault-backed projects. Non-vault projects are hand-authored.

## see also

- [[Working Agreements]] — the durable rules
- [[03 - Content Model]] — where in the site each piece appears
- [[decisions/ADR-003-content-pipeline-curated-not-vault-link]] — why this approach instead of a live build read
