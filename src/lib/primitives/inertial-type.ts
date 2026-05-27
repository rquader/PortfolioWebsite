/**
 * @file inertial-type.ts
 *
 * Letter-level inertial typography. Each marked letter is a spring-damped
 * node; the pointer pushes letters aside softly and they spring back to
 * rest.
 *
 * Two markup forms supported:
 *   1. Explicit per-letter spans: `<span data-inertial>r</span><span data-inertial>a</span>…`
 *   2. Wrapper attribute: `<h2 data-inertial-text>on me</h2>` — JS splits
 *      the text into letter spans at boot time.
 *
 * Per-heading visibility is gated by an IntersectionObserver — offscreen
 * letters cost zero per-frame work. Reduced motion: the tick becomes a
 * no-op; letters render static at rest. Constants tuned for "wobbles
 * once and settles" — same as the Legendary reference (k=86, c=13).
 *
 * Spec: [[Concept - Inertial Headings]] in the Obsidian docs.
 */

import { registerTick } from '../boot';
import { isReducedMotion } from '../reduced-motion';
import { synColor } from '../palette/syn-colors';

const K = 86;             // spring stiffness
const C = 13;             // damping
const POINTER_R = 90;     // px, radius of pointer influence (motion)
const POINTER_F = 1200;   // px/s² impulse strength at pointer center
const COLOR_R = 60;       // px, smaller radius for color reveal — keeps
                          // the effect feeling like a flashlight rather
                          // than washing the whole heading at once.

interface Letter {
  span: HTMLElement;
  x: number;
  y: number;
  vx: number;
  vy: number;
  cx: number;   // viewport-coords letter center (refreshed on resize / visibility)
  cy: number;
  colorLit: boolean;
}

/**
 * Color-only letter — has `.syn-letter` (or otherwise lives inside a
 * `[data-color-letters]` ancestor) but NO `[data-inertial]`. Used by
 * `obsidian-bolds.ts` for `<strong>` runs inside `.rp-content`: we
 * want the flashlight color reveal on bolds but not the spring
 * physics (that would feel like a desk toy on every bold word).
 */
interface ColorLetter {
  span: HTMLElement;
  cx: number;
  cy: number;
  colorLit: boolean;
}

interface Group {
  root: HTMLElement;
  letters: Letter[];
  colorOnly: ColorLetter[];
  visible: boolean;
  colorLetters: boolean; // honors data-color-letters on the group root
}

export interface InertialTypeHandle {
  stop(): void;
}

