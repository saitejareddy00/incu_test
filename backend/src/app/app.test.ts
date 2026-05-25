import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from './app';

describe('Express app', () => {
  const app = createApp();

  describe('GET /health', () => {
    it('returns 200 with status ok and a timestamp', async () => {
      const res = await request(app).get('/health');

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ status: 'ok' });
      expect(typeof res.body.timestamp).toBe('string');
      expect(new Date(res.body.timestamp as string).toISOString()).toBe(
        res.body.timestamp,
      );
    });
  });

  describe('global error handler', () => {
    it('returns 500 with structured error body for unhandled errors', async () => {
      // /error-test is a route that deliberately throws — only used in tests
      const res = await request(app).get('/error-test');

      expect(res.status).toBe(500);
      expect(res.body).toMatchObject({
        error: {
          code: expect.any(String) as string,
          message: expect.any(String) as string,
        },
      });
    });

    it('returns 404 with structured error body for unknown routes', async () => {
      const res = await request(app).get('/does-not-exist');

      expect(res.status).toBe(404);
      expect(res.body).toMatchObject({
        error: { code: 'NOT_FOUND' },
      });
    });
  });
});
