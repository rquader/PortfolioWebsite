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

  function applySlug(slug: string, bestEl?: HTMLElement): void {
    document.documentElement.dataset.section = slug;
    const links = document.querySelectorAll<HTMLAnchorElement>('[data-nav-link]');
    for (const link of links) {
      link.classList.toggle('is-current', link.dataset.navLink === slug);
    }
    if (slug !== lastAnnouncedSlug) {
      lastAnnouncedSlug = slug;
      const live = document.getElementById('section-live');
      if (live) {
        const heading = bestEl?.querySelector('h1, h2');
        const label = heading?.textContent?.trim() || slug.replace(/-/g, ' ');
        live.textContent = label;
      }
    }
  }

  function viewportRatio(el: HTMLElement): number {
    const rect = el.getBoundingClientRect();
    const vpTop = 0;
    const vpBottom = window.innerHeight;
    const overlap = Math.max(0, Math.min(rect.bottom, vpBottom) - Math.max(rect.top, vpTop));
    const denom = Math.max(1, Math.min(rect.height, window.innerHeight));
    return overlap / denom;
  }

  function pickMostVisible(): void {
    let best: Tracked | null = null;
    for (const t of tracked) {
      // IntersectionObserver ratios can get "sticky" at boundaries (especially
      // near the bottom of the page). Recompute a scroll-accurate ratio from
      // geometry so the active section changes immediately as you scroll.
      const r = viewportRatio(t.el);
      t.ratio = r;
      if (best === null || r > best.ratio) best = t;
    }
    if (best && best.ratio > 0) {
      applySlug(best.slug, best.el);
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

  // Bottom-of-page highlight reliability also needs a scroll listener,
  // because IntersectionObserver callbacks won't necessarily fire when
  // you're only scrolling within already-intersecting sections.
  window.addEventListener('scroll', pickMostVisible, { passive: true });

  return {
    stop(): void {
      io.disconnect();
      window.removeEventListener('scroll', pickMostVisible);
    },
  };
}
