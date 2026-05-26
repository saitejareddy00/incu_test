/**
 * CLI argument parser for the seed script.
 *
 * Design choices:
 *  - No external CLI library dependency: keeps the seed script self-contained
 *    and eliminates a transitive dependency for a dev-only tool.
 *  - Zod validation: reuses the project's existing schema tool; errors are
 *    human-readable and tested just like any other schema.
 *  - Immutable output type: callers receive a plain frozen object, making
 *    unintentional mutation impossible.
 */
import { z } from 'zod';

export const DEFAULTS = {
  count: 10_000,
  seed: 42,
  truncate: false,
  batchSize: 1_000,
  analyze: true,
} as const;

const cliSchema = z.object({
  count: z.coerce
    .number()
    .int('--count must be an integer')
    .positive('--count must be > 0')
    .default(DEFAULTS.count),
  seed: z.coerce
    .number()
    .int('--seed must be an integer')
    .nonnegative('--seed must be ≥ 0')
    .default(DEFAULTS.seed),
  truncate: z.boolean().default(DEFAULTS.truncate),
  analyze: z.boolean().default(DEFAULTS.analyze),
  batchSize: z.coerce
    .number()
    .int('--batch-size must be an integer')
    .positive('--batch-size must be > 0')
    .default(DEFAULTS.batchSize),
});

export type CliOptions = z.infer<typeof cliSchema>;

export const USAGE = `
Usage: seed [options]

Options:
  --count <n>       Number of rows to insert  (default: ${DEFAULTS.count})
  --seed <n>        PRNG seed for reproducibility  (default: ${DEFAULTS.seed})
  --truncate        Truncate the employees table before seeding
  --batch-size <n>  Rows per COPY call  (default: ${DEFAULTS.batchSize})
  --no-analyze      Skip ANALYZE employees after insert (faster, weaker planner stats)
  --help            Print this message and exit

Examples:
  seed --count 50000 --seed 123
  seed --count 1000 --truncate --batch-size 500
`.trim();

/**
 * Parse process.argv-style argument array into typed CLI options.
 * Throws a human-readable error string on invalid input (not an Error
 * object) so callers can print it directly without a stack trace).
 */
export function parseArgs(argv: string[]): CliOptions {
  const raw: Record<string, string | boolean> = {};

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];

    if (arg === '--help' || arg === '-h') {
      process.stdout.write(USAGE + '\n');
      process.exit(0);
    }

    if (arg === '--truncate') {
      raw.truncate = true;
      continue;
    }

    if (arg === '--no-analyze') {
      raw.analyze = false;
      continue;
    }

    const match = arg.match(/^--([\w-]+)(?:=(.+))?$/);
    if (!match) {
      throw `Unknown flag: ${arg}\n\n${USAGE}`;
    }

    const flagName = match[1];
    const key = flagName.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase()); // kebab → camel

    const KNOWN_VALUE_FLAGS = new Set(['count', 'seed', 'batchSize']);
    if (!KNOWN_VALUE_FLAGS.has(key)) {
      throw `Unknown flag: --${flagName}\n\n${USAGE}`;
    }

    const value = match[2] ?? argv[++i];
    if (value === undefined) {
      throw `Flag --${flagName} requires a value\n\n${USAGE}`;
    }
    raw[key] = value;
  }

  const result = cliSchema.safeParse(raw);
  if (!result.success) {
    const messages = result.error.issues.map((i) => `  ${i.message}`).join('\n');
    throw `Invalid arguments:\n${messages}\n\n${USAGE}`;
  }

  return Object.freeze(result.data);
}
