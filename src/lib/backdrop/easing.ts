/**
 * @file easing.ts
 *
 * Periodic easing helpers ported from
 * ~/Developer/Manim_Wallpaper/lib/easing.py.
 *
 * `sinWave(t, period, phase)` produces a sine in [-1, 1] with the given
 * period (seconds). `phase` is in cycles (0 = no shift, 0.25 = quarter
 * cycle, 1 = full cycle).
 */

export function sinWave(t: number, period: number, phase: number = 0): number {
  return Math.sin(2 * Math.PI * (t / period + phase));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function clamp(x: number, lo: number, hi: number): number {
  return x < lo ? lo : x > hi ? hi : x;
}
