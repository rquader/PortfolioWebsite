/**
 * @file particle.ts
 *
 * Pollen-like particles drifting up the field with horizontal sway.
 * Wraps from bottom-of-frame to top-of-frame seamlessly.
 *
 * Math stays in Manim coords; the canvas adapter handles the y-flip
 * at draw time. Ported from recursive_tree_v2.py's particle pipeline.
 */

import type { CanvasMap, TreeConstants } from './tree-algorithm';
import { TREE_CONST } from './tree-algorithm';
import { sinWave } from './easing';
import type { RNG } from './rng';
import type { Palette } from './palettes';

// Particle-specific constants (kept here since they're particle-only).
// Mirrors recursive_tree_v2.py.
export const PARTICLE_CONST = {
  NUM_PARTICLES: 24,
  RADIUS_MIN: 0.022,
  RADIUS_MAX: 0.055,
  OPACITY: 0.55,
  SWAY_AMP: 0.32,
  DRIFT_CYCLES: [1, 1, 2] as const,
  SWAY_CYCLES: [1, 2] as const,
} as const;

export type ParticleConstants = typeof PARTICLE_CONST;

export interface ParticleSpec {
  baseX: number;        // Manim coord
  baseProgress: number; // 0..1
  radius: number;       // Manim units
  driftCycles: number;
  swayCycles: number;
  swayPhase: number;
}

export function buildParticles(
  rng: RNG,
  frameWidth: number,
  count: number = PARTICLE_CONST.NUM_PARTICLES,
  consts: ParticleConstants = PARTICLE_CONST,
): ParticleSpec[] {
  const out: ParticleSpec[] = [];
  for (let i = 0; i < count; i++) {
    out.push({
      baseX: rng.uniform(-frameWidth / 2 + 0.4, frameWidth / 2 - 0.4),
      baseProgress: rng.uniform(0, 1),
      radius: rng.uniform(consts.RADIUS_MIN, consts.RADIUS_MAX),
      driftCycles: rng.choice(consts.DRIFT_CYCLES),
      swayCycles: rng.choice(consts.SWAY_CYCLES),
      swayPhase: rng.random(),
    });
  }
  return out;
}

/** Resolve all particles' Manim-space positions at time `t`. */
export function resolveParticles(
  particles: readonly ParticleSpec[],
  t: number,
  frameHeight: number,
  tree: TreeConstants = TREE_CONST,
  consts: ParticleConstants = PARTICLE_CONST,
  out?: { x: number; y: number; radius: number }[],
): { x: number; y: number; radius: number }[] {
  const target = out ?? new Array<{ x: number; y: number; radius: number }>(particles.length);
  const margin = consts.RADIUS_MAX * 1.5;
  const span = frameHeight + 2 * margin;
  const bottomY = -frameHeight / 2 - margin;

  for (let i = 0; i < particles.length; i++) {
    const p = particles[i] as ParticleSpec;
    const progress = (p.baseProgress + (p.driftCycles * t) / tree.DURATION) % 1;
    const y = bottomY + progress * span;
    const swayPeriod = tree.DURATION / p.swayCycles;
    const x = p.baseX + consts.SWAY_AMP * sinWave(t, swayPeriod, p.swayPhase);
    const radius = p.radius;
    if (target[i]) {
      const slot = target[i] as { x: number; y: number; radius: number };
      slot.x = x;
      slot.y = y;
      slot.radius = radius;
    } else {
      target[i] = { x, y, radius };
    }
  }
  return target;
}

export function drawParticles(
  ctx: CanvasRenderingContext2D,
  resolved: readonly { x: number; y: number; radius: number }[],
  map: CanvasMap,
  palette: Palette,
  opacity: number = 1.0,
  consts: ParticleConstants = PARTICLE_CONST,
): void {
  ctx.fillStyle = palette.accent;
  ctx.globalAlpha = consts.OPACITY * opacity;
  for (const p of resolved) {
    const cx = map.toX(p.x);
    const cy = map.toY(p.y);
    const r = p.radius * map.u;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, 2 * Math.PI);
    ctx.fill();
  }
  ctx.globalAlpha = 1.0;
}
