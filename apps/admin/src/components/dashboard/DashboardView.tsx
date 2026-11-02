'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Receipt, RefreshCw, ShoppingBag, TrendingUp, Users } from 'lucide-react';
import type { DashboardResponse, RangeKey } from '@jhatpat/shared';
import { apiFetch } from '@/lib/api-client';
import { formatINR } from '@/lib/format';
import { PageHeader } from '@/components/layout/PageHeader';
import { Skeleton } from '@/components/ui/Skeleton';
import { KpiTile } from './KpiTile';
import { OperationsStrip } from './OperationsStrip';
import { RevenueChart } from './RevenueChart';
import { NeedsAttentionQueue } from './NeedsAttentionQueue';
import { OrderStatusCard } from './OrderStatusCard';
import { LowStockCard } from './LowStockCard';
import { TopProductsCard } from './TopProductsCard';
import { PaymentMethodsCard } from './PaymentMethodsCard';
import { RecentOrdersCard } from './RecentOrdersCard';
import { cn } from '@/lib/utils';

export function DashboardView() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const rangeParam = (searchParams.get('range') as RangeKey) || 'today';
  const [rangeKey, setRangeKey] = React.useState<RangeKey>(rangeParam);
  const [lastRefreshedAt, setLastRefreshedAt] = React.useState<number>(Date.now());
  const [elapsedSec, setElapsedSec] = React.useState<number>(0);

  // Sync state with URL parameter
  React.useEffect(() => {
    if (rangeParam !== rangeKey) {
      setRangeKey(rangeParam);
    }
  }, [rangeParam]);

  const setRange = (key: RangeKey) => {
    setRangeKey(key);
    router.replace(`/dashboard?range=${key}`, { scroll: false });
  };

  // Timer for "Updated Xs ago"
  React.useEffect(() => {
    const interval = setInterval(() => {
      setElapsedSec(Math.floor((Date.now() - lastRefreshedAt) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [lastRefreshedAt]);

  const {
    data,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery<DashboardResponse>({
    queryKey: ['admin', 'dashboard', rangeKey],
    queryFn: async () => {
      const res = await apiFetch<DashboardResponse>(`/api/v1/admin/dashboard?range=${rangeKey}`);
      setLastRefreshedAt(Date.now());
      setElapsedSec(0);
      return res;
    },
    staleTime: 15 * 1000,
    refetchInterval: 30 * 1000,
  });

  const ranges: { key: RangeKey; label: string; periodLabel: string }[] = [
    { key: 'today', label: 'Today', periodLabel: 'vs yesterday' },
    { key: '7d', label: '7D', periodLabel: 'vs prior 7 days' },
    { key: '30d', label: '30D', periodLabel: 'vs prior 30 days' },
    { key: '90d', label: '90D', periodLabel: 'vs prior 90 days' },
  ];

  const currentRangeObj = ranges.find((r) => r.key === rangeKey) || ranges[0]!;

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4">
          <div className="space-y-2">
            <Skeleton className="h-7 w-36" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-9 w-60 rounded-[8px]" />
        </div>

        {/* KPI Skeleton Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton className="h-32 rounded-[12px]" />
          <Skeleton className="h-32 rounded-[12px]" />
          <Skeleton className="h-32 rounded-[12px]" />
          <Skeleton className="h-32 rounded-[12px]" />
        </div>

        {/* Operations Strip Skeleton */}
        <Skeleton className="h-24 rounded-[12px]" />

        {/* Main Grid Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-8 space-y-5">
            <Skeleton className="h-[340px] rounded-[12px]" />
            <Skeleton className="h-[300px] rounded-[12px]" />
          </div>
          <div className="lg:col-span-4 space-y-5">
            <Skeleton className="h-[280px] rounded-[12px]" />
            <Skeleton className="h-[220px] rounded-[12px]" />
            <Skeleton className="h-[240px] rounded-[12px]" />
          </div>
        </div>
      </div>
    );
  }

  // Generate sparkline values from series
  const revenueSparkline = data.series.map((s) => s.revenuePaise);
  const ordersSparkline = data.series.map((s) => s.orders);
  const aovSparkline = data.series.map((s) => (s.orders > 0 ? s.revenuePaise / s.orders : 0));

  return (
    <div className="space-y-6">
      {/* Page Header with Range Control & Refresh */}
      <PageHeader
        title="Dashboard"
        description="Real-time overview of orders, revenue, and store operations."
        actions={
          <div className="flex items-center gap-3">
            {/* Last updated indicator */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted tabular-nums">
              <span>Updated {elapsedSec}s ago</span>
              <button
                type="button"
                onClick={() => refetch()}
                className={cn(
                  'p-1 text-muted hover:text-ink hover:bg-surface-2 rounded-[4px] transition-colors cursor-pointer',
                  isRefetching && 'animate-spin text-accent',
                )}
                title="Refresh dashboard data"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Segmented Range Control */}
            <div className="flex items-center rounded-[8px] border border-border bg-white dark:bg-surface-2 p-0.5 text-xs shadow-2xs">
              {ranges.map((r) => (
                <button
                  key={r.key}
                  type="button"
                  onClick={() => setRange(r.key)}
                  className={cn(
                    'px-3 py-1.5 rounded-[6px] font-semibold transition-all cursor-pointer',
                    rangeKey === r.key
                      ? 'bg-neutral-950 text-white shadow-xs dark:bg-surface dark:text-ink'
                      : 'text-muted hover:text-ink',
                  )}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        }
      />

      {/* 1. KPI Row (4 Tiles) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiTile
          label="Revenue"
          value={formatINR(data.kpis.revenuePaise.value)}
          deltaPct={data.kpis.revenuePaise.deltaPct}
          periodLabel={currentRangeObj.periodLabel}
          sparklineData={revenueSparkline}
          colorTheme="emerald"
          icon={TrendingUp}
        />
        <KpiTile
          label="Orders"
          value={data.kpis.orders.value}
          deltaPct={data.kpis.orders.deltaPct}
          periodLabel={currentRangeObj.periodLabel}
          sparklineData={ordersSparkline}
          colorTheme="blue"
          icon={ShoppingBag}
        />
        <KpiTile
          label="Average Order Value"
          value={formatINR(data.kpis.aovPaise.value)}
          deltaPct={data.kpis.aovPaise.deltaPct}
          periodLabel={currentRangeObj.periodLabel}
          sparklineData={aovSparkline}
          colorTheme="purple"
          icon={Receipt}
        />
        <KpiTile
          label="New Customers"
          value={data.kpis.newCustomers.value}
          deltaPct={data.kpis.newCustomers.deltaPct}
          periodLabel={currentRangeObj.periodLabel}
          sparklineData={ordersSparkline}
          colorTheme="pink"
          icon={Users}
        />
      </div>

      {/* 2. Operations Strip */}
      <OperationsStrip
        avgDeliveryMinutes={data.ops.avgDeliveryMinutes}
        cancellationRate={data.ops.cancellationRate}
        activeOrders={data.ops.activeOrders}
        lowStockCount={data.ops.lowStockCount}
      />

      {/* 3. Main Grid (Desktop 12 cols, Tablet/Mobile responsive) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column (8 columns) */}
        <div className="lg:col-span-8 space-y-5">
          {/* Revenue & Volume Chart */}
          <RevenueChart series={data.series} />

          {/* Recent Orders Table */}
          <RecentOrdersCard orders={data.recentOrders} />
        </div>

        {/* Right Column (4 columns) */}
        <div className="lg:col-span-4 space-y-5">
          {/* Needs Attention Queue */}
          <NeedsAttentionQueue queue={data.queue} rangeKey={rangeKey} />

          {/* Tablet Split container for Status & LowStock */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-5">
            {/* Order Status Distribution */}
            <OrderStatusCard statusCounts={data.statusCounts} />

            {/* Low Stock Inventory */}
            <LowStockCard items={data.lowStock} />
          </div>
        </div>
      </div>

      {/* 4. Bottom Row (Top Products & Payment Methods) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <TopProductsCard products={data.topProducts} />
        <PaymentMethodsCard paymentSplit={data.paymentSplit} />
      </div>
    </div>
  );
}

