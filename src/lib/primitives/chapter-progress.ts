/**
 * @file chapter-progress.ts
 *
 * Per-chapter reading-progress bar on the /projects page + active-chapter
 * tracking for the sticky chapter rail (visible ≥1100px).
 *
 * Each chapter element has `[data-project-slug]`. The progress bar lives
 * at the bottom edge of the chapter; the rail item lives in the right
 * column (`[data-rail-item="<slug>"]`).
 *
 * On scroll we:
 *   - compute a 0..1 progress per chapter (0 when below viewport, 1 when
 *     fully scrolled past) and write it to the bar's `width` style;
 *   - pick the chapter whose top has crossed the 45% viewport probe and
 *     mark its rail item with `.is-current`.
 *
 * Driven by `scroll` + `resize` events. Passive listener; no rAF
 * scheduling here because the math is cheap and the existing rAF loop
 * (boot.ts) handles its own concerns. `prefers-reduced-motion` keeps the
 * tracking active (it's not animation, it's just classes) but the bar's
 * `width` transition is gated in CSS.
 *
 * Spec: [[decisions/ADR-021-desktop-overhaul-and-dual-shell-mobile]]
 */

export interface ChapterProgressHandle {
  stop(): void;
}

interface Chapter {
  slug: string;
  el: HTMLElement;
  bar: HTMLElement | null;
  railItem: HTMLElement | null;
}

let active: ChapterProgressHandle | null = null;

export function initChapterProgress(): ChapterProgressHandle {
  active?.stop();

  if (typeof document === 'undefined' || typeof window === 'undefined') {
    const noop = { stop: () => {} };
    active = noop;
    return noop;
  }

  const els = Array.from(
    document.querySelectorAll<HTMLElement>('.project-chapter[data-project-slug]'),
  );
  if (els.length === 0) {
    const noop = { stop: () => {} };
    active = noop;
    return noop;
  }

  const chapters: Chapter[] = els.map((el) => {
    const slug = el.dataset.projectSlug ?? '';
    return {
      slug,
      el,
      bar: el.querySelector<HTMLElement>('.project-chapter-progress-bar'),
      railItem: document.querySelector<HTMLElement>(
        `[data-rail-item="${slug}"]`,
      ),
    };
  });

  let currentSlug: string | null = null;

  function compute(): void {
    const vh = window.innerHeight;
    const probe = window.scrollY + vh * 0.45;
    let next: string | null = null;

    for (const c of chapters) {
      const top = c.el.offsetTop;
      const height = c.el.offsetHeight;
      const bot = top + height;

      // active chapter: the lowest one whose top has crossed the probe.
      if (top <= probe) next = c.slug;

      // progress 0..1
      const startY = top - vh * 0.6;
      const endY = bot - vh * 0.2;
      const span = Math.max(1, endY - startY);
      const p = Math.max(0, Math.min(1, (window.scrollY - startY) / span));
      if (c.bar) c.bar.style.width = (p * 100).toFixed(1) + '%';
    }

    if (next !== currentSlug) {
      currentSlug = next;
      for (const c of chapters) {
        if (!c.railItem) continue;
        c.railItem.classList.toggle('is-current', c.slug === next);
        if (c.slug === next) c.railItem.setAttribute('aria-current', 'true');
        else c.railItem.removeAttribute('aria-current');
      }
    }
  }

  compute();
  window.addEventListener('scroll', compute, { passive: true });
  window.addEventListener('resize', compute);

  // The mode toggle changes chapter heights (story body vs info body have
  // different lengths). Recompute on the next paint after the toggle.
  function onModeChange(): void {
    requestAnimationFrame(compute);
  }
  const toggleObserver = new MutationObserver(onModeChange);
  toggleObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-page-mode'],
  });

  const handle: ChapterProgressHandle = {
    stop(): void {
      window.removeEventListener('scroll', compute);
      window.removeEventListener('resize', compute);
      toggleObserver.disconnect();
    },
  };
  active = handle;
  return handle;
}
