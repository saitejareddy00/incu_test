import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    passWithNoTests: true,
    // Run test files serially so committed rows from service tests (no
    // BEGIN/ROLLBACK) don't race against repository tests using withTestDb.
    fileParallelism: false,
    globalSetup: 'src/test/setup.ts',
    include: ['src/**/*.test.ts', 'src/**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/**/*.spec.ts', 'src/test/**/*'],
    },
  },
});
