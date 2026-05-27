# Portfolio Website

Personal portfolio site for Rafan Quader. CS @ SJSU.

## Where the canonical docs live

**This README is not the source of truth.** The canonical project documentation lives in the user's Obsidian vault at:

```
~/Library/Mobile Documents/iCloud~md~obsidian/Documents/RafansPortableVault/Programming/Portfolio_Website/
```

Read those first. They contain:

- Philosophy, architecture, and content model
- Per-primitive Concept docs
- Tradeoff-documented ADRs for every significant decision
- A step-by-step Bootstrap Guide
- A Next Agent Handoff doc

If you are an AI agent picking this up: open `06 - Next Agent Handoff.md` in the vault folder above. It tells you everything you need.

## Repo state (as of 2026-05-17)

This repo is currently **empty by design** — scaffolding pending. See the Bootstrap Guide in the docs.

## Stack (planned)

- Astro + TypeScript
- Vanilla DOM / Canvas 2D for primitives
- Hand-written CSS
- Cloudflare Pages for hosting (GitHub Pages documented as fallback)

## Hard rules

- **Never read from the user's Obsidian vault in the build.** The vault path must not appear in any source file or config.
- **Never invent live-site body copy.** Home and `/projects` prose is user-authored (see [SESSION_HANDOFF.md](SESSION_HANDOFF.md)).
- **Every non-trivial decision gets an ADR** in the Obsidian `decisions/` folder.

## Contact

- Email: rafan.quader@sjsu.edu
- GitHub: https://github.com/rquader
- LinkedIn: https://www.linkedin.com/in/rafan-quader/
