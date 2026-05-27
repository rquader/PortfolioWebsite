/**
 * @file content/config.ts
 *
 * Astro content collections for the project gallery.
 *
 * Each project folder lives at `src/content/projects/<slug>/`. The
 * folder MUST contain `_index.md` (Obsidian's landing-file convention)
 * which holds the project frontmatter and the info-mode body. It MAY
 * also contain a sibling `story.md` at the project root that holds
 * story-mode body content (used by the Story / Info toggle on
 * /projects). It MAY contain any number of additional `.md` files at
 * any nesting depth (for example `credits.md`,
 * `decisions/ADR-001-foo.md`, `field/architecture.md`), plus
 * `images/` and `videos/` asset subfolders referenced from markdown.
 *
 * Project notes render on `/projects` via ProjectNotesPopup.astro —
 * a centered "folio" popup with folder tabs and a prev/next stepper.
 *
 * Spec: [[specs/2026-05-24-projects-page-redesign-design]].
 */

import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const projects = defineCollection({
  loader: glob({ pattern: '**/_index.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    tagline: z.string(),
    sort_order: z.number(),
    cover_image: z.string().optional(),
    cover_video: z.string().optional(),
    media_items: z
      .array(
        z.object({
          src: z.string(),
          label: z.string().optional(),
        }),
      )
      .optional(),
    media_mode: z.enum(['single', 'carousel', 'stack']).optional(),
    media_default: z.number().optional().default(0),
    status: z.enum(['archived', 'active', 'shipped']).default('shipped'),
    // Modular link URLs — only buttons for present URLs render in ProjectLinks.
    github_url: z.string().url().optional(),
    download_url: z.string().url().optional(),
    web_url: z.string().url().optional(),
    app_store_url: z.string().url().optional(),
    demo_url: z.string().url().optional(),
    paper_url: z.string().url().optional(),
    wip: z.boolean().optional().default(false),
    wip_note: z.string().optional(),
  }),
});

/**
 * projectFiles — every `.md` file living anywhere under a project
 * folder EXCEPT the two special root files (`_index.md` anywhere,
 * `story.md` AT the project root only). A hypothetical nested file
 * named `story.md` (e.g. `field/story.md`) is still treated as a
 * regular note.
 *
 * `generateId` preserves the on-disk path verbatim (case + spaces)
 * instead of the loader's default slugification — so the notes popup
 * can show real folder/file names ("05 - Decisions", "System
 * Architecture") and the folder tree mirrors the Obsidian structure.
 * Each entry's id is therefore `<slug>/<rel-path-no-ext>`, e.g.
 * `adhkar-counter/05 - Decisions/ADR-001 V1 Surface and Interaction Model`.
 */
const projectFiles = defineCollection({
  loader: glob({
    pattern: ['**/*.md', '!**/_index.md', '!*/story.md'],
    base: './src/content/projects',
    generateId: ({ entry }) => entry.replace(/\.md$/, ''),
  }),
  schema: z.object({
    title: z.string().optional(),
    sort_order: z.number().optional().default(0),
  }),
});

/**
 * projectStories — body-only story-mode content per project. The
 * loader pattern is single-segment (one directory then `story.md`)
 * so only the project-root story file is loaded; nested files of the
 * same name remain regular notes. The collection is optional per
 * project — missing `story.md` means story-mode falls back to a
 * placeholder marker in ProjectChapter.
 */
const projectStories = defineCollection({
  loader: glob({ pattern: '*/story.md', base: './src/content/projects' }),
  schema: z.object({}).optional(),
});

export const collections = { projects, projectFiles, projectStories };
