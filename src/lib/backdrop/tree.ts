/**
 * @file tree.ts
 *
 * Public mount/lifecycle for the recursive tree backdrop. Wires the
 * pure algorithm in `tree-algorithm.ts` (plus `leaf.ts` and `particle.ts`)
 * to a canvas + the central rAF loop in `lib/boot.ts`.
 *
 * One usage on the site (the threshold tree). When the user clicks
 * the threshold canvas, the tree-mode primitive calls setOpacity(1.0)
 * and live-tunes constants via setOverrides — that interaction
 * replaces the former dedicated on-recursion section.
 *
 * Spec: [[Concept - Recursive Tree Backdrop]] in the Obsidian docs.
 *
 * DPR-aware sizing: the canvas's internal bitmap is sized at device
 * pixel ratio; the CSS box stays in CSS pixels; `ctx.setTransform(dpr,…)`
 * makes drawing-in-CSS-pixels write at native resolution. On resize the
 * branches are kept (deterministic from seed) and the layout re-fits.
 */

import { registerTick } from '../boot';
import { isReducedMotion } from '../reduced-motion';

import { FOREST, currentSepiaPalette, type Palette } from './palettes';
import { mulberry32 } from './rng';
import { THEME_EVENT } from '../theme-toggle';
import {
  TREE_CONST,
  buildBranches,
  drawBranches,
  makeResolvedFrame,
  resolveTree,
  type Branch,
  type CanvasMap,
  type ResolvedFrame,
  type TreeConstants,
} from './tree-algorithm';
import { buildLeaves, drawLeaves, type LeafSpec } from './leaf';
import {
  PARTICLE_CONST,
  buildParticles,
  drawParticles,
  resolveParticles,
  type ParticleSpec,
} from './particle';

// Manim's reference frame height is 8 units (matches MACBOOK_AIR_13_M5).
const FRAME_UNITS_HEIGHT = 8;

export interface TreeOptions {
  /** 'sepia' picks the per-theme variant; 'forest' is the Phase 4 fallback. */
  palette?: 'forest' | 'sepia';
  /** Multiplier on top of per-branch line opacity. 0..1. Default 1.0. */
  opacity?: number;
  /** Multiplier on both sway amplitudes. 1.0 = full. Default 1.0. */
  swayScale?: number;
  /** Override particle count (defaults to PARTICLE_CONST.NUM_PARTICLES). */
  numParticles?: number;
  /** RNG seed override. Same seed → same tree shape. */
  seed?: number;
  /** Add aria-hidden="true" to the canvas (decorative). Default true. */
  ariaHidden?: boolean;
  /** Override any subset of the tree constants (used by live-param UI). */
  overrideConst?: Partial<TreeConstants>;
}

export interface TreeHandle {
  setOpacity(o: number): void;
  setOverrides(p: Partial<TreeConstants>): void;
  stop(): void;
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

export function mountTree(canvas: HTMLCanvasElement, opts: TreeOptions = {}): TreeHandle {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('mountTree: 2d context unavailable');

  const baseConsts: TreeConstants = { ...TREE_CONST, ...(opts.overrideConst ?? {}) };
  let consts: TreeConstants = baseConsts;
  const paletteChoice: 'forest' | 'sepia' = opts.palette ?? 'sepia';
  let palette: Palette =
    paletteChoice === 'forest' ? FOREST : currentSepiaPalette();
  let opacity = opts.opacity ?? 1.0;
  const swayScale = opts.swayScale ?? 1.0;
  const numParticles = opts.numParticles ?? PARTICLE_CONST.NUM_PARTICLES;
  const seed = opts.seed ?? consts.RNG_SEED;
  if (opts.ariaHidden !== false) canvas.setAttribute('aria-hidden', 'true');

  let cssW = 0;
  let cssH = 0;
  let dpr = 1;
  let map: CanvasMap = makeCanvasMap(1, 1, FRAME_UNITS_HEIGHT);

  let branches: Branch[] = [];
  let leaves: LeafSpec[] = [];
  let particles: ParticleSpec[] = [];
  let frame: ResolvedFrame = makeResolvedFrame(0);

  function rebuildState(): void {
    const rng = mulberry32(seed);
    branches = buildBranches(rng, consts);
    leaves = buildLeaves(rng, branches, palette, consts);
    const frameWidth = cssH > 0 ? (cssW / cssH) * FRAME_UNITS_HEIGHT : FRAME_UNITS_HEIGHT;
    particles = buildParticles(rng, frameWidth, numParticles);
    frame = makeResolvedFrame(branches.length);
  }

  function configure(): void {
    dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    // Fall back to the canvas's declared size if the element is not yet
    // laid out (e.g., display:none parent at mount time).
    cssW = Math.max(1, Math.round(rect.width || canvas.clientWidth || canvas.width || 1));
    cssH = Math.max(1, Math.round(rect.height || canvas.clientHeight || canvas.height || 1));
    canvas.width = Math.floor(cssW * dpr);
    canvas.height = Math.floor(cssH * dpr);
    canvas.style.width = `${cssW}px`;
    canvas.style.height = `${cssH}px`;
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    map = makeCanvasMap(cssW, cssH, FRAME_UNITS_HEIGHT);
  }

  function draw(tSeconds: number): void {
    if (cssW < 2 || cssH < 2) return;
    resolveTree(branches, tSeconds, frame, swayScale, consts);
    const resolved = resolveParticles(particles, tSeconds, FRAME_UNITS_HEIGHT, consts);

    ctx!.clearRect(0, 0, cssW, cssH);
    // Particles behind tree.
    drawParticles(ctx!, resolved, map, palette, opacity);
    drawBranches(ctx!, branches, frame, map, palette, opacity, consts);
    drawLeaves(ctx!, leaves, frame, map, opacity);
  }

  // Initial setup
  configure();
  rebuildState();
  draw(0);

  // ResizeObserver: rebuild on size changes, keep seed so the tree's
  // identity is preserved.
  const ro =
    typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(() => {
          configure();
          rebuildState();
          draw(isReducedMotion() ? 0 : performance.now() / 1000);
        })
      : null;
  ro?.observe(canvas);

  // rAF tick
  const unregister = registerTick((_dt, t) => {
    if (isReducedMotion()) return;
    draw(t / 1000);
  });

  // Theme swap → re-resolve palette + rebuild leaf colors (which were
  // baked at build time from `palette.tones`). Branches re-stroke via
  // tone(palette, t01) at draw time, so they pick up the new palette
  // on the very next frame regardless.
  const onThemeChange = (): void => {
    if (paletteChoice !== 'sepia') return;
    palette = currentSepiaPalette();
    rebuildState();
    draw(isReducedMotion() ? 0 : performance.now() / 1000);
  };
  window.addEventListener(THEME_EVENT, onThemeChange);

  return {
    setOpacity(o: number): void {
      opacity = o;
    },
    setOverrides(p: Partial<TreeConstants>): void {
      consts = { ...consts, ...p };
      rebuildState();
      draw(isReducedMotion() ? 0 : performance.now() / 1000);
    },
    stop(): void {
      unregister();
      ro?.disconnect();
      window.removeEventListener(THEME_EVENT, onThemeChange);
    },
  };
}
