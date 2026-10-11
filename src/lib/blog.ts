import type { CollectionEntry } from 'astro:content';

export function visiblePosts(posts: CollectionEntry<'blog'>[], includeDrafts = false) {
  return posts
    .filter((post) => includeDrafts || post.data.status !== 'draft')
    .sort((a, b) => (b.data.publishedAt ?? '').localeCompare(a.data.publishedAt ?? '') || a.data.title.localeCompare(b.data.title));
}

export function formatPostDate(value: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC',
  }).format(new Date(`${value}T00:00:00Z`));
}
