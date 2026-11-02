'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { formatINR } from '@/lib/format';
import { cn } from '@/lib/utils';

export interface SeriesPoint {
  t: string;
  revenuePaise: number;
  orders: number;
}

export interface RevenueChartProps {
  series: SeriesPoint[];
  className?: string;
}

export function RevenueChart({ series = [], className }: RevenueChartProps) {
  const [metric, setMetric] = React.useState<'revenue' | 'orders'>('revenue');
  const [hoverIdx, setHoverIdx] = React.useState<number | null>(null);

  const values = series.map((s) => (metric === 'revenue' ? s.revenuePaise : s.orders));
  const maxVal = Math.max(...values, metric === 'revenue' ? 10000 : 5);
  const hasData = values.some((v) => v > 0);

  // Dimensions
  const height = 240;
  const paddingX = 40;
  const paddingY = 20;
  const usableHeight = height - paddingY * 2;
  const width = 600;
  const usableWidth = width - paddingX * 2;

  const points = series.map((s, idx) => {
    const val = metric === 'revenue' ? s.revenuePaise : s.orders;
    const x = paddingX + (idx / Math.max(1, series.length - 1)) * usableWidth;
    const y = height - paddingY - (val / maxVal) * usableHeight;
    return { x, y, point: s, val };
  });

  const pathStr = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const areaStr = `${pathStr} L ${paddingX + usableWidth} ${height - paddingY} L ${paddingX} ${height - paddingY} Z`;

  // 4 Y-axis ticks
  const ticks = [0, 0.33, 0.66, 1].map((pct) => {
    const val = maxVal * pct;
    const y = height - paddingY - pct * usableHeight;
    const label = metric === 'revenue' ? formatINR(val) : Math.round(val).toString();
    return { y, label };
  });

  // Sample X-axis labels (up to 6)
  const xLabels = points.filter((_, idx) => {
    if (series.length <= 8) return true;
    const step = Math.ceil(series.length / 6);
    return idx % step === 0 || idx === series.length - 1;
  });

  const hoveredPoint = hoverIdx !== null && points[hoverIdx] ? points[hoverIdx] : null;
  const chartColor = metric === 'revenue' ? '#10B981' : '#3B82F6';

  return (
    <Card className={cn('flex flex-col', className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <CardTitle className="text-sm font-semibold text-ink">
            {metric === 'revenue' ? 'Revenue Trend' : 'Order Volume'}
          </CardTitle>
          <span
            className={cn(
              'h-2 w-2 rounded-full transition-colors',
              metric === 'revenue' ? 'bg-emerald-500' : 'bg-blue-500',
            )}
          />
        </div>

        {/* Segmented Control */}
        <div className="flex items-center rounded-[6px] border border-border bg-white dark:bg-surface-2 p-0.5 text-xs shadow-2xs">
          <button
            type="button"
            onClick={() => setMetric('revenue')}
            className={cn(
              'px-2.5 py-1 rounded-[4px] font-semibold transition-all cursor-pointer',
              metric === 'revenue'
                ? 'bg-neutral-950 text-white dark:bg-surface dark:text-ink shadow-xs'
                : 'text-muted hover:text-ink',
            )}
          >
            Revenue
          </button>
          <button
            type="button"
            onClick={() => setMetric('orders')}
            className={cn(
              'px-2.5 py-1 rounded-[4px] font-semibold transition-all cursor-pointer',
              metric === 'orders'
                ? 'bg-neutral-950 text-white dark:bg-surface dark:text-ink shadow-xs'
                : 'text-muted hover:text-ink',
            )}
          >
            Orders
          </button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col justify-end pt-2 pb-4">
        {!hasData ? (
          <div className="flex h-[240px] items-center justify-center text-xs text-muted">
            No orders in this period
          </div>
        ) : (
          <div className="relative w-full overflow-hidden select-none">
            <svg
              viewBox={`0 0 ${width} ${height}`}
              className="w-full h-[240px] overflow-visible"
              preserveAspectRatio="none"
              onMouseLeave={() => setHoverIdx(null)}
            >
              <defs>
                <linearGradient id="chart-area-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={chartColor} stopOpacity="0.25" />
                  <stop offset="100%" stopColor={chartColor} stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Gridlines */}
              {ticks.map((tick, i) => (
                <g key={i}>
                  <line
                    x1={paddingX}
                    y1={tick.y}
                    x2={width - paddingX}
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

              {/* Area & Stroke */}
              <path d={areaStr} fill="url(#chart-area-grad)" />
              <path
                d={pathStr}
                fill="none"
                stroke={chartColor}
                strokeWidth="2.25"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Interactive Hover Hit Areas */}
              {points.map((p, idx) => (
                <rect
                  key={idx}
                  x={p.x - usableWidth / (series.length * 2)}
                  y={0}
                  width={usableWidth / series.length}
                  height={height}
                  fill="transparent"
                  className="cursor-crosshair"
                  onMouseEnter={() => setHoverIdx(idx)}
                />
              ))}

              {/* Hover indicator */}
              {hoveredPoint && (
                <g>
                  <line
                    x1={hoveredPoint.x}
                    y1={paddingY}
                    x2={hoveredPoint.x}
                    y2={height - paddingY}
                    stroke={chartColor}
                    strokeWidth="1"
                    strokeDasharray="2 2"
                  />
                  <circle
                    cx={hoveredPoint.x}
                    cy={hoveredPoint.y}
                    r="4"
                    fill="var(--surface)"
                    stroke={chartColor}
                    strokeWidth="2"
                  />
                </g>
              )}

              {/* X Axis Labels */}
              {xLabels.map((lbl, i) => (
                <text
                  key={i}
                  x={lbl.x}
                  y={height - 2}
                  textAnchor="middle"
                  className="text-[10px] fill-[var(--muted)] font-mono"
                >
                  {lbl.point.t}
                </text>
              ))}
            </svg>

            {/* Hover Tooltip Overlay */}
            {hoveredPoint && (
              <div
                className="absolute pointer-events-none rounded-[6px] border border-border bg-surface px-2.5 py-1 text-xs shadow-md"
                style={{
                  left: `${(hoveredPoint.x / width) * 100}%`,
                  top: '12px',
                  transform: 'translateX(-50%)',
                }}
              >
                <div className="font-semibold text-ink">
                  {metric === 'revenue' ? formatINR(hoveredPoint.val) : `${hoveredPoint.val} orders`}
                </div>
                <div className="text-[10px] text-muted">{hoveredPoint.point.t}</div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

