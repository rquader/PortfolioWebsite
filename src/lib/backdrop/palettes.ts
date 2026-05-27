/**
 * @file palettes.ts
 *
 * Color palettes for the canvas scenes (recursive tree, falling leaves,
 * future drift-field / network-nodes ports).
 *
 * Phase 5 redesign (2026-05-19): FOREST is retained for backwards
 * compatibility but is no longer the default. SEPIA_LIGHT and
 * SEPIA_DARK ship as the new defaults, tuned to the parchment-walnut-
 * terracotta tokens in tokens.css. `currentSepiaPalette()` reads
 * `data-theme` on <html> and returns the matching variant — call this
 * at draw time so palette swaps from the TopNav toggle re-paint live.
 *
 * `tone(p, t01)` picks a discrete index into `p.tones` — same behavior
 * as Python's `Palette.tone()` — so a depth-mapped color choice gives
 * the same banded effect as the Manim render.
 *
 * Spec: [[02 - Architecture]];
 *       [[decisions/ADR-007-palette-sepia-shift]].
 */

export interface Palette {
  readonly name: string;
  readonly background: string;
  readonly tones: readonly string[];
  readonly accent: string;
}

export const FOREST: Palette = {
  name: 'forest',
  background: '#0A1620',
  tones: ['#2F5860', '#4A8884', '#6BB4A6', '#87DCB8', '#B0EBD2'],
  accent: '#E8F4E0',
};

/* Autumn-sepia, light-mode variant.
   Tones run trunk-dark → canopy-bright. Mirror of the --tree-*
   tokens in tokens.css (light block). */
export const SEPIA_LIGHT: Palette = {
  name: 'sepia-light',
  background: '#F5EAD4',
  // Revised 2026-05-19 PM: branches lifted to walnut, leaves tightened
  // around the terracotta/ochre family so the tree harmonizes with the
  // page's accent rather than competing with it.
  tones: ['#7A4D2C', '#8C4A22', '#B05A2A', '#C66A3C', '#D8853E'],
  accent: '#6B2E0E',
};

/* Autumn-sepia, dark-mode variant. Brighter tones so leaves glow on
   the deep-walnut bg. Mirror of the --tree-* tokens in tokens.css
   (dark block). */
export const SEPIA_DARK: Palette = {
  name: 'sepia-dark',
  background: '#1F1812',
  tones: ['#B8916A', '#C46B45', '#E08A52', '#F0A668', '#E8C078'],
  accent: '#F2B582',
};

/**
 * Pick the active sepia palette based on the document's current theme.
 * SSR-safe: when document is unavailable returns SEPIA_LIGHT (the
 * default mode chosen in ADR-009).
 */
export function currentSepiaPalette(): Palette {
  if (typeof document === 'undefined') return SEPIA_LIGHT;
  const t = document.documentElement.getAttribute('data-theme');
  return t === 'dark' ? SEPIA_DARK : SEPIA_LIGHT;
}

export function tone(p: Palette, t01: number): string {
  const n = p.tones.length;
  if (n === 0) return p.accent;
  const i = Math.max(0, Math.min(n - 1, Math.round(t01 * (n - 1))));
  return p.tones[i] as string;
}

export function hexToRgb(hex: string): [number, number, number] {
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  if (!m) throw new Error(`hexToRgb: invalid hex "${hex}"`);
  return [parseInt(m[1] as string, 16), parseInt(m[2] as string, 16), parseInt(m[3] as string, 16)];
}

export function rgbaFromHex(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
