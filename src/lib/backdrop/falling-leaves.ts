/**
 * @file falling-leaves.ts
 *
 * Page-wide drifting-leaf backdrop. Ports
 * ~/Developer/Manim_Wallpaper/scenes/falling_leaves_forest.py — the
 * FOREST-palette polygon variant of the AUTUMN ellipse wallpaper.
 *
 * 45 stylized 10-vertex leaf polygons (the same shape as the
 * recursive_tree canopy) drift downward across 3 parallax depth layers
 * in FOREST tones. Integer-cycle motion (fall + sway + slow rotation)
 * gives a seamless 12 s loop. Reduced motion: rAF tick is a no-op;
 * static frame remains.
 *
 * Mount via `mountFallingLeaves(canvas, opts)`. The handle exposes
 * setOpacity(o) and stop().
 *
 * Spec: [[Concept - Falling Leaves Backdrop]];
 *       [[specs/2026-05-18-tree-leaves-folders-design#4.1]].
 */

import { registerTick } from '../boot';
import { isReducedMotion } from '../reduced-motion';
import { FOREST, currentSepiaPalette, type Palette } from './palettes';
import { mulberry32 } from './rng';
import { sinWave } from './easing';
import { leafVerts } from './leaf';
import { THEME_EVENT } from '../theme-toggle';

const FRAME_UNITS_HEIGHT = 8;
const DURATION = 12.0;

const NUM_LEAVES = 45;
const RNG_SEED = 113; // distinct from tree (42) and AUTUMN wallpaper (73)

const LAYER_COUNT_WEIGHTS = [0.45, 0.35, 0.20] as const;
const LAYER_SIZE_RANGES: readonly (readonly [number, number])[] = [
  [0.08, 0.13], // back
  [0.13, 0.18], // mid (overlaps the canopy leaf band)
  [0.18, 0.24], // front
];
const LAYER_OPACITY = [0.28, 0.55, 0.82] as const;

const SWAY_AMP = 0.34;
const FALL_CYCLE_CHOICES = [1, 1, 1, 1, 2] as const;
const SWAY_CYCLE_CHOICES = [1, 1, 2] as const;
const ROT_CYCLE_CHOICES = [-1, 0, 0, 0, 0, 1] as const;

interface Leaf {
  baseX: number;
  baseProgress: number;
  size: number;
  color: string;
  opacity: number;
  fallCycles: number;
  swayCycles: number;
  swayPhase: number;
  rotCycles: number;
  rotPhase: number;
  tilt: number;
}

export interface FallingLeavesOptions {
  /** 'sepia' picks the per-theme variant; 'forest' is the Phase 4 fallback. */
  palette?: 'forest' | 'sepia';
  numLeaves?: number;
  opacity?: number;
  seed?: number;
  ariaHidden?: boolean;
}

export interface FallingLeavesHandle {
  setOpacity(o: number): void;
  stop(): void;
}

interface CanvasMap {
  cw: number;
  ch: number;
  u: number;
  toX(mx: number): number;
  toY(my: number): number;
}

function makeCanvasMap(cssW: number, cssH: number, frameHeight: number): CanvasMap {
  const u = cssH / frameHeight;
  return {
    cw: cssW,
    ch: cssH,
    u,
    toX(mx: number): number {
      return cssW / 2 + mx * u;
    },
    toY(my: number): number {
      return cssH / 2 - my * u;
    },
  };
}

function pickLayer(rng: ReturnType<typeof mulberry32>): number {
  const r = rng.random();
  let acc = 0;
  for (let i = 0; i < LAYER_COUNT_WEIGHTS.length; i++) {
    acc += LAYER_COUNT_WEIGHTS[i] as number;
    if (r < acc) return i;
  }
  return LAYER_COUNT_WEIGHTS.length - 1;
}

function buildLeaves(
  rng: ReturnType<typeof mulberry32>,
  frameWidth: number,
  count: number,
  palette: Palette,
): Leaf[] {
  const leafPalette: readonly string[] = [
    (palette.tones[palette.tones.length - 2] ?? palette.tones[0] ?? palette.accent) as string,
    (palette.tones[palette.tones.length - 1] ?? palette.tones[0] ?? palette.accent) as string,
    palette.accent,
  ];
  const out: Leaf[] = [];
  for (let i = 0; i < count; i++) {
    const layer = pickLayer(rng);
    const sizeRange = LAYER_SIZE_RANGES[layer] as readonly [number, number];
    out.push({
      baseX: rng.uniform(-frameWidth / 2 + 0.25, frameWidth / 2 - 0.25),
      baseProgress: rng.random(),
      size: rng.uniform(sizeRange[0], sizeRange[1]),
      color: rng.choice(leafPalette),
      opacity: LAYER_OPACITY[layer] as number,
      fallCycles: rng.choice(FALL_CYCLE_CHOICES),
      swayCycles: rng.choice(SWAY_CYCLE_CHOICES),
      swayPhase: rng.random(),
      rotCycles: rng.choice(ROT_CYCLE_CHOICES),
      rotPhase: rng.uniform(0, 2 * Math.PI),
      tilt: rng.uniform(0, 2 * Math.PI),
    });
  }
  return out;
}

