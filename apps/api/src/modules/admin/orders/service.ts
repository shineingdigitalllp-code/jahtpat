import {
  ORDER_TRANSITIONS,
  type OrderDeliveryUpdateInput,
  type OrderDetailResponse,
  type OrderListResponse,
  type OrderNoteUpdateInput,
  type OrderStatusUpdateInput,
  type OrderTimelineStep,
} from '@jhatpat/shared';
import { db } from '@/config/db';
import { AppError } from '@/utils/app-error';
import { audit } from '@/utils/audit';
import { formatDateIST, formatTimeIST } from '@/utils/ist';
import { clearDashboardCache } from '../dashboard/service';

export interface OrderQueryFilters {
  status?: string;
  paymentStatus?: string;
  method?: string;
  from?: string;
  to?: string;
  q?: string;
  page?: string | number;
  pageSize?: string | number;
}

export async function listOrders(filters: OrderQueryFilters): Promise<OrderListResponse> {
  const page = Math.max(1, Number(filters.page || 1));
  const pageSize = Math.min(100, Math.max(1, Number(filters.pageSize || 20)));
  const skip = (page - 1) * pageSize;

  const baseWhere: any = {};

  if (filters.status && filters.status !== 'all') {
    if (filters.status === 'active') {
      baseWhere.status = { in: ['placed', 'preparing', 'out_for_delivery'] };
    } else {
      baseWhere.status = filters.status;
    }
  }

  if (filters.paymentStatus && filters.paymentStatus !== 'all') {
    baseWhere.paymentStatus = filters.paymentStatus;
  }

  if (filters.method && filters.method !== 'all') {
    baseWhere.paymentMethod = filters.method;
  }

  if (filters.from || filters.to) {
    baseWhere.createdAt = {};
    if (filters.from) baseWhere.createdAt.gte = new Date(filters.from);
    if (filters.to) baseWhere.createdAt.lte = new Date(filters.to);
  }

  if (filters.q && filters.q.trim()) {
    const q = filters.q.trim();
    baseWhere.OR = [
      { code: { contains: q } },
      { user: { name: { contains: q } } },
      { user: { mobile: { contains: q } } },
    ];
  }

  // Calculate per-status counts matching non-status filters
  const statusWhere = { ...baseWhere };
  delete statusWhere.status;

  const [total, orders, rawStatusCounts] = await Promise.all([
    db.order.count({ where: baseWhere }),
    db.order.findMany({
      where: baseWhere,
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true, mobile: true } },
        _count: { select: { items: true } },
      },
    }),
    db.order.groupBy({
      by: ['status'],
      where: statusWhere,
      _count: true,
    }),
  ]);

  const statusCounts: Record<string, number> = {
    all: 0,
    placed: 0,
    preparing: 0,
    out_for_delivery: 0,
    delivered: 0,
    cancelled: 0,
  };

  let allCount = 0;
  for (const s of rawStatusCounts) {
    statusCounts[s.status] = s._count;
    allCount += s._count;
  }
  statusCounts.all = allCount;

  const items = orders.map((o) => ({
    id: o.id,
    code: o.code,
    customerName: o.user.name,
    customerMobile: o.user.mobile,
    itemCount: o._count.items,
    totalPaise: o.totalPaise,
    paymentMethod: o.paymentMethod,
    paymentStatus: o.paymentStatus,
    status: o.status,
    createdAt: o.createdAt.toISOString(),
  }));

  return {
    items,
    meta: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize) || 1,
    },
    statusCounts,
  };
}

