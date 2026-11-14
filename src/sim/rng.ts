// Seeded pseudo-random generator. Pure: a given seed always yields the same
// sequence. The simulation must use only this, never Math.random().

export interface Rng {
  /** Next float in [0, 1). */
  next(): number;
  /** Next float in [min, max). */
  range(min: number, max: number): number;
}

/**
 * mulberry32 — a small, fast, deterministic PRNG.
 * See https://stackoverflow.com/a/47593316 (algorithm is public domain).
 */
export function makeRng(seed: number): Rng {
  let a = seed >>> 0;
  function next(): number {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  return {
    next,
    range(min: number, max: number) {
      return min + next() * (max - min);
    },
  };
}
