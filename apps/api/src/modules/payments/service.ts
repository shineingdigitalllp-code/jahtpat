import { createHmac, timingSafeEqual } from 'node:crypto';
import type { VerifyPaymentInput } from '@jhatpat/shared';
import { db } from '@/config/db';
import { env } from '@/config/env';
import { AppError } from '@/utils/app-error';

const RAZORPAY_API = 'https://api.razorpay.com/v1';

const razorpayKeys = () => {
  if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
    throw new AppError(503, 'PAYMENTS_UNAVAILABLE', 'Online payment is unavailable right now. Choose Cash on Delivery.');
  }
  return { keyId: env.RAZORPAY_KEY_ID, keySecret: env.RAZORPAY_KEY_SECRET };
};

export function assertOnlinePaymentsEnabled() {
  razorpayKeys();
}

export async function createRazorpayOrder(amountPaise: number, receipt: string) {
  const { keyId, keySecret } = razorpayKeys();
  const res = await fetch(`${RAZORPAY_API}/orders`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ amount: amountPaise, currency: 'INR', receipt }),
  });
  if (!res.ok) throw new AppError(502, 'PAYMENT_GATEWAY_ERROR', 'Could not start payment. Please try again.');
  const order = (await res.json()) as { id: string };
  return { keyId, orderId: order.id, amountPaise };
}

export async function verifyRazorpayPayment(userId: string, input: VerifyPaymentInput) {
  const { keySecret } = razorpayKeys();
  const order = await db.order.findFirst({
    where: { id: input.orderId, userId },
    select: { id: true, code: true, razorpayOrderId: true, paymentStatus: true },
  });
  if (!order?.razorpayOrderId) throw new AppError(404, 'ORDER_NOT_FOUND', 'Order not found');
  if (order.paymentStatus === 'paid') return { id: order.id, code: order.code };

  const expected = createHmac('sha256', keySecret).update(`${order.razorpayOrderId}|${input.razorpayPaymentId}`).digest();
  const received = Buffer.from(input.razorpaySignature, 'hex');
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) {
    await db.order.update({ where: { id: order.id }, data: { paymentStatus: 'failed' } });
    throw new AppError(400, 'PAYMENT_VERIFICATION_FAILED', 'Payment could not be verified');
  }

  await db.order.update({ where: { id: order.id }, data: { paymentStatus: 'paid', status: 'placed' } });
  return { id: order.id, code: order.code };
}
