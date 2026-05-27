/**
 * @file tree-algorithm.ts
 *
 * Pure math + canvas-side drawing for the recursive tree's BRANCHES.
 * Ported 1:1 from ~/Developer/Manim_Wallpaper/scenes/recursive_tree_v2.py.
 *
 * Coordinate convention: Manim-native everywhere (origin at frame
 * center, +y up). The canvas adapter (`tree.ts#makeCanvasMap`) flips y
 * at draw time. Keeping math in Manim coords means the algorithm here
 * is line-for-line comparable with the Python source — important for
 * review and for verifying against the reference MP4.
 *
 * Spec: [[Concept - Recursive Tree Backdrop]] in the Obsidian docs.
 */

import type { Palette } from './palettes';
import { tone } from './palettes';
import { sinWave } from './easing';
import type { RNG } from './rng';

// ---------- constants (mirror recursive_tree_v2.py) ----------

export interface TreeConstants {
  RNG_SEED: number;
  MAX_DEPTH: number;
  TRUNK_LENGTH: number;
  LENGTH_RATIO: number;
  LENGTH_JITTER: number;
  BRANCH_ANGLE: number;       // radians
  ANGLE_JITTER: number;       // radians
  INITIAL_ANGLE: number;      // radians
  TRUNK_BASE_Y: number;

  THREE_WAY_PROB: number;
  THREE_WAY_ANGLE: number;    // radians
  THREE_WAY_LENGTH_FACTOR: number;

  TRUNK_STROKE: number;       // px
  LEAF_STROKE: number;        // px

  LEAF_DEPTH_MIN: number;
  LEAF_SIZE_MIN: number;
  LEAF_SIZE_MAX: number;
  LEAF_OPACITY: number;
  LEAF_ROTATION_JITTER: number; // radians

  DURATION: number;           // seconds
  PRIMARY_PERIOD: number;
  PRIMARY_AMP_PER_BRANCH: number;
  PRIMARY_PHASE_PER_DEPTH: number;
  SECONDARY_PERIOD: number;
  SECONDARY_AMP_PER_BRANCH: number;
  SECONDARY_PHASE_PER_DEPTH: number;
}

export const TREE_CONST: TreeConstants = {
  RNG_SEED: 42,
  MAX_DEPTH: 8,
  TRUNK_LENGTH: 1.80,
  LENGTH_RATIO: 0.74,
  LENGTH_JITTER: 0.10,
  BRANCH_ANGLE: (27 * Math.PI) / 180,
  ANGLE_JITTER: (7 * Math.PI) / 180,
  INITIAL_ANGLE: Math.PI / 2,
  TRUNK_BASE_Y: -3.5,

  THREE_WAY_PROB: 0.12,
  THREE_WAY_ANGLE: (6 * Math.PI) / 180,
  THREE_WAY_LENGTH_FACTOR: 0.88,

  TRUNK_STROKE: 18,
  LEAF_STROKE: 1.4,

  LEAF_DEPTH_MIN: 8,
  LEAF_SIZE_MIN: 0.10,
  LEAF_SIZE_MAX: 0.18,
  LEAF_OPACITY: 0.90,
  LEAF_ROTATION_JITTER: (22 * Math.PI) / 180,

  DURATION: 12.0,
  PRIMARY_PERIOD: 6.0,
  PRIMARY_AMP_PER_BRANCH: (1.4 * Math.PI) / 180,
  PRIMARY_PHASE_PER_DEPTH: 0.03,
  SECONDARY_PERIOD: 12.0,
  SECONDARY_AMP_PER_BRANCH: (0.7 * Math.PI) / 180,
  SECONDARY_PHASE_PER_DEPTH: 0.06,
};

// ---------- types ----------

export interface Branch {
  parent: number;
  relAngle: number;
  length: number;
  depth: number;
  isTerminal: boolean;
}

export interface ResolvedFrame {
  starts: Float32Array;
  ends: Float32Array;
  absAngles: Float32Array;
}

// ---------- build (once per instance) ----------

