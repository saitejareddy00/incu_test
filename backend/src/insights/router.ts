import { NextFunction, Request, Response, Router } from 'express';
import { z, ZodError } from 'zod';
import { ValidationError } from '../app/errors';
import { InsightsService } from './service';

const CountryParamSchema = z.object({
  country: z
    .string()
    .length(2, 'Must be a 2-letter ISO-3166 alpha-2 code')
    .regex(/^[A-Za-z]{2}$/, 'Must contain only letters'),
});

const JobTitlesQuerySchema = z.object({
  country: z
    .string()
    .length(2, 'Must be a 2-letter ISO-3166 alpha-2 code')
    .regex(/^[A-Za-z]{2}$/, 'Must contain only letters')
    .optional(),
});

function toValidationError(err: ZodError): ValidationError {
  const msg = err.errors.map((e) => `${e.path.join('.') || 'param'}: ${e.message}`).join('; ');
  return new ValidationError(msg);
}

export function createInsightsRouter(service: InsightsService): Router {
  const router = Router();

  // ── GET /api/insights/overview ──────────────────────────────────────────────
  router.get('/overview', async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const metrics = await service.overview();
      res.json(metrics);
    } catch (err) {
      next(err);
    }
  });

  // ── GET /api/insights/job-titles ───────────────────────────────────────────
  router.get('/job-titles', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = JobTitlesQuerySchema.parse(req.query);
      const titles = await service.jobTitles(query.country?.toUpperCase());
      res.json({ jobTitles: titles });
    } catch (err) {
      next(err instanceof ZodError ? toValidationError(err) : err);
    }
  });

  // ── GET /api/insights/country/:country ──────────────────────────────────────
  router.get('/country/:country', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { country } = CountryParamSchema.parse(req.params);
      const stats = await service.countryStats(country.toUpperCase());
      res.json(stats);
    } catch (err) {
      next(err instanceof ZodError ? toValidationError(err) : err);
    }
  });

  // ── GET /api/insights/country/:country/job-title/:jobTitle ──────────────────
  router.get(
    '/country/:country/job-title/:jobTitle',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { country } = CountryParamSchema.parse(req.params);
        const stats = await service.countryJobStats(
          country.toUpperCase(),
          req.params.jobTitle,
        );
        res.json(stats);
      } catch (err) {
        next(err instanceof ZodError ? toValidationError(err) : err);
      }
    },
  );

  return router;
}
