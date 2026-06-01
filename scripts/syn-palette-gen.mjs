/**
 * syn-palette-gen.mjs — reproducible generator + verifier for the
 * synesthesia perceptual palette (ADR-030).
 *
 * Single source of truth: a per-letter {h, c} map (OKLCH hue degrees +
 * base chroma). Each letter keeps a CONSTANT hue (its identity) across
 * both themes; only LIGHTNESS / chroma adapt per theme for legibility.
 *
 * This script renders DARK + LIGHT hex tables, gamut-clamps each color
 * (reduce chroma until in sRGB), validates the hex, and prints WCAG
 * contrast ratios vs each theme's bg. Run with: node scripts/syn-palette-gen.mjs
 *
 * The same SRC / oklchToHex logic is mirrored (commented) into
 * src/lib/palette/syn-colors.ts so the baked tables are documented +
 * reproducible. Nothing here ships to the browser; runtime uses static hex.
 */

// ── Per-letter {h, c} source of truth ───────────────────────────────
// Hue (deg, OKLCH) is the letter's fixed identity. Base chroma is a
// hint; the per-theme renderers scale it (dark glows can carry more
// chroma; light deep tones a touch less) and the gamut clamp trims it.
//
// HUE RATIONALE — "pigment on parchment", warm-biased, NOT a rainbow:
//   ~20 letters sit in the WARM arc (red→orange→amber→gold→warm-green,
//   roughly 20–150°), echoing the site's aged-ink / sepia / walnut /
//   terracotta / amber world. Only 6 letters are COOL jewel accents
//   (teal / blue / violet, ~190–310°) so a hovered word still gets a
//   little contrast and the averaged tint stays perceptible — but the
//   field reads restrained and literary, like ink and ochre on paper.
//
//   Warm sub-arcs:
//     reds / sienna     ~25–40°   : a r m i  (high-freq letters → the
//                                    warm core; words tint toward sepia)
//     oranges / terracotta ~45–60°: f n d
//     ambers / ochre    ~70–85°   : c o(?) — see below; s y h
//     golds / olive     ~95–115°  : g k(?) — warm yellow-greens
//     warm greens       ~135–150° : u w(?)
//   Cool jewel accents (sparse, for contrast):
//     teal   ~195°  : t
//     azure  ~245°  : b
//     blue   ~255°  : o   (one cool vowel keeps blue present, Rimbaud nod)
//     indigo ~275°  : v
//     violet ~300°  : q
//     plum   ~330°  : j   (warm-leaning magenta — bridges back to red)
//
//   Neutrals: e, l, x carry near-zero chroma (warm greys / taupe) so the
//   common letters e/l don't over-saturate a word's averaged tint —
//   they read as "unpigmented" ink, which is what made the inherited
//   table feel literary. p is a soft cool slate (low chroma blue) so it
//   pairs with o/b without adding a third loud cool.
const SRC = {
  // warm reds / sienna
  a: { h: 35,  c: 0.085 }, // sienna-red (very common → leans warm-core)
  r: { h: 28,  c: 0.11  }, // clear red
  m: { h: 32,  c: 0.105 }, // brick red
  i: { h: 40,  c: 0.11  }, // red-orange
  // oranges / terracotta
  f: { h: 50,  c: 0.115 }, // terracotta
  n: { h: 58,  c: 0.11  }, // burnt orange
  d: { h: 46,  c: 0.075 }, // muted clay (low chroma → reads earthy)
  // ambers / ochre / gold
  c: { h: 78,  c: 0.115 }, // amber
  s: { h: 88,  c: 0.115 }, // ochre-gold
  y: { h: 82,  c: 0.115 }, // gold
  h: { h: 92,  c: 0.10  }, // pale gold
  // olive / warm yellow-green
  g: { h: 128, c: 0.095 }, // leaf green (warm-leaning)
  k: { h: 108, c: 0.10  }, // olive-gold
  // warm greens
  u: { h: 145, c: 0.09  }, // sap green
  w: { h: 138, c: 0.085 }, // moss
  // neutrals / near-grey (warm taupe ink)
  e: { h: 70,  c: 0.012 }, // warm grey (unpigmented — very common letter)
  l: { h: 60,  c: 0.018 }, // taupe (common letter)
  x: { h: 40,  c: 0.02  }, // warm stone
  // soft cool slate
  p: { h: 250, c: 0.055 }, // slate (low-chroma blue)
  // cool jewel accents (sparse)
  t: { h: 195, c: 0.085 }, // teal
  b: { h: 245, c: 0.105 }, // azure
  o: { h: 258, c: 0.085 }, // blue (one cool vowel — Rimbaud nod)
  v: { h: 278, c: 0.095 }, // indigo
  q: { h: 300, c: 0.10  }, // violet
  j: { h: 332, c: 0.10  }, // plum / magenta (bridges back to red)
  z: { h: 188, c: 0.09  }, // deep teal-cyan (rare letter, cool anchor)
};