export async function exportOrdersCsv(filters: OrderQueryFilters): Promise<string> {
  const baseWhere: any = {};

  if (filters.status && filters.status !== 'all') {
    if (filters.status === 'active') {
      baseWhere.status = { in: ['placed', 'preparing', 'out_for_delivery'] };
    } else {
      baseWhere.status = filters.status;
    }
  }

  if (filters.paymentStatus && filters.paymentStatus !== 'all') {
    baseWhere.paymentStatus = filters.paymentStatus;
  }

  if (filters.method && filters.method !== 'all') {
    baseWhere.paymentMethod = filters.method;
  }

  if (filters.from || filters.to) {
    baseWhere.createdAt = {};
    if (filters.from) baseWhere.createdAt.gte = new Date(filters.from);
    if (filters.to) baseWhere.createdAt.lte = new Date(filters.to);
  }

  if (filters.q && filters.q.trim()) {
    const q = filters.q.trim();
    baseWhere.OR = [
      { code: { contains: q } },
      { user: { name: { contains: q } } },
      { user: { mobile: { contains: q } } },
    ];
  }

  const orders = await db.order.findMany({
    where: baseWhere,
    orderBy: { createdAt: 'desc' },
    take: 5000,
    include: {
      user: { select: { name: true, mobile: true } },
      _count: { select: { items: true } },
    },
  });

  const headers = [
    'Order Code',
    'Customer Name',
    'Mobile',
    'Items',
    'Total (INR)',
    'Payment Method',
    'Payment Status',
    'Status',
    'Placed At (IST)',
  ];

  const rows = orders.map((o) => {
    const totalRupees = (o.totalPaise / 100).toFixed(2);
    const placedIST = `${formatDateIST(o.createdAt)} ${formatTimeIST(o.createdAt)}`;
    return [
      `"${o.code}"`,
      `"${o.user.name.replace(/"/g, '""')}"`,
      `"${o.user.mobile}"`,
      o._count.items,
      totalRupees,
      `"${o.paymentMethod.toUpperCase()}"`,
      `"${o.paymentStatus.toUpperCase()}"`,
      `"${o.status.toUpperCase()}"`,
      `"${placedIST}"`,
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\r\n');
}

export async function getOrderDetail(code: string): Promise<OrderDetailResponse> {
  const order = await db.order.findUnique({
    where: { code },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          mobile: true,
          email: true,
        },
      },
      address: true,
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              unit: true,
              mrpPaise: true,
              images: {
                select: { url: true },
                orderBy: { sortOrder: 'asc' },
                take: 1,
              },
            },
          },
        },
      },
    },
  });

  if (!order) {
    throw new AppError(404, 'NOT_FOUND', 'Order not found');
  }

  const [totalOrdersCount, rawLogs] = await Promise.all([
    db.order.count({ where: { userId: order.userId } }),
    db.activityLog.findMany({
      where: {
        entity: 'order',
        entityId: code,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        admin: { select: { name: true } },
      },
      take: 20,
    }),
  ]);

  // Compute timeline steps with elapsed minutes
  const timeline: OrderTimelineStep[] = [];

  const createdTime = order.createdAt.getTime();
  timeline.push({
    key: 'placed',
    label: 'Order Placed',
    time: order.createdAt.toISOString(),
    elapsedMinutes: null,
    completed: true,
    current: order.status === 'placed',
  });

  if (order.status === 'cancelled') {
    const cancelTime = order.cancelledAt ? order.cancelledAt.getTime() : createdTime;
    const elapsedFromStart = Math.max(0, Math.round((cancelTime - createdTime) / 60000));
    timeline.push({
      key: 'cancelled',
      label: `Cancelled: ${order.cancelReason || 'Admin cancelled'}`,
      time: order.cancelledAt?.toISOString() || null,
      elapsedMinutes: elapsedFromStart,
      completed: true,
      current: true,
    });
  } else {
    // Preparing step
    const prepTime = order.preparingAt ? order.preparingAt.getTime() : null;
    const elapsedPrep = prepTime ? Math.max(0, Math.round((prepTime - createdTime) / 60000)) : null;
    timeline.push({
      key: 'preparing',
      label: 'Preparing Order',
      time: order.preparingAt?.toISOString() || null,
      elapsedMinutes: elapsedPrep,
      completed: !!order.preparingAt || ['out_for_delivery', 'delivered'].includes(order.status),
      current: order.status === 'preparing',
    });

    // Out for delivery step
    const outTime = order.outForDeliveryAt ? order.outForDeliveryAt.getTime() : null;
    const elapsedOut = outTime && prepTime ? Math.max(0, Math.round((outTime - prepTime) / 60000)) : null;
    timeline.push({
      key: 'out_for_delivery',
      label: 'Out for Delivery',
      time: order.outForDeliveryAt?.toISOString() || null,
      elapsedMinutes: elapsedOut,
      completed: !!order.outForDeliveryAt || order.status === 'delivered',
      current: order.status === 'out_for_delivery',
    });

    // Delivered step
    const delTime = order.deliveredAt ? order.deliveredAt.getTime() : null;
    const elapsedDel = delTime && outTime ? Math.max(0, Math.round((delTime - outTime) / 60000)) : null;
    timeline.push({
      key: 'delivered',
      label: 'Order Delivered',
      time: order.deliveredAt?.toISOString() || null,
      elapsedMinutes: elapsedDel,
      completed: order.status === 'delivered',
      current: order.status === 'delivered',
    });
  }

  const items = order.items.map((item) => ({
    id: `${item.orderId}-${item.productId}`,
    productId: item.productId,
    name: item.product.name,
    unit: item.product.unit,
    image: item.product.images[0]?.url ?? null,
    qty: item.qty,
    pricePaise: item.pricePaise,
    mrpPaise: item.product.mrpPaise || item.pricePaise,
    lineTotalPaise: item.qty * item.pricePaise,
  }));

  const activities = rawLogs.map((log) => ({
    id: log.id,
    action: log.action,
    adminName: log.admin.name,
    meta: log.meta,
    createdAt: log.createdAt.toISOString(),
  }));

  return {
    id: order.id,
    code: order.code,
    status: order.status,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    subtotalPaise: order.subtotalPaise,
    discountPaise: order.discountPaise,
    couponCode: order.couponCode,
    couponPaise: order.couponPaise,
    deliveryPaise: order.deliveryPaise,
    totalPaise: order.totalPaise,
    refundedPaise: order.refundedPaise,
    razorpayOrderId: order.razorpayOrderId,
    razorpayPaymentId: order.razorpayPaymentId,
    cancelledAt: order.cancelledAt?.toISOString() || null,
    cancelReason: order.cancelReason,
    adminNote: order.adminNote,
    createdAt: order.createdAt.toISOString(),
    preparingAt: order.preparingAt?.toISOString() || null,
    outForDeliveryAt: order.outForDeliveryAt?.toISOString() || null,
    deliveredAt: order.deliveredAt?.toISOString() || null,
    riderName: order.riderName,
    riderPhone: order.riderPhone,
    etaAt: order.etaAt?.toISOString() || null,
    user: {
      ...order.user,
      totalOrdersCount,
    },
    address: {
      id: order.address.id,
      label: order.address.label,
      line1: order.address.line1,
      line2: order.address.line2,
      city: order.address.city,
      state: order.address.state,
      pincode: order.address.pincode,
    },
    items,
    timeline,
    activities,
  };
}

