/**
 * @file project-media-url.ts
 *
 * Resolves `./images/...` paths from project frontmatter to build URLs
 * for co-located assets under `src/content/projects/<slug>/images/`.
 */

const mediaUrlByPath = import.meta.glob<string>(
  '../content/projects/**/images/*',
  { eager: true, query: '?url', import: 'default' },
);

export function isAnimatedMedia(src: string): boolean {
  return /\.gif($|\?)/i.test(src);
}

export function resolveProjectMediaUrl(projectId: string, relSrc: string): string {
  const slug = projectId.endsWith('/_index')
    ? projectId.slice(0, -'/_index'.length)
    : projectId;
  const filename = relSrc.replace(/^\.\//, '').replace(/^images\//, '');
  const needle = `/content/projects/${slug}/images/${filename}`;

  for (const [key, url] of Object.entries(mediaUrlByPath)) {
    if (key.includes(needle)) return url;
  }

  return relSrc;
}
