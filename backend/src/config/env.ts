import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string({ required_error: 'DATABASE_URL is required' }).url(),
  TEST_DATABASE_URL: z.string({ required_error: 'TEST_DATABASE_URL is required' }).url(),
  PORT: z.coerce.number().int().positive().default(3000),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),
});

export interface AppConfig {
  databaseUrl: string;
  testDatabaseUrl: string;
  port: number;
  logLevel: string;
}

export function loadEnv(): AppConfig {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const messages = result.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${messages}`);
  }

  return {
    databaseUrl: result.data.DATABASE_URL,
    testDatabaseUrl: result.data.TEST_DATABASE_URL,
    port: result.data.PORT,
    logLevel: result.data.LOG_LEVEL,
  };
}
