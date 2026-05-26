import { describe, expect, it } from 'vitest';
import { mulberry32, pick, randInt } from './prng';

describe('mulberry32', () => {
  it('produces values in [0, 1)', () => {
    const rng = mulberry32(42);
    for (let i = 0; i < 1_000; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('is deterministic — same seed yields identical sequence', () => {
    const seq1 = Array.from({ length: 20 }, mulberry32(42));
    const seq2 = Array.from({ length: 20 }, mulberry32(42));
    expect(seq1).toEqual(seq2);
  });

  it('different seeds produce different sequences', () => {
    const seq1 = Array.from({ length: 10 }, mulberry32(1));
    const seq2 = Array.from({ length: 10 }, mulberry32(2));
    expect(seq1).not.toEqual(seq2);
  });
});

describe('randInt', () => {
  it('returns integers in [0, n)', () => {
    const rng = mulberry32(7);
    for (let i = 0; i < 500; i++) {
      const v = randInt(rng, 10);
      expect(Number.isInteger(v)).toBe(true);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(10);
    }
  });
});

describe('pick', () => {
  it('always returns an element from the array', () => {
    const rng = mulberry32(99);
    const arr = ['a', 'b', 'c', 'd'] as const;
    for (let i = 0; i < 200; i++) {
      expect(arr).toContain(pick(rng, arr));
    }
  });
});
