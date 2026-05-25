import pg from 'pg';
import express, { Request, Response, NextFunction } from 'express';
import pinoHttp from 'pino-http';
import { AppError, NotFoundError } from './errors';
import { createEmployeeRouter } from '../employees/router';
import { EmployeeService } from '../employees/service';
import { createInsightsRouter } from '../insights/router';
import { InsightsService } from '../insights/service';

export function createApp(pool?: pg.Pool) {
  const app = express();

  app.use(express.json());
  app.use(pinoHttp({ quietReqLogger: true }));

  // ── Health ────────────────────────────────────────────────────────────────
  app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // ── Employee routes ───────────────────────────────────────────────────────
  if (pool) {
    app.use('/api/employees', createEmployeeRouter(new EmployeeService(pool)));
    app.use('/api/insights', createInsightsRouter(new InsightsService(pool)));
  }

  // ── Test-only error trigger (stripped in production build) ────────────────
  if (process.env.NODE_ENV !== 'production') {
    app.get('/error-test', () => {
      throw new Error('intentional test error');
    });
  }

  // ── 404 catch-all ─────────────────────────────────────────────────────────
  app.use((_req: Request, _res: Response, next: NextFunction) => {
    next(new NotFoundError());
  });

  // ── Global error handler ──────────────────────────────────────────────────
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({
        error: { code: err.code, message: err.message },
      });
      return;
    }

    const message = err instanceof Error ? err.message : 'Internal server error';
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message },
    });
  });

  return app;
}
