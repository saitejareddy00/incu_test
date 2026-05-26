import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { loadNames } from './loadNames';

const DATA_DIR = resolve(__dirname, '../../data');

describe('loadNames', () => {
  it('loads first_names.txt with ≥ 400 entries and no blank lines', async () => {
    const names = await loadNames(resolve(DATA_DIR, 'first_names.txt'));
    expect(names.length).toBeGreaterThanOrEqual(400);
    for (const n of names) {
      expect(n.trim()).toBe(n);
      expect(n.length).toBeGreaterThan(0);
    }
  });

  it('loads last_names.txt with ≥ 400 entries and no blank lines', async () => {
    const names = await loadNames(resolve(DATA_DIR, 'last_names.txt'));
    expect(names.length).toBeGreaterThanOrEqual(400);
    for (const n of names) {
      expect(n.trim()).toBe(n);
      expect(n.length).toBeGreaterThan(0);
    }
  });

  it('throws when the file does not exist', async () => {
    await expect(loadNames('/no/such/file.txt')).rejects.toThrow();
  });

  it('returns a Promise that resolves to an array', async () => {
    const result = loadNames(resolve(DATA_DIR, 'first_names.txt'));
    expect(result).toBeInstanceOf(Promise);
    const names = await result;
    expect(Array.isArray(names)).toBe(true);
  });
});