const LETTERS = 'abcdefghijklmnopqrstuvwxyz'.split('');

// ── OKLab / OKLCH → linear sRGB → sRGB (Björn Ottosson's matrices) ───
function oklabToLinearSrgb(L, a, b) {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.2914855480 * b;
  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;
  return [
    +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s,
  ];
}

function linearToSrgb(x) {
  // standard sRGB transfer
  return x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055;
}

function inGamut([r, g, b]) {
  const eps = 1e-4;
  return r >= -eps && r <= 1 + eps && g >= -eps && g <= 1 + eps && b >= -eps && b <= 1 + eps;
}

/** OKLCH → #rrggbb, reducing chroma until the color is inside sRGB. */
function oklchToHex(L, c, hDeg) {
  const hRad = (hDeg * Math.PI) / 180;
  let chroma = c;
  let lin;
  // Binary-search the largest chroma <= requested that stays in gamut.
  let lo = 0, hi = chroma, best = 0;
  const test = (cc) => oklabToLinearSrgb(L, cc * Math.cos(hRad), cc * Math.sin(hRad));
  if (inGamut(test(chroma))) {
    best = chroma;
  } else {
    for (let i = 0; i < 24; i++) {
      const mid = (lo + hi) / 2;
      if (inGamut(test(mid))) { best = mid; lo = mid; } else { hi = mid; }
    }
  }
  lin = test(best);
  const to255 = (x) => Math.round(Math.min(1, Math.max(0, linearToSrgb(x))) * 255);
  const [r, g, b] = lin.map(to255);
  const hex = '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');
  return { hex, r, g, b, clampedFrom: best < chroma - 1e-6 ? chroma : null, usedChroma: best };
}

