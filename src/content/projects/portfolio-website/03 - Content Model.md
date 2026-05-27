---
tags: [content, model]
---

# 03 — Content Model

> What every section of the site contains, where the content lives in the repo, and how to edit it without touching code.

The site is a single page (`src/pages/index.astro`) composed of named "rooms." The reader scrolls, with subtle section transitions and a fixed top nav that highlights the current room. (No actual tab switching like Legendary — the linear scroll is friendlier for a portfolio.)

## threshold

**File:** `src/components/Threshold.astro`

| element | content | where to edit |
|---|---|---|
| Name | `Rafan Quader` (lowercase styling via CSS) | `Threshold.astro` |
| Tagline line 1 | `Computer Science @ SJSU` | `Threshold.astro` |
| Tagline line 2 | `Research · Claude Code · Education` (text only, no links) | `Threshold.astro` |
| GitHub (nav) | `github ↗` → https://github.com/rquader | `TopNav.astro` |
| Portrait | optional; renders fade-to-ink when present | drop a file in `public/images/portrait.{avif,webp,jpg}` and reference it once in `Threshold.astro`. See [[Concept - Threshold Hero]] for the mask treatment. |
| Tree backdrop | low-opacity `RecursiveTreeBackdrop` instance | controlled by `src/lib/backdrop/tree.ts`; opacity prop set in `Threshold.astro` |
| Skip link | "skip to content" (a11y) | hardcoded |
| Scroll cue | one small ↓ near the bottom | hardcoded |

No CTA button. The room is contemplative; the affordance is "scroll."

## on me

**File:** `src/components/OnMe.astro`

A single short prose paragraph (~80–120 words), first-person, written by the user.

