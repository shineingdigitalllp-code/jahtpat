import type { AdminPaymentListItem, AdminPaymentListResponse, PaymentSummary } from '@jhatpat/shared';
import { db } from '@/config/db';
import { env } from '@/config/env';
import { AppError } from '@/utils/app-error';

interface ListPaymentsParams {
  tab?: 'all' | 'online' | 'cod' | 'refund_due';
  status?: string;
  method?: string;
  from?: string;
  to?: string;
  q?: string;
  page?: number;
  pageSize?: number;
}

export async function listPayments(params: ListPaymentsParams): Promise<AdminPaymentListResponse> {
  const page = Math.max(1, params.page || 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize || 20));
  const tab = params.tab || 'all';

  const baseWhere: any = {};

  if (params.q) {
    baseWhere.OR = [
      { code: { contains: params.q } },
      { razorpayPaymentId: { contains: params.q } },
      { razorpayOrderId: { contains: params.q } },
      { user: { name: { contains: params.q } } },
      { user: { mobile: { contains: params.q } } },
    ];
  }

  if (params.status) {
    baseWhere.paymentStatus = params.status;
  }

  if (params.method) {
    baseWhere.paymentMethod = params.method;
  }

  if (params.from || params.to) {
    baseWhere.createdAt = {};
    if (params.from) baseWhere.createdAt.gte = new Date(params.from);
    if (params.to) baseWhere.createdAt.lte = new Date(params.to);
  }

  // Summary aggregation over current base filters
  const [collectedAgg, codPendingAgg, failedAgg, refundedAgg] = await Promise.all([
    db.order.aggregate({
      where: { ...baseWhere, paymentStatus: 'paid' },
      _sum: { totalPaise: true },
    }),
    db.order.aggregate({
      where: {
        ...baseWhere,
        paymentMethod: 'cod',
        paymentStatus: 'pending',
        status: { not: 'cancelled' },
      },
      _sum: { totalPaise: true },
    }),
    db.order.aggregate({
      where: { ...baseWhere, paymentStatus: 'failed' },
      _sum: { totalPaise: true },
    }),
    db.order.aggregate({
      where: { ...baseWhere, refundedPaise: { gt: 0 } },
      _sum: { refundedPaise: true },
    }),
  ]);

  const summary: PaymentSummary = {
    collectedPaise: collectedAgg._sum.totalPaise || 0,
    codPendingPaise: codPendingAgg._sum.totalPaise || 0,
    failedPaise: failedAgg._sum.totalPaise || 0,
    refundedPaise: refundedAgg._sum.refundedPaise || 0,
  };

  // Tab counts
  const [allCount, onlineCount, codCount, refundDueCount] = await Promise.all([
    db.order.count({ where: baseWhere }),
    db.order.count({ where: { ...baseWhere, paymentMethod: { not: 'cod' } } }),
    db.order.count({ where: { ...baseWhere, paymentMethod: 'cod' } }),
    db.order.count({
      where: {
        ...baseWhere,
        status: 'cancelled',
        paymentStatus: 'paid',
      },
    }),
  ]);

  const tabCounts = {
    all: allCount,
    online: onlineCount,
    cod: codCount,
    refundDue: refundDueCount,
  };

  const where: any = { ...baseWhere };
  if (tab === 'online') {
    where.paymentMethod = { not: 'cod' };
  } else if (tab === 'cod') {
    where.paymentMethod = 'cod';
  } else if (tab === 'refund_due') {
    where.status = 'cancelled';
    where.paymentStatus = 'paid';
  }

  const total =
    tab === 'online'
      ? onlineCount
      : tab === 'cod'
        ? codCount
        : tab === 'refund_due'
          ? refundDueCount
          : allCount;

  const orders = await db.order.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    skip: (page - 1) * pageSize,
    take: pageSize,
    include: {
      user: {
        select: {
          name: true,
          mobile: true,
        },
      },
    },
  });

  const items: AdminPaymentListItem[] = orders.map((o) => ({
    id: o.id,
    orderCode: o.code,
    customerName: o.user.name,
    customerMobile: o.user.mobile,
    method: o.paymentMethod,
    amountPaise: o.totalPaise,
    refundedPaise: o.refundedPaise,
    paymentStatus: o.paymentStatus,
    orderStatus: o.status,
    razorpayPaymentId: o.razorpayPaymentId,
    razorpayOrderId: o.razorpayOrderId,
    createdAt: o.createdAt.toISOString(),
  }));

  return {
    items,
    summary,
    meta: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize) || 1,
    },
    tabCounts,
  };
}

export async function markCodPaid(orderCode: string) {
  const order = await db.order.findUnique({ where: { code: orderCode } });
  if (!order) {
    throw new AppError(404, 'ORDER_NOT_FOUND', 'Order not found');
  }

  if (order.paymentMethod !== 'cod') {
    throw new AppError(400, 'INVALID_METHOD', 'Only Cash on Delivery orders can be marked as paid');
  }

  const updated = await db.order.update({
    where: { code: orderCode },
    data: { paymentStatus: 'paid' },
  });

  return updated;
}

export async function refundPayment(orderCode: string, amountPaise?: number) {
  const order = await db.order.findUnique({ where: { code: orderCode } });
  if (!order) {
    throw new AppError(404, 'ORDER_NOT_FOUND', 'Order not found');
  }

  const remaining = order.totalPaise - order.refundedPaise;
  if (remaining <= 0) {
    throw new AppError(400, 'ALREADY_REFUNDED', 'Order has already been fully refunded');
  }

  const refundAmount = amountPaise || remaining;
  if (refundAmount > remaining) {
    throw new AppError(
      400,
      'EXCEEDS_REMAINING',
      `Refund amount (₹${refundAmount / 100}) exceeds remaining balance of ₹${remaining / 100}`,
    );
  }

  // If online payment (not COD or Wallet), process via Razorpay API
  if (order.paymentMethod !== 'cod' && order.paymentMethod !== 'wallet') {
    if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
      throw new AppError(
        503,
        'PAYMENTS_NOT_CONFIGURED',
        'Razorpay API keys are not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in server environment.',
      );
    }

    if (!order.razorpayPaymentId) {
      throw new AppError(400, 'MISSING_PAYMENT_ID', 'Missing Razorpay payment ID for this order');
    }

    const auth = Buffer.from(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`).toString('base64');
    const res = await fetch(`https://api.razorpay.com/v1/payments/${order.razorpayPaymentId}/refund`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ amount: refundAmount }),
    });

    if (!res.ok) {
      const errBody = (await res.json().catch(() => null)) as any;
      throw new AppError(
        502,
        'PAYMENT_GATEWAY_ERROR',
        errBody?.error?.description || 'Gateway failed to process refund',
      );
    }
  }

  const newRefunded = order.refundedPaise + refundAmount;
  const newPaymentStatus = newRefunded >= order.totalPaise ? 'refunded' : order.paymentStatus;

  const updated = await db.order.update({
    where: { code: orderCode },
    data: {
      refundedPaise: newRefunded,
      paymentStatus: newPaymentStatus,
    },
  });

  return updated;
}