// ── WCAG relative luminance + contrast ──────────────────────────────
function relLum(r, g, b) {
  const f = (v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
function contrast(rgb1, rgb2) {
  const L1 = relLum(...rgb1);
  const L2 = relLum(...rgb2);
  const [hi, lo] = L1 > L2 ? [L1, L2] : [L2, L1];
  return (hi + 0.05) / (lo + 0.05);
}
function hexToRgb(h) {
  return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
}

// ── Per-theme lightness / chroma policy ─────────────────────────────
// DARK: letters GLOW on walnut #1F1812 → high L (0.72–0.78). Slightly
//       boost chroma (warm glow reads richer). Need >= ~3:1 vs bg.
// LIGHT: letters are deep INK on parchment #F5EAD4 → low L (0.38–0.44).
//        Trim chroma a touch so deep tones don't go muddy/neon. Need
//        >= ~4.5:1 vs bg (they're body-text-like).
const DARK_BG = '#1F1812';
const LIGHT_BG = '#F5EAD4';

// Per-theme L is nudged per-hue: very warm/yellow hues are intrinsically
// lighter, cool hues darker, so a flat L would make blues too dim in dark
// and yellows too weak in light. Small hue-aware tweak keeps perceived
// brightness even AND keeps contrast within the target band.
function darkL(h) {
  // base 0.745; cool hues (180–320) a touch brighter to clear 3:1.
  if (h >= 180 && h <= 320) return 0.775;
  if (h >= 70 && h <= 150) return 0.745; // yellow-greens already bright
  return 0.74;
}
function lightL(h) {
  // base 0.41; yellows/ambers a touch darker (they're light → need it
  // to clear 4.5:1 on parchment); cool hues a touch lighter is fine.
  if (h >= 65 && h <= 110) return 0.385; // ambers/golds — darken for contrast
  if (h >= 180 && h <= 320) return 0.43;  // cools read dark already
  return 0.41;
}

function buildTable(mode) {
  const out = {};
  const rows = [];
  for (const ch of LETTERS) {
    const { h, c } = SRC[ch];
    let L, chroma;
    if (mode === 'dark') {
      L = darkL(h);
      chroma = c * 1.05; // glow reads a bit richer
    } else {
      L = lightL(h);
      chroma = c * 1.12; // deep tones need a little more chroma to register
    }
    const res = oklchToHex(L, chroma, h);
    out[ch] = res.hex;
    const bg = mode === 'dark' ? DARK_BG : LIGHT_BG;
    const cr = contrast([res.r, res.g, res.b], hexToRgb(bg));
    rows.push({ ch, h, L: L.toFixed(3), hex: res.hex, cr: cr.toFixed(2), clamped: res.clampedFrom ? `↓${res.usedChroma.toFixed(3)}` : '' });
  }
  return { out, rows };
}

const dark = buildTable('dark');
const light = buildTable('light');

// ── Report ──────────────────────────────────────────────────────────
function printTable(title, rows, bg, threshold) {
  console.log(`\n=== ${title} (bg ${bg}, target >= ${threshold}:1) ===`);
  console.log('ltr  hue   L      hex       contrast  clamp');
  let minCr = Infinity, fails = 0;
  for (const r of rows) {
    const flag = Number(r.cr) < threshold ? '  <-- FAIL' : '';
    if (Number(r.cr) < threshold) fails++;
    minCr = Math.min(minCr, Number(r.cr));
    console.log(
      `${r.ch}    ${String(r.h).padStart(3)}   ${r.L}  ${r.hex}  ${String(r.cr).padStart(6)}    ${r.clamped}${flag}`,
    );
  }
  console.log(`min contrast: ${minCr.toFixed(2)}:1   fails: ${fails}`);
  return { minCr, fails };
}

const dr = printTable('DARK', dark.rows, DARK_BG, 3.0);
const lr = printTable('LIGHT', light.rows, LIGHT_BG, 4.5);

// ── Emit the baked literals for pasting into syn-colors.ts ───────────
function emit(name, map) {
  const order = LETTERS;
  let s = `export const ${name}: Record<string, string> = {\n`;
  for (let i = 0; i < order.length; i += 4) {
    const chunk = order.slice(i, i + 4).map((c) => `${c}: '${map[c]}'`).join(', ');
    s += `  ${chunk},\n`;
  }
  s += '};';
  return s;
}
console.log('\n--- BAKED LITERALS ---\n');
console.log(emit('SYN_COLORS_DARK', dark.out));
console.log();
console.log(emit('SYN_COLORS_LIGHT', light.out));

// ── Validate all hex are well-formed 6-digit ─────────────────────────
const HEX_RE = /^#[0-9a-f]{6}$/;
let bad = 0;
for (const ch of LETTERS) {
  if (!HEX_RE.test(dark.out[ch])) { console.error(`BAD dark hex ${ch}=${dark.out[ch]}`); bad++; }
  if (!HEX_RE.test(light.out[ch])) { console.error(`BAD light hex ${ch}=${light.out[ch]}`); bad++; }
}
console.log(`\nhex validity: ${bad === 0 ? 'ALL 52 VALID 6-digit' : bad + ' INVALID'}`);

// Word-tint sanity: average the 4 bio words in each theme, print the tint.
const WORDS = ['massive change', 'better world', 'meaningful', 'Claude Code'];
function avg(word, map) {
  const ls = word.toLowerCase().replace(/[^a-z]/g, '');
  let r = 0, g = 0, b = 0, n = 0;
  for (const c of ls) { const h = map[c]; if (!h) continue; const [rr, gg, bb] = hexToRgb(h); r += rr; g += gg; b += bb; n++; }
  return [Math.round(r / n), Math.round(g / n), Math.round(b / n)];
}
console.log('\n--- BIO WORD AVERAGED TINTS (r,g,b) ---');
for (const w of WORDS) {
  console.log(`"${w}"  dark=${avg(w, dark.out).join(',')}  light=${avg(w, light.out).join(',')}`);
}

process.exit(dr.fails > 0 || lr.fails > 0 || bad > 0 ? 1 : 0);