export async function updateOrderDelivery(
  code: string,
  input: OrderDeliveryUpdateInput,
  adminId: string,
  ip?: string,
) {
  const order = await db.order.findUnique({
    where: { code },
    select: { id: true, code: true, riderName: true, riderPhone: true, etaAt: true },
  });

  if (!order) {
    throw new AppError(404, 'NOT_FOUND', 'Order not found');
  }

  const updated = await db.order.update({
    where: { code },
    data: {
      riderName: input.riderName,
      riderPhone: input.riderPhone,
      etaAt: input.etaAt ? new Date(input.etaAt) : undefined,
    },
  });

  await audit(
    adminId,
    'update_delivery',
    'order',
    code,
    { riderName: input.riderName, riderPhone: input.riderPhone, etaAt: input.etaAt },
    ip,
  );

  return updated;
}

export async function updateOrderNote(
  code: string,
  input: OrderNoteUpdateInput,
  adminId: string,
  ip?: string,
) {
  const order = await db.order.findUnique({
    where: { code },
    select: { id: true },
  });

  if (!order) {
    throw new AppError(404, 'NOT_FOUND', 'Order not found');
  }

  const updated = await db.order.update({
    where: { code },
    data: {
      adminNote: input.note.trim() || null,
    },
  });

  await audit(adminId, 'update_note', 'order', code, { note: input.note }, ip);

  return updated;
}

