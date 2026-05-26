import { createReadStream } from 'node:fs';
import { createInterface } from 'node:readline';

/**
 * Stream a plain-text name file line-by-line and return the non-blank lines.
 *
 * Design choices:
 *  - readline + createReadStream: O(1) memory; the OS page cache does the
 *    heavy lifting without ever holding the whole file in the JS heap.
 *  - Returns Promise<string[]>: the caller owns the array and the file handle
 *    is closed immediately after the last line is emitted.
 */
export async function loadNames(filePath: string): Promise<string[]> {
  const names: string[] = [];
  const rl = createInterface({
    input: createReadStream(filePath, { encoding: 'utf8' }),
    crlfDelay: Infinity,
  });

  for await (const line of rl) {
    const trimmed = line.trim();
    if (trimmed.length > 0) {
      names.push(trimmed);
    }
  }

  if (names.length === 0) {
    throw new Error(`loadNames: no entries found in ${filePath}`);
  }

  return names;
}
