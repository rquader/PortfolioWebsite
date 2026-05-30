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

export function isVideoMedia(src: string): boolean {
  return /\.(mp4|webm|mov)($|\?)/i.test(src);
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

export interface VideoSources {
  mp4: string;
  webm: string;
  poster: string;
}

/**
 * Given a project ID and a `.mp4` (or any video) src from frontmatter,
 * derive and resolve the sibling `.webm` and `.poster.jpg` URLs.
 * Falls back to the mp4 URL for poster if the .poster.jpg is not found.
 */
export function resolveProjectVideoSources(
  projectId: string,
  src: string,
): VideoSources {
  // Strip extension to get base name (e.g. "01_recursive_tree")
  const baseName = src.replace(/^\.\/images\//, '').replace(/^images\//, '').replace(/\.[^.]+$/, '');

  const mp4 = resolveProjectMediaUrl(projectId, `./images/${baseName}.mp4`);
  const webm = resolveProjectMediaUrl(projectId, `./images/${baseName}.webm`);
  const poster = resolveProjectMediaUrl(projectId, `./images/${baseName}.poster.jpg`);

  return { mp4, webm, poster };
}
