# Writing blog posts

Blog articles are Markdown files in `src/content/blog/`. You can edit them in your preferred Markdown editor. To use Obsidian, open this repository as a separate vault, or write in your personal vault and explicitly copy only the finished article into this folder.
The build reads this repository only; it does not read your personal Obsidian
vault.

## Start an article

From the repository root, run:

```sh
npm run new:post -- "A clear article title"
```

The command creates `src/content/blog/a-clear-article-title.md` with draft
frontmatter and a starter heading. It makes the content folder if needed and
refuses to replace an existing article with the same slug. Titles cannot
contain `/` or `\`, so they cannot create nested or outside paths.

Open the new Markdown file in Obsidian (or your editor) and replace the draft
note with the article. Keep the file in `src/content/blog/`; that folder is
where Astro discovers blog posts.

## Frontmatter and publishing

An unfinished article starts with:

```yaml
---
title: "A clear article title"
description: ""
status: draft
tags: []
---
```

For a quieter second line beneath a title, add an optional `titleAside` field (for example, a parenthetical). It is displayed smaller and muted on both the listing and article page. Leave `tags: []` to hide tags until you need them.

`title`, `description`, and `tags` describe the article. The title is quoted
as a JSON string by the scaffolder, which is also valid YAML and safely handles
quotes and punctuation. Add tags as a YAML list, for example `tags: [design,
learning]`.

Draft articles are available in the local Astro development site, but are
excluded from production builds. An empty description is fine while drafting.
To publish, set `status: published`, write a nonempty description, and add
`publishedAt` as a quoted `YYYY-MM-DD` date:

```yaml
---
title: "A clear article title"
description: "A short summary that helps readers decide whether to read."
status: published
publishedAt: "2026-10-11"
tags: [design, learning]
---
```

Use `updatedAt: "YYYY-MM-DD"` when you make a substantial later revision.
Published articles require both a nonempty description and `publishedAt`.

To announce an upcoming article before its body is ready, use
`status: coming-soon`. This creates a public placeholder. Leave the body empty
after the frontmatter; the site shows the title and description as the
placeholder on its own article page; any draft body is not shown.

## Markdown formatting

Use ordinary Markdown headings, lists, quotes, code fences, and links:

````md
## A section

Start with a short paragraph. Use **bold** only when it helps a reader scan.

### A smaller point

- First item
- Second item

> A short quotation or a note worth setting apart.

```js
const answer = 42;
```

[A useful link](https://example.com)
````

Start the article with the `##` heading created by the scaffolder, then use
`###` headings for sections beneath it. Avoid skipping heading levels; the
article title is already shown by the page.

## Images

Keep article images together in `src/content/blog/images/` and reference them
from a post with a relative Markdown path:

```md
![A short description of the image](./images/diagram.png)
```

Write useful alt text for images that convey information. Astro processes
local Markdown images during the build. Use a descriptive filename and avoid
spaces where possible.

## Preview

Run the local site while writing:

```sh
npm run dev
```

Open the local address printed by Astro and visit the blog page. Draft posts
appear there for review. Before changing a draft to `published`, check its
formatting and metadata, then verify a production build:

```sh
npm run build
npm run preview
```

The preview command serves the generated production site. Drafts do not appear
there; published posts do. A `coming-soon` entry remains visible as its public
placeholder.
