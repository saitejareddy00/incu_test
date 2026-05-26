/**
 * Mulberry32 — a fast, well-distributed 32-bit PRNG with a single uint32 state.
 *
 * Chosen because:
 *  - Deterministic given a seed (repeatability requirement)
 *  - Single integer state — negligible memory per generator instance
 *  - ~1 ns/call — no bottleneck for 100k+ row generation
 *  - No external dependency
 *
 * Reference: https://gist.github.com/tommyettinger/46a874533244883189143505d203312c
 */
export type Rng = () => number;

export function mulberry32(seed: number): Rng {
  let s = seed >>> 0; // ensure unsigned 32-bit
  return function () {
    s = (s + 0x6d2b79f5) >>> 0;
    let z = s;
    z = Math.imul(z ^ (z >>> 15), z | 1);
    z ^= z + Math.imul(z ^ (z >>> 7), z | 61);
    z = (z ^ (z >>> 14)) >>> 0;
    return z / 0x100000000; // [0, 1)
  };
}

/** Pick a random integer in [0, n). */
export function randInt(rng: Rng, n: number): number {
  return Math.floor(rng() * n);
}

/** Pick a uniformly random element from an array. */
export function pick<T>(rng: Rng, arr: readonly T[]): T {
  return arr[randInt(rng, arr.length)];
}
