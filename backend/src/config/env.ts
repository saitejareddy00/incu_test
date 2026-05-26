import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string({ required_error: 'DATABASE_URL is required' }).url(),
  /** Required for tests; optional in production (falls back to DATABASE_URL). */
  TEST_DATABASE_URL: z.string().url().optional(),
  PORT: z.coerce.number().int().positive().default(3000),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),
  /** Comma-separated allowed browser origins for CORS (e.g. https://my-app.netlify.app). */
  CORS_ORIGIN: z.string().optional(),
});

export interface AppConfig {
  databaseUrl: string;
  testDatabaseUrl: string;
  port: number;
  logLevel: string;
  corsOrigins: string[];
}

export function loadEnv(): AppConfig {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const messages = result.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${messages}`);
  }

  const corsOrigins =
    result.data.CORS_ORIGIN?.split(',')
      .map((s) => s.trim())
      .filter(Boolean) ?? [];

  return {
    databaseUrl: result.data.DATABASE_URL,
    testDatabaseUrl: result.data.TEST_DATABASE_URL ?? result.data.DATABASE_URL,
    port: result.data.PORT,
    logLevel: result.data.LOG_LEVEL,
    corsOrigins,
  };
}
