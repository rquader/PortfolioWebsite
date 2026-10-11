// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// GitHub Pages is the current host. Set PUBLIC_SITE_URL when a custom
// domain is actually connected; social image URLs must use a live origin.
const SITE = process.env.PUBLIC_SITE_URL ?? 'https://rquader.github.io';

// `base` is the URL path prefix the site is served from.
// - GitHub Pages project page (https://user.github.io/repo/) → base = '/repo'
// - GH user site (https://user.github.io/) or custom domain   → base = '/'
// The deploy workflow sets PUBLIC_BASE_URL to '/<repo-name>'; local dev
// (without the env var set) keeps base = '/' so `astro dev` Just Works.
const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL ?? '/';

// https://astro.build/config
export default defineConfig({
  site: SITE,
  base: PUBLIC_BASE_URL,
  integrations: [sitemap({ filter: (page) => !page.includes('/notes/') })],
  build: {
    inlineStylesheets: 'auto',
  },
});
