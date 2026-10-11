/**
 * Deliberate same-page anchor movement.
 *
 * Cross-page fragments stay entirely native. Base.astro disables CSS smooth
 * scrolling while those fragments are first resolved, so a deep link arrives
 * at its chapter without animating through the intervening page.
 */

const MIN_DURATION_MS = 650;
const MAX_DURATION_MS = 1100;
const INTERRUPTING_KEYS = new Set([
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'ArrowUp',
  'End',
  'Escape',
  'Home',
  'PageDown',
  'PageUp',
  ' ',
  'Spacebar',
  'Tab',
]);

interface ScrollAnimationOptions {
  from: number;
  to: number;
  duration: number;
  now: () => number;
  requestFrame: (callback: FrameRequestCallback) => number;
  cancelFrame: (handle: number) => void;
  scrollTo: (top: number) => void;
  onStop?: (completed: boolean) => void;
}

/** Distance-aware, but deliberately bounded so short and long jumps both feel calm. */
export function anchorScrollDuration(distance: number): number {
  return Math.min(MAX_DURATION_MS, MIN_DURATION_MS + Math.sqrt(Math.abs(distance)) * 9);
}

export function easeInOutCubic(progress: number): number {
  const p = Math.min(1, Math.max(0, progress));
  return p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
}

/**
 * Small injectable animation core. The browser adapter below supplies rAF and
 * scrollTo; keeping this pure makes cancellation and final positioning testable.
 */
export function startScrollAnimation(options: ScrollAnimationOptions): () => void {
  const startedAt = options.now();
  let frame = 0;
  let stopped = false;

  const stop = (completed: boolean): void => {
    if (stopped) return;
    stopped = true;
    if (!completed) options.cancelFrame(frame);
    options.onStop?.(completed);
  };

  const tick = (time: number): void => {
    if (stopped) return;
    const progress = Math.min(1, Math.max(0, (time - startedAt) / options.duration));
    options.scrollTo(options.from + (options.to - options.from) * easeInOutCubic(progress));
    if (progress >= 1) {
      // Land on the exact pixel rather than leaving a fractional rAF result.
      options.scrollTo(options.to);
      stop(true);
      return;
    }
    frame = options.requestFrame(tick);
  };

  frame = options.requestFrame(tick);
  return () => stop(false);
}

export function isAnchorScrollInterruption(event: { type: string; key?: string }): boolean {
  return event.type !== 'keydown' || (
    typeof event.key === 'string' && INTERRUPTING_KEYS.has(event.key)
  );
}

function targetForHash(hash: string): HTMLElement | null {
  let id: string;
  try {
    id = decodeURIComponent(hash.slice(1));
  } catch {
    return null;
  }
  if (!id) return null;
  return document.getElementById(id) ?? document.getElementsByName(id)[0] ?? null;
}

function scrollPaddingTop(): number {
  const value = Number.parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop);
  return Number.isFinite(value) ? value : 0;
}

function scrollMarginTop(target: HTMLElement): number {
  const value = Number.parseFloat(getComputedStyle(target).scrollMarginTop);
  return Number.isFinite(value) ? value : 0;
}

function destinationFor(target: HTMLElement): number {
  const desired = window.scrollY + target.getBoundingClientRect().top
    - scrollPaddingTop()
    - scrollMarginTop(target);
  const maximum = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
  return Math.min(maximum, Math.max(0, desired));
}

function focusDestination(target: HTMLElement): void {
  const focusTarget = target.matches('h1, h2, h3, h4, h5, h6, summary')
    ? target
    : target.querySelector<HTMLElement>('h1, h2, h3, h4, h5, h6, summary') ?? target;
  const needsTemporaryTabIndex = !focusTarget.hasAttribute('tabindex');
  if (needsTemporaryTabIndex) focusTarget.setAttribute('tabindex', '-1');
  focusTarget.focus({ preventScroll: true });
  if (needsTemporaryTabIndex) {
    focusTarget.addEventListener('blur', () => focusTarget.removeAttribute('tabindex'), { once: true });
  }
}

function isSameDocument(url: URL): boolean {
  return url.origin === window.location.origin
    && url.pathname === window.location.pathname
    && url.search === window.location.search;
}

function isNotesHash(hash: string): boolean {
  return hash === '#notes' || hash.startsWith('#notes/');
}

function releaseInitialFragmentGuard(): void {
  const root = document.documentElement;
  if (!root.hasAttribute('data-anchor-arrival')) return;

  const release = (): void => {
    // One frame lets load-driven layout settle; the next restores the site's
    // normal scrolling rule for future same-page interactions.
    requestAnimationFrame(() => requestAnimationFrame(() => {
      root.removeAttribute('data-anchor-arrival');
      if (root.style.scrollBehavior === 'auto') root.style.removeProperty('scroll-behavior');
    }));
  };

  if (document.readyState === 'complete') release();
  else window.addEventListener('load', release, { once: true });
}

export function initAnchorNavigation(): void {
  releaseInitialFragmentGuard();

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let cancelCurrent: (() => void) | null = null;

  const cancel = (): void => {
    cancelCurrent?.();
  };

  reducedMotion.addEventListener('change', (event) => {
    if (event.matches) cancel();
  });

  for (const type of ['wheel', 'touchstart', 'touchmove', 'pointerdown'] as const) {
    window.addEventListener(type, cancel, { passive: true });
  }
  window.addEventListener('keydown', (event) => {
    if (isAnchorScrollInterruption(event)) cancel();
  });
  window.addEventListener('hashchange', cancel);
  window.addEventListener('popstate', cancel);
  window.addEventListener('resize', cancel, { passive: true });

  document.addEventListener('click', (event) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    const source = event.target;
    if (!(source instanceof Element)) return;
    const link = source.closest<HTMLAnchorElement>('a[href]');
    // Skip links are an accessibility escape hatch and should remain instant,
    // including the browser's native focus-navigation behavior.
    if (!link || link.matches('.skip-link') || link.hasAttribute('download')) return;
    const targetName = link.getAttribute('target');
    if (targetName && targetName.toLowerCase() !== '_self') return;

    const url = new URL(link.href, window.location.href);
    if (!url.hash || isNotesHash(url.hash) || !isSameDocument(url)) return;
    const target = targetForHash(url.hash);
    if (!target || reducedMotion.matches) return;

    event.preventDefault();
    cancel();

    const oldURL = window.location.href;
    if (url.href !== oldURL) window.history.pushState(window.history.state, '', url);
    // DDDStory uses hashchange to reveal folded chapters. pushState deliberately
    // does not emit it, so mirror the native event before measuring the target.
    window.dispatchEvent(new HashChangeEvent('hashchange', { oldURL, newURL: url.href }));

    const from = window.scrollY;
    const to = destinationFor(target);
    const root = document.documentElement;
    const previousScrollBehavior = root.style.scrollBehavior;
    root.style.scrollBehavior = 'auto';

    cancelCurrent = startScrollAnimation({
      from,
      to,
      duration: anchorScrollDuration(to - from),
      now: () => performance.now(),
      requestFrame: (callback) => requestAnimationFrame(callback),
      cancelFrame: (handle) => cancelAnimationFrame(handle),
      scrollTo: (top) => window.scrollTo(0, top),
      onStop: (completed) => {
        cancelCurrent = null;
        if (previousScrollBehavior) root.style.scrollBehavior = previousScrollBehavior;
        else root.style.removeProperty('scroll-behavior');
        if (completed) focusDestination(target);
      },
    });
  });
}
