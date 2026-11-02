import * as React from 'react';
import { ORDER_STATUS_META } from '@jhatpat/shared';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

export interface OrderStatusCardProps {
  statusCounts: Record<string, number>;
  className?: string;
}

const STATUS_CONFIG: Record<
  string,
  { barColor: string; dotColor: string }
> = {
  placed: {
    barColor: '#0284C7',
    dotColor: 'bg-sky-500',
  },
  preparing: {
    barColor: '#F59E0B',
    dotColor: 'bg-amber-500',
  },
  out_for_delivery: {
    barColor: '#6366F1',
    dotColor: 'bg-indigo-500',
  },
  delivered: {
    barColor: '#10B981',
    dotColor: 'bg-emerald-500',
  },
  cancelled: {
    barColor: '#F43F5E',
    dotColor: 'bg-rose-500',
  },
};

export function OrderStatusCard({ statusCounts = {}, className }: OrderStatusCardProps) {
  const statuses = ['placed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'];
  const total = statuses.reduce((sum, s) => sum + (statusCounts[s] || 0), 0);

  return (
    <Card className={cn('flex flex-col', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold text-ink">Order Status</CardTitle>
          <span className="text-xs text-muted tabular-nums font-semibold">{total} total</span>
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-4">
        {/* Stacked Horizontal Bar */}
        <div className="flex h-3 w-full overflow-hidden rounded-full bg-surface-2 border border-border/80">
          {total === 0 ? (
            <div className="w-full bg-border" />
          ) : (
            statuses.map((s) => {
              const count = statusCounts[s] || 0;
              if (count === 0) return null;
              const pct = (count / total) * 100;
              const cfg = STATUS_CONFIG[s] || { barColor: '#6B7280', dotColor: 'bg-neutral-500' };
              const meta = ORDER_STATUS_META[s] || { label: s };

              return (
                <div
                  key={s}
                  style={{
                    width: `${pct}%`,
                    backgroundColor: cfg.barColor,
                  }}
                  className="h-full transition-all duration-300"
                  title={`${meta.label}: ${count} (${pct.toFixed(1)}%)`}
                />
              );
            })
          )}
        </div>

        {/* Legend List */}
        <div className="space-y-2.5 pt-1">
          {statuses.map((s) => {
            const count = statusCounts[s] || 0;
            const pct = total > 0 ? ((count / total) * 100).toFixed(1) : '0.0';
            const meta = ORDER_STATUS_META[s] || { label: s };
            const cfg = STATUS_CONFIG[s] || { barColor: '#6B7280', dotColor: 'bg-neutral-500' };

            return (
              <div key={s} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className={cn('h-2 w-2 rounded-full shrink-0 shadow-2xs', cfg.dotColor)} />
                  <span className="font-medium text-ink">{meta.label}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-muted tabular-nums text-[11px]">{pct}%</span>
                  <span className="font-bold text-ink tabular-nums w-8 text-right">
                    {count}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

