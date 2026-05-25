import { loadEnv } from './config/env';
import { closePool } from './db/pool';

const env = loadEnv();

// Server is wired up in US-104; this file owns the lifecycle only.
async function shutdown(signal: string): Promise<void> {
  console.log(`Received ${signal} — shutting down gracefully`);
  await closePool();
  process.exit(0);
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));

console.log(`Starting on port ${env.port}`);
