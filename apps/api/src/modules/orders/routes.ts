import { Router, type Request } from 'express';
import { orderListQuerySchema, type OrderTab } from '@jhatpat/shared';
import { requireAuth } from '@/middlewares/auth';
import { validate } from '@/middlewares/validate';
import { listOrders } from './service';

export const ordersRouter = Router();

ordersRouter.get('/orders', requireAuth, validate(orderListQuerySchema, 'query'), async (req: Request, res) => {
  const { tab } = req.query as { tab: OrderTab };
  res.json({ data: await listOrders(req.userId!, tab) });
});
