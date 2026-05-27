/**
 * @file syn-colors.ts
 *
 * Per-letter color palette inherited from Legendary UI/UX's synesthesia
 * concept (informed by Rimbaud and Sean Day). Shared by:
 *   - src/lib/primitives/synesthesia.ts (word-level on the "on me" bio)
 *   - src/lib/primitives/inertial-type.ts (letter-near-cursor reveal on
 *     elements marked with `data-color-letters`)
 *
 * Phase 5 (2026-05-19): two palettes ship side-by-side. The original
 * 26-letter table is tuned for the deep-walnut dark bg; a parallel
 * SYN_COLORS_LIGHT is darkened/deepened for legibility on the
 * parchment light bg (some letters in the dark-tuned table — `e`, `l`,
 * `h`, `s`, `y`, `c` — read as near-invisible against cream).
 *
 * The `synColor(ch)` resolver picks the right palette based on the
 * current `data-theme`. SSR-safe: returns the dark palette when
 * document is unavailable.
 *
 * Letters not in the map (digits, punctuation) keep the inherited color.
 *
 * Spec: [[Concept - Synesthesia Goals#letter palette]];
 *       [[decisions/ADR-010-synesthesia-dual-palette]].
 */

/** Dark-bg-tuned. Same values shipped through Phase 4. Optimized for
    high-luminance letters glowing against #0A1620 (now mapped to the
    new --bg-0 dark #1F1812 — still works well). */
export const SYN_COLORS_DARK: Record<string, string> = {
  a: '#332019', b: '#3956c9', c: '#e0a82a', d: '#664439',
  e: '#e2dac6', f: '#dc7240', g: '#3b6e30', h: '#dbcb6e',
  i: '#c83a3a', j: '#b14274', k: '#7e58c9', l: '#c8c4b8',
  m: '#b04140', n: '#dc8a40', o: '#3a78c8', p: '#39a5dc',
  q: '#8e44b0', r: '#c43030', s: '#dcc23b', t: '#3c8a8a',
  u: '#56a55c', v: '#7e6dc0', w: '#6a40a4', x: '#5a5651',
  y: '#dcae3b', z: '#3cb8c8',
};

/** Light-bg-tuned. Darker / more saturated than the dark table so
    every letter remains visible on parchment #F5EAD4. Hues are
    preserved per letter so the synesthesia identity is consistent
    across modes — only the lightness shifts. */
export const SYN_COLORS_LIGHT: Record<string, string> = {
  a: '#1A0F08', b: '#1F3998', c: '#8B5A14', d: '#3E2922',
  e: '#5C4D36', f: '#A04A20', g: '#1F4818', h: '#5E4A14',
  i: '#971F1F', j: '#7E2548', k: '#4D2E8A', l: '#5C5848',
  m: '#7C2222', n: '#9C5418', o: '#1F4D8E', p: '#1B6A9C',
  q: '#5E1E7C', r: '#911818', s: '#7A6418', t: '#1F5454',
  u: '#256830', v: '#4A3E8A', w: '#3A1C7A', x: '#3A3631',
  y: '#8C6618', z: '#1F7E8A',
};

/** Backwards-compatible export — old code that imports SYN_COLORS gets
    the dark-tuned table (matches Phase 4 behavior). Prefer `synColor()`
    going forward — it resolves per-theme. */
export const SYN_COLORS = SYN_COLORS_DARK;

function activePalette(): Record<string, string> {
  if (typeof document === 'undefined') return SYN_COLORS_DARK;
  return document.documentElement.getAttribute('data-theme') === 'dark'
    ? SYN_COLORS_DARK
    : SYN_COLORS_LIGHT;
}

export function synColor(ch: string): string | undefined {
  return activePalette()[ch.toLowerCase()];
}

/** Convenience accessor for code that wants the full palette (e.g., the
    word-tint in synesthesia.ts averages the active palette over the
    word's letters). */
export function activeSynPalette(): Record<string, string> {
  return activePalette();
}
