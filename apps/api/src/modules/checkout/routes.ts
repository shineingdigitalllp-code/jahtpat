import { Router } from 'express';
import { checkoutSchema, placeOrderSchema } from '@jhatpat/shared';
import { optionalAuth, requireAuth } from '@/middlewares/auth';
import { paymentLimiter } from '@/middlewares/rate-limit';
import { validate } from '@/middlewares/validate';
import { getQuote, placeOrder } from './service';

export const checkoutRouter = Router();

checkoutRouter.post('/checkout/quote', optionalAuth, validate(checkoutSchema), async (req, res) => {
  res.json({ data: await getQuote(req.userId, req.body) });
});

checkoutRouter.post('/orders', paymentLimiter, requireAuth, validate(placeOrderSchema), async (req, res) => {
  res.status(201).json({ data: await placeOrder(req.userId!, req.body) });
});
