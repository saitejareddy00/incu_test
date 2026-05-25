import { NextFunction, Request, Response, Router } from 'express';
import { z, ZodError } from 'zod';
import { ValidationError } from '../app/errors';
import { SORT_COLUMN_FROM_CAMEL, SORT_COLUMNS, toSortColumn } from './repository/index';
import { CreateEmployeeInputSchema, UpdateEmployeeInputSchema } from './schemas';
import { EmployeeService } from './service';

const ListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
  country: z.string().optional(),
  jobTitle: z.string().optional(),
  q: z.string().optional(),
  sortBy: z
    .string()
    .optional()
    .transform((val, ctx) => {
      if (val === undefined) return undefined;
      const col = toSortColumn(val);
      if (!col) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Invalid enum value. Expected ${[...Object.keys(SORT_COLUMN_FROM_CAMEL), ...SORT_COLUMNS].join(' | ')}, received '${val}'`,
        });
        return z.NEVER;
      }
      return col;
    }),
  sortDir: z.enum(['asc', 'desc']).optional(),
});

function toValidationError(err: ZodError): ValidationError {
  const msg = err.errors.map((e) => `${e.path.join('.') || 'body'}: ${e.message}`).join('; ');
  return new ValidationError(msg);
}

export function createEmployeeRouter(service: EmployeeService): Router {
  const router = Router();

  // ── GET /api/employees ──────────────────────────────────────────────────────
  router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = ListQuerySchema.parse(req.query);
      const result = await service.list(query);
      res.json({
        data: result.data,
        total: result.total,
        page: query.page ?? 1,
        pageSize: query.pageSize ?? 20,
      });
    } catch (err) {
      next(err instanceof ZodError ? toValidationError(err) : err);
    }
  });

  // ── POST /api/employees ─────────────────────────────────────────────────────
  router.post('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const input = CreateEmployeeInputSchema.parse(req.body);
      const employee = await service.create(input);
      res.status(201).json(employee);
    } catch (err) {
      next(err instanceof ZodError ? toValidationError(err) : err);
    }
  });

  // ── GET /api/employees/:id ──────────────────────────────────────────────────
  router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const employee = await service.getById(req.params.id);
      res.json(employee);
    } catch (err) {
      next(err);
    }
  });

  // ── PATCH /api/employees/:id ────────────────────────────────────────────────
  router.patch('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const patch = UpdateEmployeeInputSchema.parse(req.body);
      const employee = await service.update(req.params.id, patch);
      res.json(employee);
    } catch (err) {
      next(err instanceof ZodError ? toValidationError(err) : err);
    }
  });

  // ── DELETE /api/employees/:id ───────────────────────────────────────────────
  router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
      await service.delete(req.params.id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  });

  return router;
}
