import { Router } from 'express';
import { reverseGeocodeSchema, type ReverseGeocodeInput } from '@jhatpat/shared';
import { requireAuth } from '@/middlewares/auth';
import { geoLimiter } from '@/middlewares/rate-limit';
import { validate } from '@/middlewares/validate';
import { reverseGeocode } from './service';

export const geoRouter = Router();

geoRouter.get('/geo/reverse', geoLimiter, requireAuth, validate(reverseGeocodeSchema, 'query'), async (req, res) => {
  res.json({ data: await reverseGeocode(req.query as unknown as ReverseGeocodeInput) });
});