export function buildBranches(rng: RNG, consts: TreeConstants = TREE_CONST): Branch[] {
  const branches: Branch[] = [];

  function recurse(parent: number, length: number, relAngle: number, depth: number): void {
    if (depth > consts.MAX_DEPTH || length < 0.045) return;
    const isTerminal = depth === consts.MAX_DEPTH;
    branches.push({ parent, relAngle, length, depth, isTerminal });
    if (isTerminal) return;

    const thisIdx = branches.length - 1;

    const aL = +consts.BRANCH_ANGLE + rng.uniform(-consts.ANGLE_JITTER, consts.ANGLE_JITTER);
    const aR = -consts.BRANCH_ANGLE + rng.uniform(-consts.ANGLE_JITTER, consts.ANGLE_JITTER);
    const lL = length * consts.LENGTH_RATIO * (1 + rng.uniform(-consts.LENGTH_JITTER, consts.LENGTH_JITTER));
    const lR = length * consts.LENGTH_RATIO * (1 + rng.uniform(-consts.LENGTH_JITTER, consts.LENGTH_JITTER));

    recurse(thisIdx, lL, aL, depth + 1);
    recurse(thisIdx, lR, aR, depth + 1);

    if (rng.random() < consts.THREE_WAY_PROB) {
      const aC = rng.uniform(-consts.THREE_WAY_ANGLE, consts.THREE_WAY_ANGLE);
      const lC =
        length *
        consts.LENGTH_RATIO *
        consts.THREE_WAY_LENGTH_FACTOR *
        (1 + rng.uniform(-consts.LENGTH_JITTER, consts.LENGTH_JITTER));
      recurse(thisIdx, lC, aC, depth + 1);
    }
  }

  recurse(-1, consts.TRUNK_LENGTH, consts.INITIAL_ANGLE, 0);
  return branches;
}

export function makeResolvedFrame(n: number): ResolvedFrame {
  return {
    starts: new Float32Array(n * 2),
    ends: new Float32Array(n * 2),
    absAngles: new Float32Array(n),
  };
}

// ---------- resolve (per frame) ----------

/**
 * Compute world positions and absolute angles for every branch at time `t`.
 * One forward pass — DFS build order guarantees a parent's index is lower
 * than its children's, so by the time we reach branch `i` its parent is
 * already resolved.
 *
 * Sway is the sum of two sinusoids: a faster "breeze" and a slower "gust".
 * Each branch's phase shift increases with depth, so the wave appears to
 * travel up the tree.
 */
export function resolveTree(
  branches: Branch[],
  t: number,
  out: ResolvedFrame,
  swayScale: number = 1.0,
  consts: TreeConstants = TREE_CONST,
): void {
  const rootX = 0;
  const rootY = consts.TRUNK_BASE_Y;

  for (let i = 0; i < branches.length; i++) {
    const b = branches[i] as Branch;
    const primary =
      sinWave(t, consts.PRIMARY_PERIOD, b.depth * consts.PRIMARY_PHASE_PER_DEPTH) *
      consts.PRIMARY_AMP_PER_BRANCH;
    const secondary =
      sinWave(t, consts.SECONDARY_PERIOD, b.depth * consts.SECONDARY_PHASE_PER_DEPTH) *
      consts.SECONDARY_AMP_PER_BRANCH;
    const sway = (primary + secondary) * swayScale;

    if (b.parent < 0) {
      out.starts[i * 2] = rootX;
      out.starts[i * 2 + 1] = rootY;
      out.absAngles[i] = b.relAngle + sway;
    } else {
      const p = b.parent;
      out.starts[i * 2] = out.ends[p * 2] as number;
      out.starts[i * 2 + 1] = out.ends[p * 2 + 1] as number;
      out.absAngles[i] = (out.absAngles[p] as number) + b.relAngle + sway;
    }

    const a = out.absAngles[i] as number;
    out.ends[i * 2] = (out.starts[i * 2] as number) + Math.cos(a) * b.length;
    out.ends[i * 2 + 1] = (out.starts[i * 2 + 1] as number) + Math.sin(a) * b.length;
  }
}

// ---------- draw branches ----------

export interface CanvasMap {
  cw: number;
  ch: number;
  u: number;
  toX(mx: number): number;
  toY(my: number): number;
}

export function drawBranches(
  ctx: CanvasRenderingContext2D,
  branches: Branch[],
  frame: ResolvedFrame,
  map: CanvasMap,
  palette: Palette,
  opacity: number = 1.0,
  consts: TreeConstants = TREE_CONST,
): void {
  ctx.lineCap = 'round';
  for (let i = 0; i < branches.length; i++) {
    const b = branches[i] as Branch;
    const t01 = b.depth / consts.MAX_DEPTH;
    ctx.strokeStyle = tone(palette, t01);
    ctx.lineWidth = consts.TRUNK_STROKE * (1 - t01) + consts.LEAF_STROKE * t01;
    ctx.globalAlpha = opacity;
    ctx.beginPath();
    ctx.moveTo(
      map.toX(frame.starts[i * 2] as number),
      map.toY(frame.starts[i * 2 + 1] as number),
    );
    ctx.lineTo(
      map.toX(frame.ends[i * 2] as number),
      map.toY(frame.ends[i * 2 + 1] as number),
    );
    ctx.stroke();
  }
  ctx.globalAlpha = 1.0;
}
