import dotenv from 'dotenv';
dotenv.config();

import { loadEnv } from './config/env';
import { closePool } from './db/pool';
import { createApp } from './app/app';

const env = loadEnv();
const app = createApp();

const server = app.listen(env.port, () => {
  console.log(`Server listening on port ${env.port}`);
});

function shutdown(signal: string): void {
  console.log(`Received ${signal} — shutting down gracefully`);
  server.close(() => {
    closePool()
      .then(() => process.exit(0))
      .catch(() => process.exit(1));
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
