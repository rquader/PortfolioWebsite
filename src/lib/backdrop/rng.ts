/**
 * @file rng.ts
 *
 * Mulberry32 — a small, fast, well-distributed seeded PRNG. The same
 * seed yields the same sequence; that determinism is what makes the
 * tree's shape reproducible across reloads (seed=42 always grows the
 * same tree).
 *
 * Reference: https://stackoverflow.com/a/47593316 (public-domain).
 */

export interface RNG {
  random(): number;
  uniform(a: number, b: number): number;
  choice<T>(items: readonly T[]): T;
}

export function mulberry32(seed: number): RNG {
  let s = seed >>> 0;

  function random(): number {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  return {
    random,
    uniform(a, b) {
      return a + (b - a) * random();
    },
    choice<T>(items: readonly T[]): T {
      if (items.length === 0) throw new Error('rng.choice: empty array');
      return items[Math.floor(random() * items.length)] as T;
    },
  };
}
