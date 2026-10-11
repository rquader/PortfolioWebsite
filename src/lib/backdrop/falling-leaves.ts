/**
 * @file falling-leaves.ts
 *
 * Page-wide drifting-leaf backdrop. Ports
 * ~/Developer/Manim_Wallpaper/scenes/falling_leaves_forest.py — the
 * polygon variant of the AUTUMN ellipse wallpaper.
 *
 * 45 stylized 10-vertex leaf polygons (the same shape as the
 * recursive_tree canopy) drift downward across 3 parallax depth layers
 * in autumn tones. Integer-cycle motion (fall + sway + slow rotation)
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
import { isReducedMotion, onReducedMotionChange } from '../reduced-motion';
import { FOREST, currentSepiaPalette, type Palette } from './palettes';
import { mulberry32 } from './rng';
import { sinWave } from './easing';
import { leafVerts } from './leaf';
import { THEME_EVENT } from '../theme-toggle';
import {
  TREE_ATMOSPHERE_EVENT,
  TREE_LEAF_SOURCES_EVENT,
  mapTreeAtmosphere,
  resolveTreeLeafFall,
  type LeafAtmosphere,
  type TreeLeafSource,
  type TreeLeafSourcesDetail,
} from './tree-atmosphere';

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
const CANOPY_DENSITY = 1.4;
const DEFAULT_LEAF_ATMOSPHERE: LeafAtmosphere = {
  densityMultiplier: 1,
  sizeMultiplier: 1,
  swayMultiplier: 1,
  widthMultiplier: 1,
  opacity: 0.2,
};
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
  const poolCount = Math.ceil(count * mapTreeAtmosphere({ depth: 9 }).densityMultiplier * CANOPY_DENSITY);
  let atmosphere = { ...DEFAULT_LEAF_ATMOSPHERE };
  let targetAtmosphere = { ...atmosphere };
  if (opts.ariaHidden !== false) canvas.setAttribute('aria-hidden', 'true');

  let cssW = 0;
  let cssH = 0;
  let dpr = 1;
  let map: CanvasMap = makeCanvasMap(1, 1, FRAME_UNITS_HEIGHT);
  let leaves: Leaf[] = [];
  let topY = 0;
  let span = 0;
  let lastDrawTime = 0;
  let canvasLeft = 0;
  let canvasTop = 0;
  let leafSources: TreeLeafSource[] = [];
  let fadeStartY = 0;
  let fadeEndY = 0;

  function configure(): void {
    dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvasLeft = rect.left || 0;
    canvasTop = rect.top || 0;
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
    // A fixed seeded pool keeps existing leaves in place as density changes.
    leaves = buildLeaves(rng, frameWidth, poolCount, palette);
    let maxSize = 0;
    for (const l of leaves.slice(0, count)) if (l.size > maxSize) maxSize = l.size;
    const margin = maxSize * 0.8;
    topY = FRAME_UNITS_HEIGHT / 2 + margin;
    span = FRAME_UNITS_HEIGHT + 2 * margin;
  }

  function draw(t: number): void {
    lastDrawTime = t;
    if (cssW < 2 || cssH < 2) return;
    ctx!.clearRect(0, 0, cssW, cssH);
    const visibleCount = count * atmosphere.densityMultiplier * (leafSources.length ? CANOPY_DENSITY : 1);
    for (let leafIndex = 0; leafIndex < leaves.length; leafIndex++) {
      // A fractional last leaf fades in/out while the shared tick eases density.
      const visibility = Math.max(0, Math.min(1, visibleCount - leafIndex));
      if (visibility === 0) continue;
      const l = leaves[leafIndex] as Leaf;
      const progress = (l.baseProgress + (l.fallCycles * t) / DURATION) % 1.0;
      const y = topY - progress * span;
      const swayPeriod = DURATION / l.swayCycles;
      const x = l.baseX + SWAY_AMP * atmosphere.swayMultiplier * sinWave(t, swayPeriod, l.swayPhase);
      const angle = l.tilt + 2 * Math.PI * l.rotCycles * (t / DURATION) + l.rotPhase
        + (leafSources.length ? .28 * Math.sin(t * 1.7 + l.rotPhase) : 0);

      let cx = map.toX(x);
      let cy = map.toY(y);
      let pathOpacity = 1;
      let canopyContrast = 1;
      const source = leafSources[Math.floor(((leafIndex * 0.61803398875) % 1) * leafSources.length)];
      if (source) {
        const fall = resolveTreeLeafFall(source, progress, {
          drift: Math.cos(l.rotPhase) * (130 + 70 * l.swayPhase) * atmosphere.swayMultiplier,
          sway: 24 * atmosphere.swayMultiplier,
          fadeStartY,
          fadeEndY,
        });
        // The canopy uses document positions; this canvas remains fixed to the viewport.
        cx = fall.x - window.scrollX - canvasLeft;
        cy = fall.y - window.scrollY - canvasTop;
        pathOpacity = fall.opacity;
        // Make the release from the canopy legible, then soften into the page background.
        canopyContrast = 1 + 2.4 * Math.exp(-(fall.y - source.y) / 440);
        if (cx < -50 || cx > cssW + 50 || cy < -50 || cy > cssH + 50) continue;
      }
      const sizePx = l.size * map.u * atmosphere.sizeMultiplier * (source ? 0.95 : 1);
      const verts = leafVerts(sizePx);
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);

      const layerOpacity = source ? Math.max(0.55, l.opacity) : l.opacity;
      ctx!.globalAlpha = layerOpacity * opacity * atmosphere.opacity * visibility * pathOpacity * canopyContrast;
      ctx!.fillStyle = l.color;
      ctx!.beginPath();
      for (let i = 0; i < verts.length; i++) {
        const v = verts[i] as readonly [number, number];
        const vx = v[0] * atmosphere.widthMultiplier;
        const rx = cos * vx - sin * v[1];
        const ry = sin * vx + cos * v[1];
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
        draw(isReducedMotion() ? 0 : lastDrawTime);
      })
    : null;
  ro?.observe(canvas);

  const unregister = registerTick((dt, t) => {
    if (isReducedMotion()) return;
    const blend = 1 - Math.exp(-12 * dt);
    for (const key of Object.keys(atmosphere) as (keyof LeafAtmosphere)[]) {
      const difference = targetAtmosphere[key] - atmosphere[key];
      atmosphere[key] = Math.abs(difference) < 0.001
        ? targetAtmosphere[key]
        : atmosphere[key] + difference * blend;
    }
    draw(t / 1000);
  });

  const onAtmosphereChange = (event: Event): void => {
    targetAtmosphere = mapTreeAtmosphere((event as CustomEvent<unknown>).detail);
    if (isReducedMotion()) atmosphere = { ...targetAtmosphere };
    draw(isReducedMotion() ? 0 : lastDrawTime);
  };
  window.addEventListener(TREE_ATMOSPHERE_EVENT, onAtmosphereChange);

  const onLeafSources = (event: Event): void => {
    const detail = (event as CustomEvent<TreeLeafSourcesDetail>).detail;
    if (!detail || !Array.isArray(detail.points)) return;
    leafSources = detail.points
      .filter((point) => point && Number.isFinite(point.x) && Number.isFinite(point.y))
      .slice(0, 64)
      .map((point) => ({ x: point.x, y: point.y }));
    const canopyBottom = Math.max(0, ...leafSources.map((point) => point.y));
    fadeStartY = typeof detail.fadeStartY === 'number' && Number.isFinite(detail.fadeStartY)
      ? detail.fadeStartY : canopyBottom + 650;
    fadeEndY = typeof detail.fadeEndY === 'number' && Number.isFinite(detail.fadeEndY)
      ? detail.fadeEndY : canopyBottom + 1100;
    draw(isReducedMotion() ? 0 : lastDrawTime);
  };
  window.addEventListener(TREE_LEAF_SOURCES_EVENT, onLeafSources);

  const onScroll = (): void => {
    // Reduced motion pauses the shared loop, but fixed-canvas positions still follow scrolling.
    if (leafSources.length > 0 && isReducedMotion()) draw(0);
  };
  window.addEventListener('scroll', onScroll, { passive: true });

  const unsubscribeReducedMotion = onReducedMotionChange((reduced) => {
    if (!reduced) return;
    atmosphere = { ...targetAtmosphere };
    draw(0);
  });

  // Re-paint when the user toggles theme. Only applies when this
  // instance was mounted with the 'sepia' palette (the FOREST
  // backwards-compat path stays fixed).
  const onThemeChange = (): void => {
    if (paletteChoice !== 'sepia') return;
    palette = currentSepiaPalette();
    rebuild();
    draw(isReducedMotion() ? 0 : lastDrawTime);
  };
  window.addEventListener(THEME_EVENT, onThemeChange);

  return {
    setOpacity(o: number): void {
      opacity = o;
      draw(isReducedMotion() ? 0 : lastDrawTime);
    },
    stop(): void {
      unregister();
      ro?.disconnect();
      unsubscribeReducedMotion();
      window.removeEventListener(THEME_EVENT, onThemeChange);
      window.removeEventListener(TREE_ATMOSPHERE_EVENT, onAtmosphereChange);
      window.removeEventListener(TREE_LEAF_SOURCES_EVENT, onLeafSources);
      window.removeEventListener('scroll', onScroll);
    },
  };
}