function splitTextNodes(root: HTMLElement): HTMLElement[] {
  const spans: HTMLElement[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
  const textNodes: Text[] = [];
  let n: Node | null;
  while ((n = walker.nextNode())) textNodes.push(n as Text);

  for (const node of textNodes) {
    const text = node.nodeValue ?? '';
    if (text.trim().length === 0) continue;
    const frag = document.createDocumentFragment();
    for (const ch of text) {
      if (ch === ' ' || ch === '\t' || ch === '\n') {
        frag.appendChild(document.createTextNode(ch));
      } else {
        const span = document.createElement('span');
        span.className = 'inertial-letter';
        span.setAttribute('data-inertial', '');
        span.textContent = ch;
        frag.appendChild(span);
        spans.push(span);
      }
    }
    node.parentNode?.replaceChild(frag, node);
  }
  return spans;
}

function collectLetters(scope: HTMLElement): HTMLElement[] {
  // First, split any data-inertial-text wrappers under this scope.
  const wrappers = scope.matches('[data-inertial-text]')
    ? [scope]
    : Array.from(scope.querySelectorAll<HTMLElement>('[data-inertial-text]'));
  const split: HTMLElement[] = [];
  for (const w of wrappers) split.push(...splitTextNodes(w));

  // Then collect all [data-inertial] under this scope (includes the
  // ones we just created).
  const explicit = Array.from(scope.querySelectorAll<HTMLElement>('[data-inertial]'));
  if (scope.matches('[data-inertial]')) explicit.push(scope);

  const seen = new Set<HTMLElement>();
  const ordered: HTMLElement[] = [];
  for (const el of [...split, ...explicit]) {
    if (seen.has(el)) continue;
    seen.add(el);
    ordered.push(el);
  }
  return ordered;
}

function refreshCenters(g: Group): void {
  // Cache centers in PAGE coordinates (add scroll offset) so the
  // effect is scroll-invariant: a heading below the fold still has a
  // correct center once scrolled to, without re-measuring on scroll.
  const sx = window.scrollX;
  const sy = window.scrollY;
  for (const L of g.letters) {
    const rect = L.span.getBoundingClientRect();
    L.cx = rect.left + rect.width / 2 + sx;
    L.cy = rect.top + rect.height / 2 + sy;
  }
  for (const L of g.colorOnly) {
    const rect = L.span.getBoundingClientRect();
    L.cx = rect.left + rect.width / 2 + sx;
    L.cy = rect.top + rect.height / 2 + sy;
  }
}

export function initInertialType(root: HTMLElement | null = null): InertialTypeHandle {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return { stop: () => {} };
  }

  const scope = root ?? document.body;
  const groups: Group[] = [];

  // Each [data-inertial-root] is its own visibility-gated group. If
  // none are present, fall back to the whole scope as one group.
  const rootEls = Array.from(scope.querySelectorAll<HTMLElement>('[data-inertial-root]'));
  const groupRoots: HTMLElement[] = rootEls.length > 0 ? rootEls : [scope];

  for (const r of groupRoots) {
    const letterEls = collectLetters(r);
    const letters: Letter[] = letterEls.map((span) => ({
      span,
      x: 0, y: 0, vx: 0, vy: 0, cx: 0, cy: 0, colorLit: false,
    }));
    // Color-on-proximity is opt-in: a group enables it by carrying
    // `data-color-letters` (on its root or any ancestor up to <body>).
    const colorLetters = r.closest('[data-color-letters]') !== null;

    // Collect color-only letters: `.syn-letter` inside any
    // `[data-color-letters]` descendant of this group root, EXCEPT
    // those that already have `data-inertial` (which means they're
    // physics-enabled letters and already in `letters`). Used by
    // `obsidian-bolds.ts` for <strong> runs in the reading panel.
    const colorOnlyEls = Array.from(
      r.querySelectorAll<HTMLElement>('[data-color-letters] .syn-letter'),
    ).filter((el) => !el.hasAttribute('data-inertial'));
    const colorOnly: ColorLetter[] = colorOnlyEls.map((span) => ({
      span, cx: 0, cy: 0, colorLit: false,
    }));

    if (letters.length === 0 && colorOnly.length === 0) continue;
    groups.push({ root: r, letters, colorOnly, visible: true, colorLetters });
  }

  if (groups.length === 0) return { stop: () => {} };

  // Visibility gating
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        const g = groups.find((x) => x.root === e.target);
        if (!g) continue;
        g.visible = e.isIntersecting;
        if (g.visible) refreshCenters(g);
      }
    },
    { threshold: 0 },
  );
  for (const g of groups) io.observe(g.root);

  // Resize: re-measure letter centers (debounced).
  let resizeTimer: ReturnType<typeof setTimeout> | null = null;
  const onResize = () => {
    if (resizeTimer) clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      for (const g of groups) if (g.visible) refreshCenters(g);
    }, 100);
  };
  window.addEventListener('resize', onResize);

  // Initial measurement on the next frame (after layout settles).
  requestAnimationFrame(() => {
    for (const g of groups) refreshCenters(g);
  });

  // Pointer tracking
  const pointer = { x: -1e6, y: -1e6 };
  const onMove = (e: PointerEvent) => {
    pointer.x = e.clientX;
    pointer.y = e.clientY;
  };
  window.addEventListener('pointermove', onMove, { passive: true });

  // Tick
  const unregister = registerTick((dt) => {
    if (isReducedMotion()) return;
    // Pointer in PAGE coordinates to match the page-space letter
    // centers — keeps the wobble aligned no matter the scroll offset.
    const px = pointer.x + window.scrollX;
    const py = pointer.y + window.scrollY;
    for (const g of groups) {
      if (!g.visible) continue;

      // 1) Physics + (optional) color reveal for the letters that
      //    wobble. Same code path as before.
      for (const L of g.letters) {
        const dx = px - (L.cx + L.x);
        const dy = py - (L.cy + L.y);
        const d2 = dx * dx + dy * dy;
        if (d2 < POINTER_R * POINTER_R) {
          const d = Math.sqrt(d2) || 0.001;
          const falloff = (1 - d / POINTER_R) ** 2;
          const a = POINTER_F * falloff;
          L.vx -= (dx / d) * a * dt;
          L.vy -= (dy / d) * a * dt;
        }
        L.vx += (-K * L.x - C * L.vx) * dt;
        L.vy += (-K * L.y - C * L.vy) * dt;
        L.x += L.vx * dt;
        L.y += L.vy * dt;
        L.span.style.transform = `translate3d(${L.x.toFixed(2)}px, ${L.y.toFixed(2)}px, 0)`;

        if (g.colorLetters) {
          const lit = d2 < COLOR_R * COLOR_R;
          if (lit !== L.colorLit) {
            L.colorLit = lit;
            if (lit) {
              const c = synColor(L.span.textContent ?? '');
              if (c) {
                L.span.style.color = c;
                L.span.style.textShadow = `0 0 14px ${c}aa, 0 0 4px ${c}`;
              }
            } else {
              L.span.style.color = '';
              L.span.style.textShadow = '';
            }
          }
        }
      }

      // 2) Color-only letters (no physics). Used by obsidian-bolds.ts
      //    for `<strong>` runs in the reading panel. Edge-triggered
      //    color writes; the CSS transition handles the fade.
      for (const L of g.colorOnly) {
        const dx = px - L.cx;
        const dy = py - L.cy;
        const d2 = dx * dx + dy * dy;
        const lit = d2 < COLOR_R * COLOR_R;
        if (lit !== L.colorLit) {
          L.colorLit = lit;
          if (lit) {
            const c = synColor(L.span.textContent ?? '');
            if (c) {
              L.span.style.color = c;
              L.span.style.textShadow = `0 0 14px ${c}aa, 0 0 4px ${c}`;
            }
          } else {
            L.span.style.color = '';
            L.span.style.textShadow = '';
          }
        }
      }
    }
  });

  return {
    stop(): void {
      unregister();
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('resize', onResize);
      io.disconnect();
    },
  };
}
