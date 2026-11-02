import type { DashboardResponse, RangeKey } from '@jhatpat/shared';
import { db } from '@/config/db';
import { daysAgoIST, startOfDayIST } from '@/utils/ist';

const CACHE_TTL_MS = 15 * 1000;
const dashboardCache = new Map<RangeKey, { timestamp: number; data: DashboardResponse }>();

export function clearDashboardCache() {
  dashboardCache.clear();
}

function computeDelta(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

export async function getDashboardData(rangeKey: RangeKey = 'today'): Promise<DashboardResponse> {
  const cached = dashboardCache.get(rangeKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  const now = new Date();
  let fromDate: Date;
  let toDate: Date = now;
  let prevFromDate: Date;
  let prevToDate: Date;
  let bucket: 'hour' | 'day' = 'day';

  if (rangeKey === 'today') {
    bucket = 'hour';
    fromDate = startOfDayIST();
    toDate = now;
    prevFromDate = daysAgoIST(1);
    prevToDate = new Date(fromDate.getTime() - 1);
  } else if (rangeKey === '7d') {
    bucket = 'day';
    fromDate = daysAgoIST(6);
    prevFromDate = daysAgoIST(13);
    prevToDate = new Date(fromDate.getTime() - 1);
  } else if (rangeKey === '30d') {
    bucket = 'day';
    fromDate = daysAgoIST(29);
    prevFromDate = daysAgoIST(59);
    prevToDate = new Date(fromDate.getTime() - 1);
  } else {
    // 90d
    bucket = 'day';
    fromDate = daysAgoIST(89);
    prevFromDate = daysAgoIST(179);
    prevToDate = new Date(fromDate.getTime() - 1);
  }

  const validCondition = {
    status: { notIn: ['cancelled', 'pending_payment'] as any },
    paymentStatus: { not: 'failed' as any },
  };

  const storeSetting = await db.storeSetting.findUnique({
    where: { id: 1 },
    select: { lowStockThreshold: true },
  });
  const lowStockThreshold = storeSetting?.lowStockThreshold ?? 10;

  // Run database queries in parallel
  const [
    currValidOrders,
    prevValidOrders,
    currNewUsers,
    prevNewUsers,
    currAllOrders,
    activeOrdersCount,
    lowStockCount,
    queueOrders,
    lowStockProducts,
    recentOrders,
    avgDeliveryResult,
  ] = await Promise.all([
    // Current period valid orders
    db.order.findMany({
      where: {
        ...validCondition,
        createdAt: { gte: fromDate, lte: toDate },
      },
      select: {
        id: true,
        totalPaise: true,
        createdAt: true,
        paymentMethod: true,
      },
    }),
    // Previous period valid orders
    db.order.findMany({
      where: {
        ...validCondition,
        createdAt: { gte: prevFromDate, lte: prevToDate },
      },
      select: {
        totalPaise: true,
      },
    }),
    // Current period new users
    db.user.count({
      where: { createdAt: { gte: fromDate, lte: toDate } },
    }),
    // Previous period new users
    db.user.count({
      where: { createdAt: { gte: prevFromDate, lte: prevToDate } },
    }),
    // Current period all orders for cancellation rate & status counts
    db.order.findMany({
      where: { createdAt: { gte: fromDate, lte: toDate } },
      select: { status: true },
    }),
    // Active orders (placed, preparing, out_for_delivery)
    db.order.count({
      where: { status: { in: ['placed', 'preparing', 'out_for_delivery'] } },
    }),
    // Low stock count
    db.product.count({
      where: { isActive: true, stock: { lte: lowStockThreshold } },
    }),
    // Needs attention queue (placed orders, oldest first, limit 8)
    db.order.findMany({
      where: { status: 'placed' },
      orderBy: { createdAt: 'asc' },
      take: 8,
      include: {
        user: { select: { name: true } },
        _count: { select: { items: true } },
      },
    }),
    // Low stock products list (limit 6)
    db.product.findMany({
      where: { isActive: true, stock: { lte: lowStockThreshold } },
      orderBy: { stock: 'asc' },
      take: 6,
      select: {
        id: true,
        name: true,
        unit: true,
        stock: true,
        images: {
          select: { url: true },
          orderBy: { sortOrder: 'asc' },
          take: 1,
        },
      },
    }),
    // Recent orders (limit 8)
    db.order.findMany({
      orderBy: { createdAt: 'desc' },
      take: 8,
      include: {
        user: { select: { name: true } },
        _count: { select: { items: true } },
      },
    }),
    // Average delivery time in minutes for delivered orders in range
    db.$queryRaw<Array<{ avgMinutes: number | null }>>`
      SELECT AVG(TIMESTAMPDIFF(MINUTE, createdAt, deliveredAt)) as avgMinutes
      FROM \`Order\`
      WHERE status = 'delivered'
        AND deliveredAt IS NOT NULL
        AND createdAt >= ${fromDate}
        AND createdAt <= ${toDate}
    `,
  ]);

  // Compute Current KPIs
  const currRevenuePaise = currValidOrders.reduce((sum, o) => sum + o.totalPaise, 0);
  const currOrdersCount = currValidOrders.length;
  const currAovPaise = currOrdersCount > 0 ? Math.round(currRevenuePaise / currOrdersCount) : 0;

  // Compute Previous KPIs
  const prevRevenuePaise = prevValidOrders.reduce((sum, o) => sum + o.totalPaise, 0);
  const prevOrdersCount = prevValidOrders.length;
  const prevAovPaise = prevOrdersCount > 0 ? Math.round(prevRevenuePaise / prevOrdersCount) : 0;

  // Compute Cancellation Rate
  let cancelledCount = 0;
  const statusCounts: Record<string, number> = {
    pending_payment: 0,
    placed: 0,
    preparing: 0,
    out_for_delivery: 0,
    delivered: 0,
    cancelled: 0,
  };

  for (const o of currAllOrders) {
    statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
    if (o.status === 'cancelled') cancelledCount++;
  }

  const validAndCancelled = currOrdersCount + cancelledCount;
  const cancellationRate =
    validAndCancelled > 0 ? Math.round((cancelledCount / validAndCancelled) * 1000) / 10 : 0;

  // Build Zero-Filled Continuous Time Series
  const seriesMap = new Map<string, { revenuePaise: number; orders: number }>();

  if (bucket === 'hour') {
    for (let h = 0; h < 24; h++) {
      const label = `${String(h).padStart(2, '0')}:00`;
      seriesMap.set(label, { revenuePaise: 0, orders: 0 });
    }
    for (const order of currValidOrders) {
      // Order created in UTC -> convert to IST (+330 min)
      const istTime = new Date(order.createdAt.getTime() + 330 * 60 * 1000);
      const hour = istTime.getUTCHours();
      const label = `${String(hour).padStart(2, '0')}:00`;
      const current = seriesMap.get(label);
      if (current) {
        current.revenuePaise += order.totalPaise;
        current.orders += 1;
      }
    }
  } else {
    // Daily buckets
    const days = rangeKey === '7d' ? 7 : rangeKey === '30d' ? 30 : 90;
    for (let i = days - 1; i >= 0; i--) {
      const d = daysAgoIST(i);
      const istTime = new Date(d.getTime() + 330 * 60 * 1000);
      const label = istTime.toISOString().slice(0, 10);
      seriesMap.set(label, { revenuePaise: 0, orders: 0 });
    }
    for (const order of currValidOrders) {
      const istTime = new Date(order.createdAt.getTime() + 330 * 60 * 1000);
      const label = istTime.toISOString().slice(0, 10);
      const current = seriesMap.get(label);
      if (current) {
        current.revenuePaise += order.totalPaise;
        current.orders += 1;
      }
    }
  }

  const series = Array.from(seriesMap.entries()).map(([t, val]) => ({
    t,
    revenuePaise: val.revenuePaise,
    orders: val.orders,
  }));

  // Top Products in Range
  const validOrderIds = currValidOrders.map((o) => o.id);
  let topProducts: Array<{
    id: number;
    name: string;
    image: string | null;
    units: number;
    revenuePaise: number;
  }> = [];

  if (validOrderIds.length > 0) {
    const rawTop = await db.orderItem.groupBy({
      by: ['productId'],
      where: { orderId: { in: validOrderIds } },
      _sum: {
        qty: true,
        pricePaise: true,
      },
      orderBy: {
        _sum: {
          qty: 'desc',
        },
      },
      take: 5,
    });

    const productIds = rawTop.map((item) => item.productId);
    const productsInfo = await db.product.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        name: true,
        images: {
          select: { url: true },
          orderBy: { sortOrder: 'asc' },
          take: 1,
        },
      },
    });
    const infoMap = new Map(productsInfo.map((p) => [p.id, p]));

    topProducts = rawTop.map((item) => {
      const prod = infoMap.get(item.productId);
      const units = item._sum.qty ?? 0;
      const unitPrice = item._sum.pricePaise ?? 0;
      return {
        id: item.productId,
        name: prod?.name ?? 'Unknown',
        image: prod?.images[0]?.url ?? null,
        units,
        revenuePaise: units * unitPrice,
      };
    });
  }

  // Payment Split
  const paymentMap = new Map<string, { orders: number; revenuePaise: number }>();
  for (const order of currValidOrders) {
    const method = order.paymentMethod;
    const current = paymentMap.get(method) || { orders: 0, revenuePaise: 0 };
    current.orders += 1;
    current.revenuePaise += order.totalPaise;
    paymentMap.set(method, current);
  }

  const paymentSplit = Array.from(paymentMap.entries()).map(([method, val]) => ({
    method,
    orders: val.orders,
    revenuePaise: val.revenuePaise,
  }));

  // Average Delivery Time
  const rawAvg = avgDeliveryResult[0]?.avgMinutes;
  const avgDeliveryMinutes = rawAvg !== null && rawAvg !== undefined ? Math.round(Number(rawAvg)) : null;

  const response: DashboardResponse = {
    range: {
      key: rangeKey,
      from: fromDate.toISOString(),
      to: toDate.toISOString(),
      bucket,
    },
    kpis: {
      revenuePaise: {
        value: currRevenuePaise,
        previous: prevRevenuePaise,
        deltaPct: computeDelta(currRevenuePaise, prevRevenuePaise),
      },
      orders: {
        value: currOrdersCount,
        previous: prevOrdersCount,
        deltaPct: computeDelta(currOrdersCount, prevOrdersCount),
      },
      aovPaise: {
        value: currAovPaise,
        previous: prevAovPaise,
        deltaPct: computeDelta(currAovPaise, prevAovPaise),
      },
      newCustomers: {
        value: currNewUsers,
        previous: prevNewUsers,
        deltaPct: computeDelta(currNewUsers, prevNewUsers),
      },
    },
    ops: {
      avgDeliveryMinutes,
      cancellationRate,
      activeOrders: activeOrdersCount,
      lowStockCount,
    },
    series,
    statusCounts,
    queue: queueOrders.map((o) => ({
      code: o.code,
      customerName: o.user.name,
      itemCount: o._count.items,
      totalPaise: o.totalPaise,
      createdAt: o.createdAt.toISOString(),
    })),
    lowStock: lowStockProducts.map((p) => ({
      id: p.id,
      name: p.name,
      image: p.images[0]?.url ?? null,
      unit: p.unit,
      stock: p.stock,
    })),
    topProducts,
    paymentSplit,
    recentOrders: recentOrders.map((o) => ({
      code: o.code,
      customerName: o.user.name,
      itemCount: o._count.items,
      totalPaise: o.totalPaise,
      paymentMethod: o.paymentMethod,
      paymentStatus: o.paymentStatus,
      status: o.status,
      createdAt: o.createdAt.toISOString(),
    })),
  };

  dashboardCache.set(rangeKey, {
    timestamp: Date.now(),
    data: response,
  });

  return response;
}
