'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Calendar,
  Clock,
  Download,
  Layers,
  Package,
  TrendingUp,
  UserCheck,
  Users,
  XCircle,
} from 'lucide-react';
import type { AdminAnalyticsResponse } from '@jhatpat/shared';
import { apiFetch } from '@/lib/api-client';
import { useAdmin } from '@/lib/auth-context';
import { formatINR } from '@/lib/format';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Delta } from '@/components/ui/Delta';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import ForbiddenPage from '../forbidden/page';

type RangePreset = 'today' | '7d' | '30d' | '90d' | 'custom';
type GroupByOption = 'day' | 'week' | 'month';

export default function AnalyticsPage() {
  const { admin } = useAdmin();
  const [preset, setPreset] = React.useState<RangePreset>('30d');
  const [groupBy, setGroupBy] = React.useState<GroupByOption>('day');
  const [customFrom, setCustomFrom] = React.useState('');
  const [customTo, setCustomTo] = React.useState('');

  // Active chart metric toggle for Panel 1 (Revenue / Orders)
  const [trendMetric, setTrendMetric] = React.useState<'revenue' | 'orders'>('revenue');
  const [trendHoverIdx, setTrendHoverIdx] = React.useState<number | null>(null);

  // Hover state for 24-hr orders chart
  const [hourHoverIdx, setHourHoverIdx] = React.useState<number | null>(null);

  // Compute ISO dates based on preset
  const { fromDate, toDate } = React.useMemo(() => {
    const now = new Date();
    if (preset === 'today') {
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      return { fromDate: todayStart.toISOString(), toDate: now.toISOString() };
    }
    if (preset === '7d') {
      const d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return { fromDate: d.toISOString(), toDate: now.toISOString() };
    }
    if (preset === '30d') {
      const d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return { fromDate: d.toISOString(), toDate: now.toISOString() };
    }
    if (preset === '90d') {
      const d = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      return { fromDate: d.toISOString(), toDate: now.toISOString() };
    }
    // Custom
    return {
      fromDate: customFrom ? new Date(customFrom).toISOString() : '',
      toDate: customTo ? new Date(customTo + 'T23:59:59.999Z').toISOString() : '',
    };
  }, [preset, customFrom, customTo]);

  const queryParams = new URLSearchParams();
  if (fromDate) queryParams.set('from', fromDate);
  if (toDate) queryParams.set('to', toDate);
  queryParams.set('groupBy', groupBy);

  const { data, isLoading } = useQuery<AdminAnalyticsResponse>({
    queryKey: ['admin', 'analytics', queryParams.toString()],
    queryFn: () =>
      apiFetch<AdminAnalyticsResponse>(`/api/v1/admin/analytics?${queryParams.toString()}`),
    enabled: admin?.role === 'owner' || admin?.role === 'manager',
  });

  if (admin && admin.role === 'staff') {
    return <ForbiddenPage />;
  }

  const exportPanelCsv = (panel: string) => {
    const exportParams = new URLSearchParams(queryParams);
    exportParams.set('panel', panel);
    window.location.href = `/api/v1/admin/analytics/export.csv?${exportParams.toString()}`;
  };

  // Dimensions for Trend Chart (Panel 1)
  const trendPoints = data?.revenueTrend ?? [];
  const trendValues = trendPoints.map((p) =>
    trendMetric === 'revenue' ? p.revenuePaise : p.orders,
  );
  const maxTrendVal = Math.max(...trendValues, trendMetric === 'revenue' ? 10000 : 5);
  const trendHeight = 220;
  const trendWidth = 700;
  const paddingX = 44;
  const paddingY = 24;
  const usableHeight = trendHeight - paddingY * 2;
  const usableWidth = trendWidth - paddingX * 2;

  const renderedTrendPoints = trendPoints.map((p, idx) => {
    const val = trendMetric === 'revenue' ? p.revenuePaise : p.orders;
    const x = paddingX + (idx / Math.max(1, trendPoints.length - 1)) * usableWidth;
    const y = trendHeight - paddingY - (val / maxTrendVal) * usableHeight;
    return { x, y, point: p, val };
  });

  const pathStr = renderedTrendPoints
    .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ');
  const areaStr = renderedTrendPoints.length > 0
    ? `${pathStr} L ${paddingX + usableWidth} ${trendHeight - paddingY} L ${paddingX} ${trendHeight - paddingY} Z`
    : '';

  // Y-axis ticks for Panel 1
  const trendTicks = [0, 0.33, 0.66, 1].map((pct) => {
    const val = maxTrendVal * pct;
    const y = trendHeight - paddingY - pct * usableHeight;
    const label = trendMetric === 'revenue' ? formatINR(val) : Math.round(val).toString();
    return { y, label };
  });

  // Hourly Chart Calculation (Panel 2)
  const hourlyData = data?.ordersByHour ?? [];
  const maxHourlyOrders = Math.max(...hourlyData.map((h) => h.orders), 1);

  // Customer Cohort Max (Panel 5)
  const cohortData = data?.customerCohort ?? [];
  const maxCohortTotal = Math.max(
    ...cohortData.map((c) => c.newCustomers + c.returningCustomers),
    1,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics & Reports"
        description="Business metrics, hourly traffic patterns, sales distributions, and customer cohorts."
      />

      {/* Control Strip (Range Presets & Grouping) */}
      <Card>
        <CardContent className="p-3.5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Range Presets */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-medium text-muted mr-1.5">Date Range:</span>
              {(['today', '7d', '30d', '90d', 'custom'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setPreset(r)}
                  className={`px-3 py-1.5 rounded-[6px] text-xs font-medium transition-colors cursor-pointer ${
                    preset === r
                      ? 'bg-surface text-ink border border-border shadow-xs'
                      : 'text-muted hover:text-ink hover:bg-surface-2'
                  }`}
                >
                  {r === 'today'
                    ? 'Today'
                    : r === '7d'
                      ? 'Last 7 Days'
                      : r === '30d'
                        ? 'Last 30 Days'
                        : r === '90d'
                          ? 'Last 90 Days'
                          : 'Custom Range'}
                </button>
              ))}
            </div>

            {/* Custom Dates & GroupBy */}
            <div className="flex flex-wrap items-center gap-2.5">
              {preset === 'custom' && (
                <div className="flex items-center gap-1.5">
                  <Input
                    type="date"
                    value={customFrom}
                    onChange={(e) => setCustomFrom(e.target.value)}
                    className="h-8.5 w-36 text-xs bg-surface"
                  />
                  <span className="text-xs text-muted">to</span>
                  <Input
                    type="date"
                    value={customTo}
                    onChange={(e) => setCustomTo(e.target.value)}
                    className="h-8.5 w-36 text-xs bg-surface"
                  />
                </div>
              )}

              {/* Group By selector */}
              <div className="flex items-center gap-1.5 pl-2 border-l border-border">
                <span className="text-xs font-medium text-muted">Group By:</span>
                <select
                  value={groupBy}
                  onChange={(e) => setGroupBy(e.target.value as GroupByOption)}
                  className="h-8.5 rounded-[8px] border border-border bg-surface px-2.5 text-xs text-ink focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
                >
                  <option value="day">Daily</option>
                  <option value="week">Weekly</option>
                  <option value="month">Monthly</option>
                </select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Summary KPI Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Revenue */}
        <Card>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between text-muted text-xs">
              <span>Total Revenue</span>
              <TrendingUp className="h-4 w-4 text-accent" />
            </div>
            {isLoading ? (
              <Skeleton className="h-7 w-28" />
            ) : (
              <div className="text-xl font-bold text-ink tracking-tight">
                {formatINR(data?.kpis.revenuePaise.value ?? 0)}
              </div>
            )}
            <Delta deltaPct={data?.kpis.revenuePaise.deltaPct ?? null} />
          </CardContent>
        </Card>

        {/* KPI 2: Total Orders */}
        <Card>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between text-muted text-xs">
              <span>Total Orders</span>
              <BarChart3 className="h-4 w-4 text-accent" />
            </div>
            {isLoading ? (
              <Skeleton className="h-7 w-20" />
            ) : (
              <div className="text-xl font-bold text-ink tracking-tight">
                {(data?.kpis.orders.value ?? 0).toLocaleString()}
              </div>
            )}
            <Delta deltaPct={data?.kpis.orders.deltaPct ?? null} />
          </CardContent>
        </Card>

        {/* KPI 3: Average Order Value */}
        <Card>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between text-muted text-xs">
              <span>Average Order Value</span>
              <Package className="h-4 w-4 text-accent" />
            </div>
            {isLoading ? (
              <Skeleton className="h-7 w-24" />
            ) : (
              <div className="text-xl font-bold text-ink tracking-tight">
                {formatINR(data?.kpis.aovPaise.value ?? 0)}
              </div>
            )}
            <Delta deltaPct={data?.kpis.aovPaise.deltaPct ?? null} />
          </CardContent>
        </Card>

        {/* KPI 4: New Customer Registrations */}
        <Card>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between text-muted text-xs">
              <span>New Customers</span>
              <Users className="h-4 w-4 text-accent" />
            </div>
            {isLoading ? (
              <Skeleton className="h-7 w-20" />
            ) : (
              <div className="text-xl font-bold text-ink tracking-tight">
                {(data?.kpis.totalCustomers.value ?? 0).toLocaleString()}
              </div>
            )}
            <Delta deltaPct={data?.kpis.totalCustomers.deltaPct ?? null} />
          </CardContent>
        </Card>
      </div>

      {/* Grid: Panels 1 & 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* PANEL 1: REVENUE & ORDERS TREND (2 Cols) */}
        <Card className="lg:col-span-2 flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-border">
            <div className="space-y-0.5">
              <CardTitle className="text-sm font-semibold text-ink">
                Revenue & Order Volume Trend
              </CardTitle>
              <div className="text-[11px] text-muted">
                Continuous performance grouped by {groupBy}.
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Metric Toggle */}
              <div className="flex items-center rounded-[6px] border border-border bg-surface-2 p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setTrendMetric('revenue')}
                  className={`px-2.5 py-1 rounded-[4px] font-medium transition-colors cursor-pointer ${
                    trendMetric === 'revenue'
                      ? 'bg-surface text-ink shadow-xs'
                      : 'text-muted hover:text-ink'
                  }`}
                >
                  Revenue
                </button>
                <button
                  type="button"
                  onClick={() => setTrendMetric('orders')}
                  className={`px-2.5 py-1 rounded-[4px] font-medium transition-colors cursor-pointer ${
                    trendMetric === 'orders'
                      ? 'bg-surface text-ink shadow-xs'
                      : 'text-muted hover:text-ink'
                  }`}
                >
                  Orders
                </button>
              </div>

              {/* Export CSV */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportPanelCsv('revenue')}
                className="h-7 px-2.5 text-xs gap-1"
                title="Export trend series to CSV"
              >
                <Download className="h-3 w-3" />
                <span className="hidden sm:inline">CSV</span>
              </Button>
            </div>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col justify-end pt-4 pb-4">
            {isLoading ? (
              <Skeleton className="h-[220px] w-full rounded-[8px]" />
            ) : trendPoints.length === 0 ? (
              <div className="h-[220px] flex items-center justify-center text-xs text-muted">
                No orders recorded in this date range.
              </div>
            ) : (
              <div className="relative w-full overflow-hidden select-none">
                <svg
                  viewBox={`0 0 ${trendWidth} ${trendHeight}`}
                  className="w-full h-[220px] overflow-visible"
                  preserveAspectRatio="none"
                  onMouseLeave={() => setTrendHoverIdx(null)}
                >
                  <defs>
                    <linearGradient id="analytics-area-grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Gridlines */}
                  {trendTicks.map((tick, i) => (
                    <g key={i}>
                      <line
                        x1={paddingX}
                        y1={tick.y}
                        x2={trendWidth - paddingX}
                        y2={tick.y}
                        stroke="var(--border)"
                        strokeDasharray="3 3"
                        strokeWidth="1"
                      />
                      <text
                        x={paddingX - 8}
                        y={tick.y + 3}
                        textAnchor="end"
                        className="text-[9px] fill-[var(--muted)] font-mono tabular-nums"
                      >
                        {tick.label}
                      </text>
                    </g>
                  ))}

                  {/* Fill Area & Line Stroke */}
                  {areaStr && <path d={areaStr} fill="url(#analytics-area-grad)" />}
                  {pathStr && (
                    <path
                      d={pathStr}
                      fill="none"
                      stroke="var(--accent)"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}

                  {/* Hover Rectangles & Indicator */}
                  {renderedTrendPoints.map((p, idx) => (
                    <rect
                      key={idx}
                      x={p.x - usableWidth / (trendPoints.length * 2)}
                      y={0}
                      width={usableWidth / trendPoints.length}
                      height={trendHeight}
                      fill="transparent"
                      className="cursor-pointer"
                      onMouseEnter={() => setTrendHoverIdx(idx)}
                    />
                  ))}

                  {trendHoverIdx !== null && renderedTrendPoints[trendHoverIdx] && (
                    <g>
                      <line
                        x1={renderedTrendPoints[trendHoverIdx].x}
                        y1={paddingY}
                        x2={renderedTrendPoints[trendHoverIdx].x}
                        y2={trendHeight - paddingY}
                        stroke="var(--accent)"
                        strokeWidth="1.5"
                        strokeDasharray="2 2"
                      />
                      <circle
                        cx={renderedTrendPoints[trendHoverIdx].x}
                        cy={renderedTrendPoints[trendHoverIdx].y}
                        r="5"
                        className="fill-[var(--accent)] stroke-[var(--surface)] stroke-2"
                      />
                    </g>
                  )}
                </svg>

                {/* Floating Tooltip */}
                {trendHoverIdx !== null && renderedTrendPoints[trendHoverIdx] && (
                  <div
                    className="absolute pointer-events-none z-20 rounded-[8px] border border-border bg-surface px-3 py-1.5 shadow-lg text-xs"
                    style={{
                      left: `${(renderedTrendPoints[trendHoverIdx].x / trendWidth) * 100}%`,
                      top: '10px',
                      transform: 'translateX(-50%)',
                    }}
                  >
                    <div className="text-[10px] text-muted">
                      {renderedTrendPoints[trendHoverIdx].point.t}
                    </div>
                    <div className="font-semibold text-ink mt-0.5">
                      {trendMetric === 'revenue'
                        ? formatINR(renderedTrendPoints[trendHoverIdx].point.revenuePaise)
                        : `${renderedTrendPoints[trendHoverIdx].point.orders} orders`}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* PANEL 2: ORDERS BY HOUR OF DAY (IST PEAK HOURS) */}
        <Card className="flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-border">
            <div className="space-y-0.5">
              <CardTitle className="text-sm font-semibold text-ink flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-accent" />
                <span>Orders by Hour (IST)</span>
              </CardTitle>
              <div className="text-[11px] text-muted">Rush hour demand patterns (0–23h).</div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => exportPanelCsv('hourly')}
              className="h-7 px-2.5 text-xs gap-1"
            >
              <Download className="h-3 w-3" />
              <span className="hidden sm:inline">CSV</span>
            </Button>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col justify-end pt-4 pb-4">
            {isLoading ? (
              <Skeleton className="h-[220px] w-full rounded-[8px]" />
            ) : (
              <div className="space-y-2">
                {/* 24-Hour Vertical Bar Chart */}
                <div className="h-[180px] flex items-end gap-1 select-none pt-4">
                  {hourlyData.map((hr, idx) => {
                    const heightPct = Math.round((hr.orders / maxHourlyOrders) * 100);
                    const isHovered = hourHoverIdx === idx;
                    const isPeak = hr.orders === maxHourlyOrders && hr.orders > 0;

                    return (
                      <div
                        key={hr.hour}
                        className="flex-1 flex flex-col items-center justify-end h-full relative cursor-pointer group"
                        onMouseEnter={() => setHourHoverIdx(idx)}
                        onMouseLeave={() => setHourHoverIdx(null)}
                      >
                        <div
                          className={`w-full rounded-t-[3px] transition-all ${
                            isPeak
                              ? 'bg-accent'
                              : isHovered
                                ? 'bg-accent/80'
                                : hr.orders > 0
                                  ? 'bg-accent/40'
                                  : 'bg-surface-2'
                          }`}
                          style={{ height: `${Math.max(4, heightPct)}%` }}
                        />

                        {/* Hover Tooltip */}
                        {isHovered && (
                          <div className="absolute bottom-full mb-1 z-30 pointer-events-none rounded-[6px] border border-border bg-surface px-2 py-1 shadow-md text-center whitespace-nowrap">
                            <div className="text-[10px] font-semibold text-ink">
                              {String(hr.hour).padStart(2, '0')}:00 - {String(hr.hour + 1).padStart(2, '0')}:00
                            </div>
                            <div className="text-[11px] text-accent font-bold">
                              {hr.orders} orders ({formatINR(hr.revenuePaise)})
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* X-axis Hour Marks */}
                <div className="flex justify-between text-[9px] font-mono text-muted pt-1 border-t border-border">
                  <span>12 AM</span>
                  <span>6 AM</span>
                  <span>12 PM</span>
                  <span>6 PM</span>
                  <span>11 PM</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Grid: Panels 3 & 4 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* PANEL 3: SALES BY CATEGORY */}
        <Card className="flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border">
            <div className="space-y-0.5">
              <CardTitle className="text-sm font-semibold text-ink flex items-center gap-1.5">
                <Layers className="h-4 w-4 text-accent" />
                <span>Sales by Category</span>
              </CardTitle>
              <div className="text-[11px] text-muted">
                Category revenue contribution and volume.
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => exportPanelCsv('categories')}
              className="h-7 px-2.5 text-xs gap-1"
            >
              <Download className="h-3 w-3" />
              <span>CSV</span>
            </Button>
          </CardHeader>

          <CardContent className="p-4 flex-1">
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full rounded-[8px]" />
                ))}
              </div>
            ) : (data?.salesByCategory.length ?? 0) === 0 ? (
              <div className="py-12 text-center text-xs text-muted">
                No category sales in this period.
              </div>
            ) : (
              <div className="space-y-3.5">
                {data?.salesByCategory.map((cat) => (
                  <div key={cat.categoryId} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-ink truncate max-w-[180px]">
                        {cat.name}
                      </span>
                      <div className="flex items-center gap-3 text-[11px] shrink-0">
                        <span className="text-muted">{cat.units} units</span>
                        <span className="font-semibold text-ink">{formatINR(cat.revenuePaise)}</span>
                        <span className="text-accent font-bold w-10 text-right">{cat.pct}%</span>
                      </div>
                    </div>
                    {/* Progress Bar */}
                    <div className="h-2 w-full rounded-full bg-surface-2 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-accent transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.max(3, cat.pct))}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* PANEL 4: TOP 10 PRODUCTS */}
        <Card className="flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border">
            <div className="space-y-0.5">
              <CardTitle className="text-sm font-semibold text-ink flex items-center gap-1.5">
                <Package className="h-4 w-4 text-accent" />
                <span>Top 10 Selling Products</span>
              </CardTitle>
              <div className="text-[11px] text-muted">Top volume generators by units sold.</div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => exportPanelCsv('products')}
              className="h-7 px-2.5 text-xs gap-1"
            >
              <Download className="h-3 w-3" />
              <span>CSV</span>
            </Button>
          </CardHeader>

          <CardContent className="p-0 flex-1 overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-surface-2 text-muted font-medium select-none">
                  <th className="py-2.5 px-3 w-8 text-center">#</th>
                  <th className="py-2.5 px-3">Product</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3 text-right">Units</th>
                  <th className="py-2.5 px-3 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      <td className="py-2.5 px-3 text-center">
                        <Skeleton className="h-3.5 w-3 mx-auto" />
                      </td>
                      <td className="py-2.5 px-3">
                        <Skeleton className="h-3.5 w-32" />
                      </td>
                      <td className="py-2.5 px-3">
                        <Skeleton className="h-3.5 w-20" />
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <Skeleton className="h-3.5 w-10 ml-auto" />
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <Skeleton className="h-3.5 w-16 ml-auto" />
                      </td>
                    </tr>
                  ))
                ) : (data?.topProducts.length ?? 0) === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-muted">
                      No product sales recorded in this period.
                    </td>
                  </tr>
                ) : (
                  data?.topProducts.map((p, idx) => (
                    <tr key={p.id} className="hover:bg-surface-2/40 transition-colors">
                      <td className="py-2.5 px-3 text-center font-mono text-muted text-[11px]">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-ink max-w-[160px] truncate">
                        {p.name}
                        <span className="text-[10px] text-muted font-normal ml-1">({p.unit})</span>
                      </td>
                      <td className="py-2.5 px-3 text-muted max-w-[110px] truncate">
                        {p.categoryName}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-medium text-ink">
                        {p.unitsSold}
                      </td>
                      <td className="py-2.5 px-3 text-right font-semibold text-accent font-mono">
                        {formatINR(p.revenuePaise)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

      {/* Grid: Panels 5 & 6 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* PANEL 5: CUSTOMER COHORT (NEW VS RETURNING) */}
        <Card className="flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border">
            <div className="space-y-0.5">
              <CardTitle className="text-sm font-semibold text-ink flex items-center gap-1.5">
                <Users className="h-4 w-4 text-accent" />
                <span>Customer Cohort: New vs Returning</span>
              </CardTitle>
              <div className="text-[11px] text-muted">
                Retention and acquisition distribution per period.
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 text-[10px] font-medium mr-1">
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-accent" />
                  <span>New</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-[var(--tone-indigo-text)]" />
                  <span>Returning</span>
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportPanelCsv('customers')}
                className="h-7 px-2.5 text-xs gap-1"
              >
                <Download className="h-3 w-3" />
                <span>CSV</span>
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-4 flex-1 flex flex-col justify-end">
            {isLoading ? (
              <Skeleton className="h-[200px] w-full rounded-[8px]" />
            ) : cohortData.length === 0 ? (
              <div className="py-12 text-center text-xs text-muted">
                No customer orders recorded in this period.
              </div>
            ) : (
              <div className="space-y-2">
                <div className="h-[180px] flex items-end gap-1.5 select-none pt-4">
                  {cohortData.map((c, idx) => {
                    const total = c.newCustomers + c.returningCustomers;
                    const heightPct = Math.round((total / maxCohortTotal) * 100);
                    const newPct = total > 0 ? (c.newCustomers / total) * 100 : 0;
                    const retPct = total > 0 ? (c.returningCustomers / total) * 100 : 0;

                    return (
                      <div
                        key={c.t}
                        className="flex-1 flex flex-col items-center justify-end h-full relative group cursor-pointer"
                      >
                        <div
                          className="w-full flex flex-col justify-end rounded-t-[3px] overflow-hidden"
                          style={{ height: `${Math.max(4, heightPct)}%` }}
                        >
                          {/* Returning customers segment */}
                          <div
                            className="w-full bg-[var(--tone-indigo-text)] transition-all"
                            style={{ height: `${retPct}%` }}
                          />
                          {/* New customers segment */}
                          <div
                            className="w-full bg-accent transition-all"
                            style={{ height: `${newPct}%` }}
                          />
                        </div>

                        {/* Hover Tooltip */}
                        <div className="absolute bottom-full mb-1 z-30 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity rounded-[6px] border border-border bg-surface px-2.5 py-1.5 shadow-md text-center whitespace-nowrap">
                          <div className="text-[10px] text-muted">{c.t}</div>
                          <div className="text-[11px] font-semibold text-accent">
                            {c.newCustomers} New
                          </div>
                          <div className="text-[11px] font-semibold text-[var(--tone-indigo-text)]">
                            {c.returningCustomers} Returning
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-between text-[9px] font-mono text-muted pt-1 border-t border-border">
                  <span>{cohortData[0]?.t}</span>
                  <span>{cohortData[Math.floor(cohortData.length / 2)]?.t}</span>
                  <span>{cohortData[cohortData.length - 1]?.t}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* PANEL 6: CANCELLATION REASONS */}
        <Card className="flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border">
            <div className="space-y-0.5">
              <CardTitle className="text-sm font-semibold text-ink flex items-center gap-1.5">
                <XCircle className="h-4 w-4 text-[var(--tone-danger-text)]" />
                <span>Order Cancellation Reasons</span>
              </CardTitle>
              <div className="text-[11px] text-muted">Root causes and frequency breakdown.</div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => exportPanelCsv('cancellations')}
              className="h-7 px-2.5 text-xs gap-1"
            >
              <Download className="h-3 w-3" />
              <span>CSV</span>
            </Button>
          </CardHeader>

          <CardContent className="p-4 flex-1">
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full rounded-[8px]" />
                ))}
              </div>
            ) : (data?.cancellationReasons.length ?? 0) === 0 ? (
              <div className="py-12 text-center text-xs text-muted flex flex-col items-center gap-1.5">
                <UserCheck className="h-6 w-6 text-[var(--tone-success-text)]" />
                <span className="font-medium text-ink">Zero cancellations in this period</span>
                <span className="text-[11px] text-muted">All placed orders were fulfilled successfully.</span>
              </div>
            ) : (
              <div className="space-y-3.5">
                {data?.cancellationReasons.map((reason, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-ink truncate max-w-[220px]">
                        {reason.reason}
                      </span>
                      <div className="flex items-center gap-2 text-[11px]">
                        <span className="text-muted">{reason.count} orders</span>
                        <span className="font-bold text-[var(--tone-danger-text)] w-10 text-right">
                          {reason.pct}%
                        </span>
                      </div>
                    </div>
                    {/* Progress Bar */}
                    <div className="h-2 w-full rounded-full bg-surface-2 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[var(--tone-danger-text)] transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.max(3, reason.pct))}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