export async function updateOrderStatus(
  code: string,
  input: OrderStatusUpdateInput,
  adminId: string,
  ip?: string,
) {
  const order = await db.order.findUnique({
    where: { code },
    include: { items: true },
  });

  if (!order) {
    throw new AppError(404, 'NOT_FOUND', 'Order not found');
  }

  const currentStatus = order.status;
  const targetStatus = input.status as any;

  if (currentStatus === 'delivered' || currentStatus === 'cancelled') {
    throw new AppError(400, 'INVALID_TRANSITION', 'Order is in a terminal status and cannot be changed');
  }

  const allowedNext = ORDER_TRANSITIONS[currentStatus] || [];
  if (!allowedNext.includes(targetStatus)) {
    throw new AppError(
      400,
      'INVALID_TRANSITION',
      `Transition from "${currentStatus}" to "${targetStatus}" is not allowed`,
    );
  }

  if (targetStatus === 'out_for_delivery') {
    const riderName = input.riderName || order.riderName;
    const riderPhone = input.riderPhone || order.riderPhone;
    if (!riderName || !riderPhone) {
      throw new AppError(400, 'RIDER_REQUIRED', 'Rider name and phone are required for delivery dispatch');
    }
  }

  if (targetStatus === 'cancelled' && !input.reason) {
    throw new AppError(400, 'REASON_REQUIRED', 'Cancellation reason is required');
  }

  const storeSetting = await db.storeSetting.findUnique({
    where: { id: 1 },
    select: { etaMinutes: true },
  });
  const etaMinutes = storeSetting?.etaMinutes ?? 10;

  const updatedOrder = await db.$transaction(async (tx) => {
    const updateData: any = {
      status: targetStatus,
    };

    if (targetStatus === 'preparing') {
      updateData.preparingAt = new Date();
    } else if (targetStatus === 'out_for_delivery') {
      updateData.outForDeliveryAt = new Date();
      if (input.riderName) updateData.riderName = input.riderName;
      if (input.riderPhone) updateData.riderPhone = input.riderPhone;
      if (!order.etaAt) {
        updateData.etaAt = new Date(Date.now() + etaMinutes * 60 * 1000);
      }
    } else if (targetStatus === 'delivered') {
      updateData.deliveredAt = new Date();
      if (order.paymentMethod === 'cod') {
        updateData.paymentStatus = 'paid';
      }
    } else if (targetStatus === 'cancelled') {
      updateData.cancelledAt = new Date();
      updateData.cancelReason = input.reason || 'Cancelled by admin';

      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.qty } },
        });
      }
    }

    const countResult = await tx.order.updateMany({
      where: {
        code,
        status: currentStatus,
      },
      data: updateData,
    });

    if (countResult.count === 0) {
      throw new AppError(409, 'CONFLICT', 'Order was updated by someone else, please refresh');
    }

    return tx.order.findUnique({
      where: { code },
      include: {
        user: { select: { name: true, mobile: true } },
        items: true,
      },
    });
  });

  await audit(
    adminId,
    'status_change',
    'order',
    order.code,
    { from: currentStatus, to: targetStatus, reason: input.reason },
    ip,
  );

  clearDashboardCache();

  return updatedOrder;
}
