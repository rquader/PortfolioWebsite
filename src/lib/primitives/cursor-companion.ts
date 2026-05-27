/**
 * @file cursor-companion.ts
 *
 * Ambient cursor body — a soft dot inside a breathing ring that follows
 * the system pointer with one-frame lag. The OS cursor stays; this is
 * its companion, not a replacement.
 *
 * Per-section accent color via the CSS variable `--companion-color`,
 * which is set by the scroll-spy on `:root[data-section="<slug>"]`. The
 * CSS handles the colour transition.
 *
 * Hidden on coarse pointers (touch) — created only when fine-pointer
 * matches. Reduced motion: the breathing-ring animation is disabled at
 * the CSS layer; the lag-tween becomes instant here.
 *
 * Spec: [[Concept - Cursor Companion]] in the Obsidian docs.
 */

import { registerTick } from '../boot';
import { isReducedMotion } from '../reduced-motion';

export interface CursorCompanionHandle {
  stop(): void;
}

function makeElement(): HTMLDivElement {
  const root = document.createElement('div');
  root.id = 'cursor-companion';
  root.setAttribute('aria-hidden', 'true');
  const body = document.createElement('div');
  body.className = 'companion-body';
  const ring = document.createElement('div');
  ring.className = 'companion-ring';
  root.append(body, ring);
  return root;
}

export function initCursorCompanion(): CursorCompanionHandle {
  if (typeof document === 'undefined' || typeof window === 'undefined') {
    return { stop: () => {} };
  }

  // Don't create the companion on touch devices — touch has no hover
  // affordance, so an ambient cursor body has nothing to follow.
  if (window.matchMedia('(pointer: coarse)').matches) {
    return { stop: () => {} };
  }

  const el = makeElement();
  document.body.appendChild(el);

  const pointer = { x: -1000, y: -1000 };
  let tx = -1000;
  let ty = -1000;
  let seenPointer = false;

  const onMove = (e: PointerEvent) => {
    pointer.x = e.clientX;
    pointer.y = e.clientY;
    if (!seenPointer) {
      tx = pointer.x;
      ty = pointer.y;
      seenPointer = true;
    }
  };
  window.addEventListener('pointermove', onMove, { passive: true });

  const unregister = registerTick((dt) => {
    if (isReducedMotion()) {
      tx = pointer.x;
      ty = pointer.y;
    } else {
      // Critically smooth, dt-stable: alpha = 1 - 0.001^dt.
      // At 60fps (dt≈0.0167), alpha ≈ 0.11 — visible one-frame lag.
      const safeDt = Math.max(dt, 1 / 240);
      const alpha = 1 - Math.pow(0.001, safeDt);
      tx += (pointer.x - tx) * alpha;
      ty += (pointer.y - ty) * alpha;
    }
    el.style.transform = `translate3d(${tx.toFixed(2)}px, ${ty.toFixed(2)}px, 0)`;
  });

  return {
    stop(): void {
      unregister();
      window.removeEventListener('pointermove', onMove);
      el.remove();
    },
  };
}
