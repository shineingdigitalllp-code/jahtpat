import { Router } from 'express';
import { verifyPaymentSchema } from '@jhatpat/shared';
import { requireAuth } from '@/middlewares/auth';
import { paymentLimiter } from '@/middlewares/rate-limit';
import { validate } from '@/middlewares/validate';
import { verifyRazorpayPayment } from './service';

export const paymentsRouter = Router();

paymentsRouter.post('/payments/razorpay/verify', paymentLimiter, requireAuth, validate(verifyPaymentSchema), async (req, res) => {
  res.json({ data: await verifyRazorpayPayment(req.userId!, req.body) });
});