export function mountFallingLeaves(
  canvas: HTMLCanvasElement,
  opts: FallingLeavesOptions = {},
): FallingLeavesHandle {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('mountFallingLeaves: 2d context unavailable');

  const paletteChoice: 'forest' | 'sepia' = opts.palette ?? 'sepia';
  let palette: Palette =
    paletteChoice === 'forest' ? FOREST : currentSepiaPalette();
  let opacity = opts.opacity ?? 1.0;
  const seed = opts.seed ?? RNG_SEED;
  const count = opts.numLeaves ?? NUM_LEAVES;
  if (opts.ariaHidden !== false) canvas.setAttribute('aria-hidden', 'true');

  let cssW = 0;
  let cssH = 0;
  let dpr = 1;
  let map: CanvasMap = makeCanvasMap(1, 1, FRAME_UNITS_HEIGHT);
  let leaves: Leaf[] = [];
  let topY = 0;
  let span = 0;

  function configure(): void {
    dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    cssW = Math.max(1, Math.round(rect.width || canvas.clientWidth || canvas.width || 1));
    cssH = Math.max(1, Math.round(rect.height || canvas.clientHeight || canvas.height || 1));
    canvas.width = Math.floor(cssW * dpr);
    canvas.height = Math.floor(cssH * dpr);
    canvas.style.width = `${cssW}px`;
    canvas.style.height = `${cssH}px`;
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    map = makeCanvasMap(cssW, cssH, FRAME_UNITS_HEIGHT);
  }

  function rebuild(): void {
    const rng = mulberry32(seed);
    const frameWidth = cssH > 0 ? (cssW / cssH) * FRAME_UNITS_HEIGHT : FRAME_UNITS_HEIGHT;
    leaves = buildLeaves(rng, frameWidth, count, palette);
    let maxSize = 0;
    for (const l of leaves) if (l.size > maxSize) maxSize = l.size;
    const margin = maxSize * 0.8;
    topY = FRAME_UNITS_HEIGHT / 2 + margin;
    span = FRAME_UNITS_HEIGHT + 2 * margin;
  }

  function draw(t: number): void {
    if (cssW < 2 || cssH < 2) return;
    ctx!.clearRect(0, 0, cssW, cssH);
    for (const l of leaves) {
      const progress = (l.baseProgress + (l.fallCycles * t) / DURATION) % 1.0;
      const y = topY - progress * span;
      const swayPeriod = DURATION / l.swayCycles;
      const x = l.baseX + SWAY_AMP * sinWave(t, swayPeriod, l.swayPhase);
      const angle = l.tilt + 2 * Math.PI * l.rotCycles * (t / DURATION) + l.rotPhase;

      const cx = map.toX(x);
      const cy = map.toY(y);
      const sizePx = l.size * map.u;
      const verts = leafVerts(sizePx);
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);

      ctx!.globalAlpha = l.opacity * opacity;
      ctx!.fillStyle = l.color;
      ctx!.beginPath();
      for (let i = 0; i < verts.length; i++) {
        const v = verts[i] as readonly [number, number];
        const rx = cos * v[0] - sin * v[1];
        const ry = sin * v[0] + cos * v[1];
        const px = cx + rx;
        const py = cy - ry; // canvas y-down
        if (i === 0) ctx!.moveTo(px, py);
        else ctx!.lineTo(px, py);
      }
      ctx!.closePath();
      ctx!.fill();
    }
    ctx!.globalAlpha = 1.0;
  }

  configure();
  rebuild();
  draw(0);

  const ro = typeof ResizeObserver !== 'undefined'
    ? new ResizeObserver(() => {
        configure();
        rebuild();
        draw(isReducedMotion() ? 0 : performance.now() / 1000);
      })
    : null;
  ro?.observe(canvas);

  const unregister = registerTick((_dt, t) => {
    if (isReducedMotion()) return;
    draw(t / 1000);
  });

  // Re-paint when the user toggles theme. Only applies when this
  // instance was mounted with the 'sepia' palette (the FOREST
  // backwards-compat path stays fixed).
  const onThemeChange = (): void => {
    if (paletteChoice !== 'sepia') return;
    palette = currentSepiaPalette();
    rebuild();
    draw(isReducedMotion() ? 0 : performance.now() / 1000);
  };
  window.addEventListener(THEME_EVENT, onThemeChange);

  return {
    setOpacity(o: number): void {
      opacity = o;
    },
    stop(): void {
      unregister();
      ro?.disconnect();
      window.removeEventListener(THEME_EVENT, onThemeChange);
    },
  };
}
