/**
 * @file syn-colors.ts
 *
 * Per-letter color palette for the synesthesia primitive. Shared by:
 *   - src/lib/primitives/synesthesia.ts (word-level on the "on me" bio)
 *   - src/lib/primitives/inertial-type.ts (letter-near-cursor reveal on
 *     elements marked with `data-color-letters`)
 *
 * ── ADR-030 (2026-05-31): perceptual rebuild ────────────────────────
 * The inherited Rimbaud / Sean-Day hex tables (two hand-tuned palettes)
 * are REPLACED by a single source of truth derived in OKLCH. The
 * principle: each letter keeps a CONSTANT HUE (its identity); only
 * LIGHTNESS / chroma adapt per theme for legibility.
 *
 *   - DARK  (walnut #1F1812): warm letters glow; cool letters muted.
 *   - LIGHT (parchment #F5EAD4): deep ink; cools slightly desaturated.
 *
 * Hues are WARM-BIASED toward the site's aged-ink / sepia / walnut /
 * terracotta / amber world — ~20 letters in the warm arc (reds→ambers→
 * golds→warm-greens, 20–150°) and only 6 cool jewel accents (teal /
 * blue / violet) for contrast. It reads like pigment on parchment:
 * restrained, literary — yet spread enough that a hovered word's
 * averaged tint is perceptible. (Supersedes the dual hand-tuned tables;
 * the per-mode decision + generator constraints live in ADR-030.)
 *
 * The runtime ships STATIC hex literals (zero conversion cost/risk).
 * The {h, c} source + the OKLCH→sRGB generator below document how the
 * tables are reproduced; the authoritative, runnable generator +
 * contrast verifier is `scripts/syn-palette-gen.mjs`.
 *
 * `synColor(ch)` resolves the right table from the current `data-theme`
 * (SSR-safe: dark when document is unavailable). Letters not in the map
 * (digits, punctuation) keep the inherited color. Values are guaranteed
 * 6-digit hex — synesthesia.ts parses them with `parseInt(hex.slice…)`.
 *
 * Spec: [[Concept - Synesthesia Goals#letter palette]];
 *       [[decisions/ADR-030-synesthesia-perceptual-palette-rebuild]].
 */

// ── Single source of truth: per-letter {h, c} ───────────────────────
// Hue (OKLCH degrees) is the letter's fixed identity across both modes;
// base chroma is a hint the per-theme renderer scales and the gamut
// clamp trims. See ADR-030 / scripts/syn-palette-gen.mjs for the full
// hue rationale. Warm arc ~20–150°; cool jewel accents ~188–332°;
// e / l / x near-zero chroma (warm "unpigmented" greys) so the most
// common letters don't oversaturate a word's averaged tint.
export const SYN_HC: Record<string, { h: number; c: number }> = {
  // warm reds / sienna
  a: { h: 35, c: 0.085 }, r: { h: 28, c: 0.11 }, m: { h: 32, c: 0.105 }, i: { h: 40, c: 0.11 },
  // oranges / terracotta
  f: { h: 50, c: 0.115 }, n: { h: 58, c: 0.11 }, d: { h: 46, c: 0.075 },
  // ambers / ochre / gold
  c: { h: 78, c: 0.115 }, s: { h: 88, c: 0.115 }, y: { h: 82, c: 0.115 }, h: { h: 92, c: 0.1 },
  // olive / warm yellow-green
  g: { h: 128, c: 0.095 }, k: { h: 108, c: 0.1 },
  // warm greens
  u: { h: 145, c: 0.09 }, w: { h: 138, c: 0.085 },
  // neutrals / warm taupe ink
  e: { h: 70, c: 0.012 }, l: { h: 60, c: 0.018 }, x: { h: 40, c: 0.02 },
  // soft cool slate
  p: { h: 250, c: 0.055 },
  // cool jewel accents (sparse)
  t: { h: 195, c: 0.085 }, b: { h: 245, c: 0.105 }, o: { h: 258, c: 0.085 },
  v: { h: 278, c: 0.095 }, q: { h: 300, c: 0.1 }, j: { h: 332, c: 0.1 }, z: { h: 188, c: 0.09 },
};

