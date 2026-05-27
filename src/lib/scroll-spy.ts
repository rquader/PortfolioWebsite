/**
 * @file scroll-spy.ts
 *
 * Tracks which section is currently the most-prominent in the viewport
 * and writes its slug to `document.documentElement.dataset.section`.
 * CSS rules on `:root[data-section="<slug>"]` then cascade per-section
 * accents (cursor companion colour, nav-link active state, etc.).
 *
 * Sections are discovered by querying `[data-section-id]` elements (the
 * room components set this), so adding a new section is purely additive.
 *
 * Spec: see Bootstrap Guide step 3.12 and
 *       [[Concept - Cursor Companion#per-section accent]].
 */

export interface ScrollSpyHandle {
  stop(): void;
}

interface Tracked {
  el: HTMLElement;
  slug: string;
  ratio: number;
}

export function initScrollSpy(): ScrollSpyHandle {
  if (typeof document === 'undefined' || typeof window === 'undefined') {
    return { stop: () => {} };
  }

  const sections = Array.from(
    document.querySelectorAll<HTMLElement>('[data-section-id]'),
  );
  if (sections.length === 0) return { stop: () => {} };

  const tracked: Tracked[] = sections.map((el) => ({
    el,
    slug: el.dataset.sectionId ?? '',
    ratio: 0,
  }));

  let lastAnnouncedSlug: string | null = null;

  function pickMostVisible(): void {
    let best: Tracked | null = null;
    for (const t of tracked) {
      if (best === null || t.ratio > best.ratio) best = t;
    }
    if (best && best.ratio > 0) {
      const slug = best.slug;
      document.documentElement.dataset.section = slug;
      // Toggle `is-current` on nav anchors so they highlight without
      // needing a :root-cascade rule (which doesn't survive Astro's
      // per-component scoping).
      const links = document.querySelectorAll<HTMLAnchorElement>('[data-nav-link]');
      for (const link of links) {
        link.classList.toggle('is-current', link.dataset.navLink === slug);
      }
      // Announce section change to screen readers. Throttle: only when
      // the visible section actually changes.
      if (slug !== lastAnnouncedSlug) {
        lastAnnouncedSlug = slug;
        const live = document.getElementById('section-live');
        if (live) {
          // Look up a human-readable label by grabbing the section's h2,
          // or fall back to the slug with dashes → spaces.
          const section = best.el;
          const heading = section.querySelector('h1, h2');
          const label = heading?.textContent?.trim() || slug.replace(/-/g, ' ');
          live.textContent = label;
        }
      }
    }
  }

  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        const t = tracked.find((x) => x.el === e.target);
        if (t) t.ratio = e.intersectionRatio;
      }
      pickMostVisible();
    },
    {
      // Thresholds at multiple points so the "most visible" comparison
      // is reasonably granular.
      threshold: [0, 0.25, 0.5, 0.75, 1],
    },
  );
  for (const t of tracked) io.observe(t.el);

  return {
    stop(): void {
      io.disconnect();
    },
  };
}
