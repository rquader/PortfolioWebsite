/**
 * @file reduced-motion.ts
 *
 * Wraps the `prefers-reduced-motion: reduce` media query. The animation
 * primitives (tree backdrop, inertial typography, cursor companion) call
 * `isReducedMotion()` to decide whether to draw a static rest frame or
 * an animated one. The boot loop in `boot.ts` uses it to pause/resume
 * the rAF chain entirely.
 *
 * This is the JS layer of a three-level gate (CSS / JS-loop / entrance).
 * CSS layer: `src/styles/global.css#@media (prefers-reduced-motion: reduce)`.
 *
 * Spec: [[02 - Architecture#accessibility]].
 */

const mql =
  typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-reduced-motion: reduce)')
    : null;

export function isReducedMotion(): boolean {
  return mql?.matches ?? false;
}

/**
 * Subscribe to changes in the user's reduced-motion preference. Returns
 * an unsubscribe function. Safe to call in SSR contexts (becomes a no-op).
 */
export function onReducedMotionChange(
  handler: (reduced: boolean) => void,
): () => void {
  if (!mql) return () => {};
  const listener = (e: MediaQueryListEvent) => handler(e.matches);
  mql.addEventListener('change', listener);
  return () => mql.removeEventListener('change', listener);
}
