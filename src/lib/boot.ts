/**
 * @file boot.ts
 *
 * The single `requestAnimationFrame` loop for the entire page. Primitives
 * (recursive tree backdrop, inertial typography, cursor companion, …)
 * register a tick callback via `registerTick(fn)`; the loop dispatches
 * each frame.
 *
 * Why a central loop: lower scheduling overhead than N independent rAFs,
 * and the reduced-motion gate applies uniformly — when the user prefers
 * reduced motion the loop stops entirely (CPU savings). Primitives draw
 * their rest frame on init and stay static.
 *
 * The frame delta `dt` is clamped to 50ms so a tab-switch resume doesn't
 * produce a huge time jump.
 *
 * Spec: [[02 - Architecture#the single raf loop pattern]].
 */

import { isReducedMotion, onReducedMotionChange } from './reduced-motion';

export type TickFn = (dt: number, t: number) => void;

const ticks: Set<TickFn> = new Set();
const MAX_DT = 0.05; // seconds — caps long pauses (tab switching)

let rafId: number | null = null;
let last = 0;
let booted = false;

function frame(t: number): void {
  const dt = Math.min((t - last) / 1000, MAX_DT);
  last = t;

  for (const fn of ticks) {
    try {
      fn(dt, t);
    } catch (err) {
      // One primitive's exception must not crash the whole loop.
      // Remove it; the user gets a console line and the rest keep running.
      // eslint-disable-next-line no-console
      console.error('[boot] tick threw, dropping primitive:', err);
      ticks.delete(fn);
    }
  }

  rafId = requestAnimationFrame(frame);
}

function startLoop(): void {
  if (rafId != null) return;
  last = performance.now();
  rafId = requestAnimationFrame(frame);
}

function stopLoop(): void {
  if (rafId == null) return;
  cancelAnimationFrame(rafId);
  rafId = null;
}

/**
 * Register a per-frame tick callback. Returns an unsubscribe function
 * that removes the callback from future frames.
 *
 * Primitives may register at any time. If `startBoot()` has not run
 * yet (e.g., import-order quirk), the callback is queued and starts
 * receiving frames as soon as boot does.
 */
export function registerTick(fn: TickFn): () => void {
  ticks.add(fn);
  return () => {
    ticks.delete(fn);
  };
}

/**
 * Start the loop. Idempotent; safe to call multiple times. If the user
 * currently prefers reduced motion, the loop does not start — but a
 * subscription watches for preference changes and starts/stops accordingly.
 *
 * Called once from `src/layouts/Base.astro`.
 */
export function startBoot(): void {
  if (booted) return;
  booted = true;

  if (!isReducedMotion()) startLoop();

  onReducedMotionChange((reduced) => {
    if (reduced) stopLoop();
    else startLoop();
  });

  // Visibility gate: pause the rAF loop when the tab/window is hidden so
  // the browser doesn't burn CPU/battery for an invisible canvas. Resume
  // when the tab comes back — but only if reduced-motion is not active
  // (reduced-motion already stopped the loop; we must not restart it here).
  // The existing MAX_DT clamp in `frame()` absorbs the time gap on resume.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stopLoop();
    } else if (!isReducedMotion()) {
      startLoop();
    }
  });
}
