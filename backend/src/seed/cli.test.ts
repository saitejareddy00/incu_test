import { describe, expect, it } from 'vitest';
import { DEFAULTS, parseArgs } from './cli';

describe('parseArgs — defaults', () => {
  it('returns all defaults when no args are given', () => {
    const opts = parseArgs([]);
    expect(opts.count).toBe(DEFAULTS.count);
    expect(opts.seed).toBe(DEFAULTS.seed);
    expect(opts.truncate).toBe(false);
    expect(opts.batchSize).toBe(DEFAULTS.batchSize);
  });
});

describe('parseArgs — valid flags', () => {
  it('parses --count', () => {
    expect(parseArgs(['--count', '500']).count).toBe(500);
    expect(parseArgs(['--count=500']).count).toBe(500);
  });

  it('parses --seed', () => {
    expect(parseArgs(['--seed', '99']).seed).toBe(99);
  });

  it('parses --truncate as a boolean flag', () => {
    expect(parseArgs(['--truncate']).truncate).toBe(true);
    expect(parseArgs([]).truncate).toBe(false);
  });

  it('parses --batch-size (kebab-case)', () => {
    expect(parseArgs(['--batch-size', '250']).batchSize).toBe(250);
    expect(parseArgs(['--batch-size=250']).batchSize).toBe(250);
  });

  it('parses all flags together', () => {
    const opts = parseArgs(['--count', '1000', '--seed', '7', '--truncate', '--batch-size', '200']);
    expect(opts).toMatchObject({ count: 1000, seed: 7, truncate: true, batchSize: 200 });
  });
});

describe('parseArgs — invalid flags', () => {
  it('throws for --count 0', () => {
    expect(() => parseArgs(['--count', '0'])).toThrow(/count must be > 0/i);
  });

  it('throws for --count negative', () => {
    expect(() => parseArgs(['--count', '-5'])).toThrow(/count must be > 0/i);
  });

  it('throws for --batch-size 0', () => {
    expect(() => parseArgs(['--batch-size', '0'])).toThrow(/batch-size must be > 0/i);
  });

  it('throws for --seed negative', () => {
    expect(() => parseArgs(['--seed', '-1'])).toThrow(/seed must be/i);
  });

  it('throws for an unknown flag', () => {
    expect(() => parseArgs(['--unknown'])).toThrow(/unknown flag/i);
  });

  it('throws when a value-requiring flag has no value', () => {
    expect(() => parseArgs(['--count'])).toThrow(/requires a value/i);
  });

  it('throws for non-integer --count', () => {
    expect(() => parseArgs(['--count', 'abc'])).toThrow();
  });
});
