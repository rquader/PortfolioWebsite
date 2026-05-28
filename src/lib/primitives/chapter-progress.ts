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
 * Driven by `scroll` + `resize` events, but coalesced via
 * `requestAnimationFrame` to avoid doing layout reads on every scroll
 * event. `prefers-reduced-motion` keeps the tracking active (it's not
 * animation, it's just classes) but the bar's transition is gated in CSS.
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
  lastProgress: number;
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
      lastProgress: -1,
    };
  });

  let currentSlug: string | null = null;

  let rafId: number | null = null;
  let lastVh = -1;

  function updateProgress(c: Chapter, p: number): void {
    // Avoid unnecessary style writes; transform updates are cheap but not free.
    if (Math.abs(p - c.lastProgress) < 0.002) return;
    c.lastProgress = p;
    if (c.bar) c.bar.style.transform = `scaleX(${p.toFixed(4)})`;
  }

  function pickCurrentSlug(vh: number): string | null {
    const probeY = vh * 0.45;
    let candidate: string | null = null;
    let candidateTop = -Infinity;

    for (const c of chapters) {
      if (!c.slug) continue;
      const rect = c.el.getBoundingClientRect();

      // Only consider chapters that are at least partially on-screen.
      if (rect.bottom <= 0 || rect.top >= vh) continue;

      // Choose the chapter whose top is closest below the probe.
      if (rect.top <= probeY && rect.top > candidateTop) {
        candidateTop = rect.top;
        candidate = c.slug;
      }
    }

    // If nothing is below the probe (e.g. at very top), fall back to the
    // first visible chapter to keep the selection stable.
    if (!candidate) {
      for (const c of chapters) {
        if (!c.slug) continue;
        const rect = c.el.getBoundingClientRect();
        if (rect.bottom > 0 && rect.top < vh) return c.slug;
      }
    }
    return candidate;
  }

  function computeNow(): void {
    rafId = null;

    const vh = window.innerHeight;
    lastVh = vh;

    const spanPad = vh * 0.4; // derived from start/end offsets
    const startLine = vh * 0.6;

    for (const c of chapters) {
      const rect = c.el.getBoundingClientRect();
      const denom = Math.max(1, rect.height + spanPad);
      const p = Math.max(0, Math.min(1, (startLine - rect.top) / denom));
      updateProgress(c, p);
    }

    const next = pickCurrentSlug(vh);
    if (next !== currentSlug) {
      currentSlug = next;
      for (const c of chapters) {
        if (!c.railItem) continue;
        const isCurrent = c.slug === next;
        c.railItem.classList.toggle('is-current', isCurrent);
        if (isCurrent) c.railItem.setAttribute('aria-current', 'true');
        else c.railItem.removeAttribute('aria-current');
      }
    }
  }

  function schedule(): void {
    if (rafId != null) return;
    rafId = window.requestAnimationFrame(computeNow);
  }

  computeNow();
  window.addEventListener('scroll', schedule, { passive: true });
  const onResize = (): void => {
    // Resize can change both probe thresholds and chapter layout.
    // Coalesce into the same rAF tick as scroll.
    if (window.innerHeight !== lastVh) schedule();
    else schedule();
  };
  window.addEventListener('resize', onResize);

  // The mode toggle changes chapter heights (story body vs info body have
  // different lengths). Recompute on the next paint after the toggle.
  function onModeChange(): void {
    schedule();
  }
  const toggleObserver = new MutationObserver(onModeChange);
  toggleObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-page-mode'],
  });

  const handle: ChapterProgressHandle = {
    stop(): void {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', onResize);
      toggleObserver.disconnect();
      if (rafId != null) window.cancelAnimationFrame(rafId);
    },
  };
  active = handle;
  return handle;
}