Bio prose is live (2026-05-27, from user's PDF). Synesthesia words: `massive change`, `better world`, `meaningful`, `Claude Code` via `<span data-syn-word>`.

The component supports [[Concept - Synesthesia Goals|synesthesia hover-coloring]] on a small set of words inside the paragraph. The user picks which words light up by wrapping them in `<span data-syn-word>` (no JS config; the primitive auto-detects). Suggested candidates (the user decides): the words inside *his stated objective* — "meaningful," "applications," "nudging" — but he can pick whatever he wants once the prose is real.

The live implementation uses the **same text**, but formats it as a short two-paragraph “lead + body” block with selective emphasis:

- `Computer Science` is bolded
- `high confidence` is italicized
- Synesthesia words remain the same (`massive change`, `better world`, `meaningful`, `Claude Code`)

| element | content | where to edit |
|---|---|---|
| Heading | "on me" | `OnMe.astro` |
| Bio paragraph | the prose above | `OnMe.astro` (replace verbatim) |
| Synesthesia words | configured via `data-syn-word` on individual `<span>`s | `OnMe.astro` |

## on the work

**File:** `src/components/OnTheWork.astro`

The DDD research card. Not a project in the gallery — it's a *narrative* role. One vertical card with a small framed visual (a quiet graphic — possibly a stylized "server → client" arrow or an iconic representation of disconnected/store-and-forward — TBD, placeholder for now).

| element | content | where to edit |
|---|---|---|
| Role | Undergraduate Research Assistant | `OnTheWork.astro` |
| Affiliation | Reed Systems Group, San José State University | `OnTheWork.astro` |
| Dates | Sep 2025 – present | `OnTheWork.astro` |
| Project name | Disconnected Data Distribution (DDD) | `OnTheWork.astro` |
| Story | 2–3 short paragraphs, written by the user. | `OnTheWork.astro` |
| External links | About (DDD site), GitHub (DDD repo) | `OnTheWork.astro` |

DDD story is live (2026-05-27, WiFi-Direct / villager → bus driver narrative).

## projects (`/projects`)

**File:** `src/pages/projects.astro` + `src/components/project/*`

Editorial alternating rows, Story/Info toggle, notes folio popup, modular link buttons. See [[specs/2026-05-24-projects-page-redesign-design]].

### Page header (live copy)

The header intro (DDD paragraph + Obsidian-notes line) is **shared** and always visible — the info · story toggle only swaps project chapter bodies and the footer outro.

| block | content | file |
|---|---|---|
| **header intro** | DDD / LinkedIn / projects; **info** vs **story** explained | `projects.astro` (always visible) |
| **header notes line** | AI-generated Obsidian notes — architecture + agent context | `projects.astro` `.projects-intro-notes` |
| **info outro** | Traceability paragraph; **open notes** affordance | `projects.astro` footer |
| **story outro** | "That's the thread so far…" | `projects.astro` footer |

Header intro paragraph (user-provided, always visible):

> Working on DDD, learning about Computer Science in school, and scrolling LinkedIn helped me gain a better understanding of the industry today and its often transactional nature. For me, beyond the impact of DDD, each of my projects — from an Arabic Dialect Map to a message-only Instagram macOS app — have been developed for a primary purpose for myself especially. You can select **info** for information on each project straight and individually. You can select **story** to go through a story in the code.

Obsidian notes line (below intro, always visible):

> For most of these projects, you can also access my primarily (if not entirely) AI-generated Obsidian notes. I can use these notes to better understand a project's architecture and as context for AI agents!

### Data source

```
src/content/projects/<slug>/
├── _index.md       ← info-mode body + frontmatter
├── story.md        ← story-mode segment (optional but present for all seven)
├── field/*.md      ← cleaned public notes (curated copies)
├── decisions/*.md  ← optional ADRs
└── images/*        ← GIFs/PNGs (live 2026-05-27)
```

Frontmatter on `_index.md` (example):

```yaml
title: Adhkar Counter
tagline: adhkar on your screen, one hotkey at a time
sort_order: 30
status: shipped
github_url: https://github.com/rquader/AdhkarCounter
media_mode: carousel
media_default: 0
media_items:
  - src: ./images/adhkar_counter_photo.png
    label: screenshot
  - src: ./images/adhkar_counter_demo.gif
    label: demo
wip: false
wip_note: ~
```

Optional legacy fields: `cover_image`, `cover_video`. Prefer `media_items` for new media.

Also optional: `web_url`, `demo_url`, `wip`, `wip_note`.

### Gallery roster (live 2026-05-27)

| slug | sort | WIP sticker | media mode | notes in repo |
|---|---|---|---|---|
| `web-crossword-generator` | 10 | yes | carousel (photo → gif) | no (private vault notes) |
| `arabic-dialect-map` | 20 | yes | stack (screenshot + gif) | `field/overview.md` |
| `adhkar-counter` | 30 | no | carousel (photo → gif) | `field/overview.md` |
| `legendary-ui-ux` | 40 | no | single gif | `field/overview.md` |
| `insta-dm` | 50 | yes | single gif (`contain` fit) | `field/overview.md` |
| `manim-wallpapers` | 60 | no | carousel (10 scenes, default `05_recursive_tree_v2`) | `field/overview.md` |
| `portfolio-website` | 70 | yes | single gif | `field/`, `decisions/` |

### project media (live 2026-05-27)

See [[decisions/ADR-019-project-media-carousel]].

| goal | set in `_index.md` | UI |
|---|---|---|
| Single GIF or image | `media_items` (one entry); omit `media_mode` or `single` | `ProjectMediaAsset` |
| Photo then demo GIF | `media_mode: carousel`, `media_default: 0` | `ProjectMediaCarousel` |
| Screenshot + GIF together | `media_mode: stack` | `ProjectMediaStack` (Arabic only today) |
| Manim scene browser | `media_mode: carousel`, `media_default: 4`, ten `01`–`10` GIFs | carousel with scene labels |
| Legacy screenshot | `cover_image: ./images/foo.png` | `Photo` + lightbox |
| Inline video | `cover_video` (+ optional `cover_image` poster) | `<video>` in media column |
| External demo | `demo_url` | **demo** button in link row |
| Live app | `web_url` | **live site** button |

Assets live in `src/content/projects/<slug>/images/`. GIFs only for V1 (no `.mp4` in repo). Per-slug CSS fit overrides on `[data-project-slug]` when `contain` is needed (Arabic screenshot, InstaDM).

### Field notes panel

When the user clicks a folder, a reading panel slides out (in-page, not a route change) showing:

1. The cover image at the top (small).
2. The `index.md` story (rendered Markdown, serif).
3. A list of "field notes" — one entry per `notes/*.md`, opening inline when clicked (accordion-style, not a separate page).
4. A footer with `github_url` and `download_url` if present.

Field notes are sub-renderable Markdown — the user can include images, code blocks, and inter-note links. (Links to other projects use relative paths; we resolve them at build time.)

## on recursion

**File:** `src/components/OnRecursion.astro`

A full-bleed section with the recursive tree at full opacity. Above the tree: ~150-word annotation explaining what the algorithm is doing. Below or beside the tree: a small live-parameter UI (sliders for `MAX_DEPTH`, `BRANCH_ANGLE`, `SHRINK`).

Why this section exists: see [[01 - Philosophy#six principles]] (item 1: the medium is the argument) and [[Concept - Recursive Tree Backdrop]].

**Placeholder in the component (marker-style, not prose):**

```
[PLACEHOLDER — your annotation on the recursive tree, target ~100–150
words. Or shorter, if you want it to be a caption. Or longer, if you
want it to be an essay. Your call. The tree exists with or without this
text; this section is here so you can say something about it.]
```

The live parameter sliders are optional; if they're too expensive to ship, we ship the section without them. See [[Open Questions#live-parameter knobs]].

| element | content | where to edit |
|---|---|---|
| Heading | "on recursion" | `OnRecursion.astro` |
| Annotation | the prose above | `OnRecursion.astro` |
| Tree | full-bleed canvas | `src/lib/backdrop/tree.ts` (instance configured in `OnRecursion.astro`) |
| Sliders | optional knob UI | `OnRecursion.astro` |

## on the trail

**File:** `src/components/OnTheTrail.astro`

Coursework + tools only (2026-05-27: **how I work** group removed per user). Resume is a prominent **resume (PDF)** button → `/Rafan_Quader_Resume.pdf` (source: `~/Downloads/Rafan_Quader_Resumé (1).pdf`).

**Coursework list (current):** trimmed coursework per user.

**Tools list (current):** removed `Manim` per user.

## coda (nav: **on the web**)

**File:** `src/components/Coda.astro`

Top nav label is **on the web** — same “on the …” rhythm as the other rooms; clearer than “socials” without breaking the essay tone. Section id stays `coda` for anchors and scroll-spy.

Repeats threshold tagline (two lines), then **github**, **linkedin**, and **email** as `project-link` style chips (not raw URLs).

## the high-frequency edit map

For the user editing the site without code knowledge:

| change | where |
|---|---|
| bio paragraph wording | `src/components/OnMe.astro` |
| add/remove a project | drop or remove a folder under `src/content/projects/<slug>/` |
| swap a project's cover image | replace the file in `src/content/projects/<slug>/images/` |
| update DDD story | `src/components/OnTheWork.astro` |
| drop in portrait photo | `public/images/portrait.{avif,webp,jpg}` and one prop in `Threshold.astro` |
| change tagline | `Threshold.astro` + `Coda.astro` |
| change resume | replace `public/Rafan_Quader_Resume.pdf` |
| project info/story | `src/content/projects/<slug>/_index.md` and `story.md` |
| WIP caveat text | `wip` + `wip_note` in `_index.md` frontmatter |

## see also

- [[Concept - Threshold Hero]]
- [[Concept - Synesthesia Goals]]
- [[Concept - Manila Folder Gallery]]
- [[Concept - Recursive Tree Backdrop]]
- [[04 - Content Pipeline]]
