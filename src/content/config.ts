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
    // ADR-021 — optional per-shell override. If set, the mobile shell
    // (<=720px) renders the project's media in this mode instead of
    // `media_mode`; the desktop shell keeps `media_mode`. Used to fix
    // arabic-dialect-map's mobile stack (its diagram + tall demo GIF
    // pair poorly stacked on phone widths — carousel is the answer).
    media_mode_mobile: z.enum(['single', 'carousel', 'stack']).optional(),
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
    // When false, never render the "open notes" button / popup even if
    // leftover markdown would otherwise count as projectFiles.
    // Crossword notes stay private between collaborators.
    notes: z.boolean().optional(),
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

const calendarDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD').refine(
  (value) => {
    const date = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
  },
  'Use a real calendar date',
);

const blog = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string().trim().min(1),
    titleAside: z.string().optional(),
    description: z.string().default(''),
    status: z.enum(['draft', 'published', 'coming-soon']).default('draft'),
    publishedAt: calendarDate.optional(),
    updatedAt: calendarDate.optional(),
    tags: z.array(z.string()).default([]),
  }).superRefine((post, ctx) => {
    if (post.status === 'published' && !post.publishedAt) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['publishedAt'], message: 'Published articles need a publication date.' });
    }
    if (post.status === 'published' && !post.description.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['description'], message: 'Published articles need a description.' });
    }
    if (post.updatedAt && post.publishedAt && post.updatedAt < post.publishedAt) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['updatedAt'], message: 'Updated date cannot precede publication.' });
    }
  }),
});

export const collections = { projects, projectFiles, projectStories, blog };