// ── OKLCH → sRGB hex generator (Björn Ottosson matrices) ────────────
// Kept here so the baked tables below are reproducible + documented.
// Gamut-clamped: chroma is reduced (binary search) until the color sits
// inside sRGB. Pure function, no DOM — safe to tree-shake; only used by
// the offline generator, never on the hover hot path.
function oklchToHex(L: number, c: number, hDeg: number): string {
  const hr = (hDeg * Math.PI) / 180;
  const lin = (cc: number): [number, number, number] => {
    const a = cc * Math.cos(hr);
    const b = cc * Math.sin(hr);
    const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
    const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
    const s_ = L - 0.0894841775 * a - 1.291485548 * b;
    const l = l_ ** 3, m = m_ ** 3, s = s_ ** 3;
    return [
      4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
      -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
      -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
    ];
  };
  const eps = 1e-4;
  const ok = ([r, g, b]: [number, number, number]): boolean =>
    r >= -eps && r <= 1 + eps && g >= -eps && g <= 1 + eps && b >= -eps && b <= 1 + eps;
  let best = c;
  if (!ok(lin(c))) {
    let lo = 0, hi = c;
    best = 0;
    for (let i = 0; i < 24; i++) {
      const mid = (lo + hi) / 2;
      if (ok(lin(mid))) { best = mid; lo = mid; } else { hi = mid; }
    }
  }
  const xfer = (x: number): number =>
    x <= 0.0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - 0.055;
  const to255 = (x: number): number => Math.round(Math.min(1, Math.max(0, xfer(x))) * 255);
  const [r, g, b] = lin(best).map(to255);
  return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');
}
// Referenced once so `noUnusedLocals` is satisfied while keeping the
// generator inline + documented. (Runtime uses the baked literals.)
void oklchToHex;

// ── Baked tables (output of scripts/syn-palette-gen.mjs) ─────────────
// DARK: L ≈ 0.72–0.76; cool hues at ~50% chroma (slate, not neon).
// Glow on walnut #1F1812 — every letter ≥ 6.9:1 (target ≥ 3:1).
export const SYN_COLORS_DARK: Record<string, string> = {
  a: '#d79787', b: '#8aa9c4', c: '#d7a85c', d: '#d09c84',
  e: '#b6b0a9', f: '#e19469', g: '#a2bc82', h: '#c7b068',
  i: '#e29277', j: '#b89ab3', k: '#b7b66d', l: '#b2a79f',
  m: '#e19282', n: '#db9865', o: '#94a6c0', p: '#98a6b6',
  q: '#a99ec0', r: '#e48f84', s: '#cead5a', t: '#86adad',
  u: '#92bf92', v: '#9da2c3', w: '#9abd8f', x: '#b5a6a0',
  y: '#d4aa5b', z: '#85aeaa',
};

// LIGHT: L ≈ 0.385–0.41; cool hues at ~72% chroma (ink, not poster).
// Parchment #F5EAD4 — every letter ≥ 7.1:1 (target ≥ 4.5:1).
export const SYN_COLORS_LIGHT: Record<string, string> = {
  a: '#733627', b: '#214d6f', c: '#5b3d00', d: '#6d3b23',
  e: '#48433c', f: '#773400', g: '#3b5412', h: '#534200',
  i: '#7c2e0e', j: '#603a5a', k: '#484600', l: '#524840',
  m: '#7b2e20', n: '#713a00', o: '#344a6a', p: '#394b5e',
  q: '#4f406a', r: '#7e2b24', s: '#554000', t: '#145353',
  u: '#26572a', v: '#40456e', w: '#325525', x: '#554742',
  y: '#593f00', z: '#10544f',
};

/** Backwards-compatible export — old code that imports SYN_COLORS gets
    the dark-tuned table. Prefer `synColor()` going forward — it resolves
    per-theme. */
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
