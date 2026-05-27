/**
 * @file leaf.ts
 *
 * 10-vertex stylized leaf polygon. Builds per-leaf metadata at construction
 * time, draws each leaf at the end of its branch at draw time.
 *
 * The polygon's canonical orientation has the tip at +y_manim (matching
 * the Python source's `_Leaf._build`). The draw function applies a
 * Manim-CCW rotation to align the leaf's tip with its branch's direction,
 * then flips the result to canvas's +y-down coordinate.
 *
 * Spec: [[Concept - Recursive Tree Backdrop#leaf polygon]].
 */

import type { Palette } from './palettes';
import type { RNG } from './rng';
import type { Branch, CanvasMap, ResolvedFrame, TreeConstants } from './tree-algorithm';
import { TREE_CONST } from './tree-algorithm';

export interface LeafSpec {
  branchIdx: number;
  size: number;        // normalized units
  color: string;       // hex
  opacity: number;
  rotationJitter: number; // radians, Manim CCW
}

export function buildLeaves(
  rng: RNG,
  branches: Branch[],
  palette: Palette,
  consts: TreeConstants = TREE_CONST,
): LeafSpec[] {
  const out: LeafSpec[] = [];
  // Leaf colors: the two high-key tones + the accent.
  const tones = palette.tones;
  const leafPalette: readonly string[] = [
    (tones[tones.length - 2] ?? tones[0]) as string,
    (tones[tones.length - 1] ?? tones[0]) as string,
    palette.accent,
  ];

  for (let i = 0; i < branches.length; i++) {
    const b = branches[i] as Branch;
    if (b.depth < consts.LEAF_DEPTH_MIN) continue;
    out.push({
      branchIdx: i,
      size: rng.uniform(consts.LEAF_SIZE_MIN, consts.LEAF_SIZE_MAX),
      color: rng.choice(leafPalette),
      opacity: consts.LEAF_OPACITY,
      rotationJitter: rng.uniform(-consts.LEAF_ROTATION_JITTER, consts.LEAF_ROTATION_JITTER),
    });
  }
  return out;
}

/**
 * Canonical 10-vertex leaf polygon in Manim-native coordinates with the
 * tip at +y. Exported so both the recursive-tree canopy renderer
 * (`drawLeaves` below) and the page-wide falling-leaves backdrop
 * (`falling-leaves.ts`) draw the exact same shape — visual continuity
 * is part of [[specs/2026-05-18-tree-leaves-folders-design#4.1]].
 */
export function leafVerts(sizePx: number): readonly (readonly [number, number])[] {
  const h = sizePx;
  const w = sizePx * 0.55;
  return [
    [0, h],                    // tip
    [w * 0.55, h * 0.65],     // upper right shoulder
    [w, h * 0.20],             // mid-right widest
    [w * 0.60, -h * 0.25],    // lower-right curve
    [w * 0.20, -h * 0.48],    // near-base right
    [0, -h * 0.58],            // base
    [-w * 0.20, -h * 0.48],   // near-base left
    [-w * 0.60, -h * 0.25],   // lower-left curve
    [-w, h * 0.20],            // mid-left widest
    [-w * 0.55, h * 0.65],    // upper left shoulder
  ];
}

export function drawLeaves(
  ctx: CanvasRenderingContext2D,
  leaves: LeafSpec[],
  frame: ResolvedFrame,
  map: CanvasMap,
  opacity: number = 1.0,
): void {
  for (const leaf of leaves) {
    const i = leaf.branchIdx;
    const cx = map.toX(frame.ends[i * 2] as number);
    const cy = map.toY(frame.ends[i * 2 + 1] as number);
    const branchAngleManim = frame.absAngles[i] as number;

    // Manim rotation: branch_angle - π/2 + jitter (CCW from +x).
    const rotManim = branchAngleManim - Math.PI / 2 + leaf.rotationJitter;
    const cos = Math.cos(rotManim);
    const sin = Math.sin(rotManim);

    const sizePx = leaf.size * map.u;
    const vs = leafVerts(sizePx);

    ctx.globalAlpha = leaf.opacity * opacity;
    ctx.fillStyle = leaf.color;
    ctx.beginPath();
    for (let v = 0; v < vs.length; v++) {
      const [vx, vy] = vs[v] as readonly [number, number];
      // Rotate in Manim, then translate + flip y for canvas.
      const rx = cos * vx - sin * vy;
      const ry = sin * vx + cos * vy;
      const x = cx + rx;
      const y = cy - ry;
      if (v === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
  }
  ctx.globalAlpha = 1.0;
}
