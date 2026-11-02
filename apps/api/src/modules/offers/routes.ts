import { Router } from 'express';
import { getOffers } from './service';

export const offersRouter = Router();

offersRouter.get('/offers', async (_req, res) => {
  res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300').json({ data: await getOffers() });
});
