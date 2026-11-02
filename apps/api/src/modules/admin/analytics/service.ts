import type {
  AdminAnalyticsResponse,
  AnalyticsKpi,
  AnalyticsSeriesPoint,
  CategorySalesPoint,
  CustomerCohortPoint,
  HourlyOrderPoint,
  TopProductAnalyticsItem,
  CancellationReasonPoint,
} from '@jhatpat/shared';
import { db } from '@/config/db';
import { daysAgoIST, endOfDayIST, getISTDate, startOfDayIST } from '@/utils/ist';

function computeDelta(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

export async function getAnalyticsData(params: {
  from?: string;
  to?: string;
  groupBy?: 'day' | 'week' | 'month';
}): Promise<AdminAnalyticsResponse> {
  const groupBy = params.groupBy || 'day';

  // Calculate default 30 days range if not provided
  let fromDate: Date;
  let toDate: Date;

  if (params.from) {
    fromDate = new Date(params.from);
  } else {
    fromDate = daysAgoIST(29);
  }

  if (params.to) {
    toDate = new Date(params.to);
  } else {
    toDate = endOfDayIST();
  }

  // Duration in ms and matching previous period
  const durationMs = Math.max(1, toDate.getTime() - fromDate.getTime());
  const prevFromDate = new Date(fromDate.getTime() - durationMs);
  const prevToDate = new Date(fromDate.getTime() - 1);

  const validCondition = {
    status: { notIn: ['cancelled', 'pending_payment'] as any },
    paymentStatus: { not: 'failed' as any },
  };

  // 1. Current period orders
  const currentOrders = await db.order.findMany({
    where: {
      ...validCondition,
      createdAt: { gte: fromDate, lte: toDate },
    },
    select: {
      id: true,
      totalPaise: true,
      userId: true,
      createdAt: true,
      items: {
        select: {
          productId: true,
          name: true,
          unit: true,
          qty: true,
          pricePaise: true,
          product: {
            select: {
              categoryId: true,
              category: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      },
    },
  });

  // Previous period orders for KPI delta calculation
  const previousOrders = await db.order.findMany({
    where: {
      ...validCondition,
      createdAt: { gte: prevFromDate, lte: prevToDate },
    },
    select: {
      totalPaise: true,
    },
  });

  // New customers in period vs previous
  const [currentNewCustomers, prevNewCustomers] = await Promise.all([
    db.user.count({ where: { createdAt: { gte: fromDate, lte: toDate } } }),
    db.user.count({ where: { createdAt: { gte: prevFromDate, lte: prevToDate } } }),
  ]);

  // Compute Current KPIs
  const currentRevenue = currentOrders.reduce((sum, o) => sum + o.totalPaise, 0);
  const currentOrderCount = currentOrders.length;
  const currentAov = currentOrderCount > 0 ? Math.round(currentRevenue / currentOrderCount) : 0;

  // Compute Previous KPIs
  const prevRevenue = previousOrders.reduce((sum, o) => sum + o.totalPaise, 0);
  const prevOrderCount = previousOrders.length;
  const prevAov = prevOrderCount > 0 ? Math.round(prevRevenue / prevOrderCount) : 0;

  const kpis: {
    revenuePaise: AnalyticsKpi;
    orders: AnalyticsKpi;
    aovPaise: AnalyticsKpi;
    totalCustomers: AnalyticsKpi;
  } = {
    revenuePaise: {
      value: currentRevenue,
      previous: prevRevenue,
      deltaPct: computeDelta(currentRevenue, prevRevenue),
    },
    orders: {
      value: currentOrderCount,
      previous: prevOrderCount,
      deltaPct: computeDelta(currentOrderCount, prevOrderCount),
    },
    aovPaise: {
      value: currentAov,
      previous: prevAov,
      deltaPct: computeDelta(currentAov, prevAov),
    },
    totalCustomers: {
      value: currentNewCustomers,
      previous: prevNewCustomers,
      deltaPct: computeDelta(currentNewCustomers, prevNewCustomers),
    },
  };

  // 2. Revenue & Orders Trend Series (Continuous zero-filled)
  const trendMap = new Map<string, { revenuePaise: number; orders: number }>();

  // Helper to format bucket key
  const formatBucketKey = (d: Date): string => {
    const ist = getISTDate(d);
    const yr = ist.getUTCFullYear();
    const mo = String(ist.getUTCMonth() + 1).padStart(2, '0');
    const da = String(ist.getUTCDate()).padStart(2, '0');

    if (groupBy === 'month') {
      return `${yr}-${mo}`;
    }
    if (groupBy === 'week') {
      // Calculate ISO week
      const target = new Date(ist.getTime());
      const dayNr = (ist.getUTCDay() + 6) % 7;
      target.setUTCDate(target.getUTCDate() - dayNr + 3);
      const firstThursday = target.getTime();
      target.setUTCMonth(0, 1);
      if (target.getUTCDay() !== 4) {
        target.setUTCMonth(0, 1 + ((4 - target.getUTCDay() + 7) % 7));
      }
      const weekNumber = 1 + Math.ceil((firstThursday - target.getTime()) / 604800000);
      return `${yr}-W${String(weekNumber).padStart(2, '0')}`;
    }
    return `${yr}-${mo}-${da}`;
  };

  // Populate trend data from actual orders
  for (const order of currentOrders) {
    const key = formatBucketKey(order.createdAt);
    const existing = trendMap.get(key) || { revenuePaise: 0, orders: 0 };
    existing.revenuePaise += order.totalPaise;
    existing.orders += 1;
    trendMap.set(key, existing);
  }

  // Generate continuous series
  const revenueTrend: AnalyticsSeriesPoint[] = [];
  const curr = new Date(fromDate);
  while (curr <= toDate) {
    const key = formatBucketKey(curr);
    if (!revenueTrend.some((p) => p.t === key)) {
      const data = trendMap.get(key) || { revenuePaise: 0, orders: 0 };
      revenueTrend.push({
        t: key,
        revenuePaise: data.revenuePaise,
        orders: data.orders,
      });
    }
    curr.setUTCDate(curr.getUTCDate() + (groupBy === 'month' ? 25 : groupBy === 'week' ? 7 : 1));
  }

  // 3. Orders by Hour of Day (0..23 IST)
  const hourlyCounts = Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    orders: 0,
    revenuePaise: 0,
  }));

  for (const order of currentOrders) {
    const ist = getISTDate(order.createdAt);
    const hr = ist.getUTCHours();
    if (hourlyCounts[hr]) {
      hourlyCounts[hr].orders += 1;
      hourlyCounts[hr].revenuePaise += order.totalPaise;
    }
  }

  // 4. Sales by Category
  const categoryMap = new Map<number, { name: string; revenuePaise: number; units: number }>();
  let totalCategoryRevenue = 0;

  for (const order of currentOrders) {
    for (const item of order.items) {
      const lineTotal = item.pricePaise * item.qty;
      const catId = item.product?.category?.id || 0;
      const catName = item.product?.category?.name || 'Uncategorized';
      const existing = categoryMap.get(catId) || { name: catName, revenuePaise: 0, units: 0 };
      existing.revenuePaise += lineTotal;
      existing.units += item.qty;
      categoryMap.set(catId, existing);
      totalCategoryRevenue += lineTotal;
    }
  }

  const salesByCategory: CategorySalesPoint[] = Array.from(categoryMap.entries())
    .map(([categoryId, val]) => ({
      categoryId,
      name: val.name,
      revenuePaise: val.revenuePaise,
      units: val.units,
      pct: totalCategoryRevenue > 0 ? Math.round((val.revenuePaise / totalCategoryRevenue) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.revenuePaise - a.revenuePaise);

  // 5. Top 10 Products by units sold & revenue
  const productMap = new Map<
    number,
    { name: string; unit: string; categoryName: string; unitsSold: number; revenuePaise: number }
  >();

  for (const order of currentOrders) {
    for (const item of order.items) {
      const lineTotal = item.pricePaise * item.qty;
      const existing = productMap.get(item.productId) || {
        name: item.name,
        unit: item.unit,
        categoryName: item.product?.category?.name || 'General',
        unitsSold: 0,
        revenuePaise: 0,
      };
      existing.unitsSold += item.qty;
      existing.revenuePaise += lineTotal;
      productMap.set(item.productId, existing);
    }
  }

  const topProducts: TopProductAnalyticsItem[] = Array.from(productMap.entries())
    .map(([id, p]) => ({
      id,
      name: p.name,
      unit: p.unit,
      categoryName: p.categoryName,
      unitsSold: p.unitsSold,
      revenuePaise: p.revenuePaise,
    }))
    .sort((a, b) => b.unitsSold - a.unitsSold)
    .slice(0, 10);

  // 6. Customer Cohort: New vs Returning Customers
  // Find which users had orders before fromDate
  const allUserIdsInOrders = Array.from(new Set(currentOrders.map((o) => o.userId)));
  const usersWithPriorOrders = await db.order.findMany({
    where: {
      userId: { in: allUserIdsInOrders },
      createdAt: { lt: fromDate },
      ...validCondition,
    },
    select: { userId: true },
    distinct: ['userId'],
  });

  const priorUserIdsSet = new Set(usersWithPriorOrders.map((u) => u.userId));

  const cohortMap = new Map<string, { newCustomers: Set<string>; returningCustomers: Set<string> }>();

  for (const order of currentOrders) {
    const key = formatBucketKey(order.createdAt);
    const existing = cohortMap.get(key) || {
      newCustomers: new Set<string>(),
      returningCustomers: new Set<string>(),
    };

    if (priorUserIdsSet.has(order.userId)) {
      existing.returningCustomers.add(order.userId);
    } else {
      existing.newCustomers.add(order.userId);
    }
    cohortMap.set(key, existing);
  }

  const customerCohort: CustomerCohortPoint[] = revenueTrend.map((p) => {
    const cohort = cohortMap.get(p.t);
    return {
      t: p.t,
      newCustomers: cohort ? cohort.newCustomers.size : 0,
      returningCustomers: cohort ? cohort.returningCustomers.size : 0,
    };
  });

  // 7. Order Cancellation Reasons
  const cancelledOrders = await db.order.findMany({
    where: {
      status: 'cancelled',
      createdAt: { gte: fromDate, lte: toDate },
    },
    select: {
      cancelReason: true,
    },
  });

  const reasonCounts = new Map<string, number>();
  for (const c of cancelledOrders) {
    const reason = (c.cancelReason || 'Other / Not specified').trim();
    reasonCounts.set(reason, (reasonCounts.get(reason) || 0) + 1);
  }

  const totalCancelled = cancelledOrders.length;
  const cancellationReasons: CancellationReasonPoint[] = Array.from(reasonCounts.entries())
    .map(([reason, count]) => ({
      reason,
      count,
      pct: totalCancelled > 0 ? Math.round((count / totalCancelled) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.count - a.count);

  return {
    range: {
      from: fromDate.toISOString(),
      to: toDate.toISOString(),
      groupBy,
    },
    kpis,
    revenueTrend,
    ordersByHour: hourlyCounts,
    salesByCategory,
    topProducts,
    customerCohort,
    cancellationReasons,
  };
}

export async function exportAnalyticsCsv(
  panel: string,
  params: { from?: string; to?: string; groupBy?: 'day' | 'week' | 'month' },
): Promise<string> {
  const data = await getAnalyticsData(params);

  switch (panel) {
    case 'revenue': {
      let csv = 'Time Period,Revenue (INR),Orders\n';
      for (const row of data.revenueTrend) {
        csv += `"${row.t}",${(row.revenuePaise / 100).toFixed(2)},${row.orders}\n`;
      }
      return csv;
    }
    case 'hourly': {
      let csv = 'Hour of Day (IST),Orders,Revenue (INR)\n';
      for (const row of data.ordersByHour) {
        const hrStr = `${String(row.hour).padStart(2, '0')}:00 - ${String(row.hour + 1).padStart(2, '0')}:00`;
        csv += `"${hrStr}",${row.orders},${(row.revenuePaise / 100).toFixed(2)}\n`;
      }
      return csv;
    }
    case 'categories': {
      let csv = 'Category,Units Sold,Revenue (INR),Share (%)\n';
      for (const row of data.salesByCategory) {
        csv += `"${row.name.replace(/"/g, '""')}",${row.units},${(row.revenuePaise / 100).toFixed(2)},${row.pct}%\n`;
      }
      return csv;
    }
    case 'products': {
      let csv = 'Product ID,Product Name,Unit,Category,Units Sold,Revenue (INR)\n';
      for (const row of data.topProducts) {
        csv += `${row.id},"${row.name.replace(/"/g, '""')}","${row.unit}","${row.categoryName.replace(/"/g, '""')}",${row.unitsSold},${(row.revenuePaise / 100).toFixed(2)}\n`;
      }
      return csv;
    }
    case 'customers': {
      let csv = 'Period,New Customers,Returning Customers\n';
      for (const row of data.customerCohort) {
        csv += `"${row.t}",${row.newCustomers},${row.returningCustomers}\n`;
      }
      return csv;
    }
    case 'cancellations': {
      let csv = 'Cancellation Reason,Count,Share (%)\n';
      for (const row of data.cancellationReasons) {
        csv += `"${row.reason.replace(/"/g, '""')}",${row.count},${row.pct}%\n`;
      }
      return csv;
    }
    default: {
      return 'Metric,Value\nRevenue,' + (data.kpis.revenuePaise.value / 100).toFixed(2) + '\nOrders,' + data.kpis.orders.value;
    }
  }
}
