import type { RequestHandler } from 'express';
import { z } from 'zod';
import { AppError } from '@/utils/app-error';

export const validate =
  (schema: z.ZodType, source: 'body' | 'query' = 'body'): RequestHandler =>
  (req, _res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      throw new AppError(
        422,
        'VALIDATION_ERROR',
        result.error.issues[0]?.message ?? 'Invalid input',
        z.flattenError(result.error).fieldErrors,
      );
    }
    Object.defineProperty(req, source, { value: result.data, writable: true });
    next();
  };
