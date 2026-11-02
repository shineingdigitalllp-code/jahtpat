'use client';

import * as React from 'react';
import Link from 'next/link';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Clock } from 'lucide-react';
import type { DashboardResponse } from '@jhatpat/shared';
import { apiFetch } from '@/lib/api-client';
import { formatINR } from '@/lib/format';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

export interface QueueItem {
  code: string;
  customerName: string;
  itemCount: number;
  totalPaise: number;
  createdAt: string;
}

export interface NeedsAttentionQueueProps {
  queue: QueueItem[];
  rangeKey: string;
  className?: string;
}

export function NeedsAttentionQueue({ queue = [], rangeKey, className }: NeedsAttentionQueueProps) {
  const queryClient = useQueryClient();
  const [now, setNow] = React.useState<number>(Date.now());

  // Update timer ticks every 10 seconds
  React.useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 10000);
    return () => clearInterval(timer);
  }, []);

  const prepareMutation = useMutation({
    mutationFn: async (code: string) => {
      return apiFetch(`/api/v1/admin/orders/${code}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'preparing' }),
      });
    },
    onMutate: async (code: string) => {
      await queryClient.cancelQueries({ queryKey: ['admin', 'dashboard', rangeKey] });
      const previousDashboard = queryClient.getQueryData<DashboardResponse>([
        'admin',
        'dashboard',
        rangeKey,
      ]);

      if (previousDashboard) {
        queryClient.setQueryData<DashboardResponse>(['admin', 'dashboard', rangeKey], {
          ...previousDashboard,
          queue: previousDashboard.queue.filter((q) => q.code !== code),
          statusCounts: {
            ...previousDashboard.statusCounts,
            placed: Math.max(0, (previousDashboard.statusCounts['placed'] ?? 1) - 1),
            preparing: (previousDashboard.statusCounts['preparing'] ?? 0) + 1,
          },
        });
      }

      return { previousDashboard };
    },
    onError: (err: any, code, context) => {
      if (context?.previousDashboard) {
        queryClient.setQueryData(['admin', 'dashboard', rangeKey], context.previousDashboard);
      }
      toast.error(err.message || 'Failed to update order status');
    },
    onSuccess: (_, code) => {
      toast.success(`Order ${code} marked as Preparing`);
      queryClient.invalidateQueries({ queryKey: ['admin', 'counts'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    },
  });

  return (
    <Card className={cn('flex flex-col', className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <CardTitle className="text-sm font-semibold text-ink">Needs Attention</CardTitle>
          {queue.length > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 border border-rose-500/25 px-2 py-0.5 text-[11px] font-bold text-rose-600 dark:text-rose-400 shadow-2xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
              </span>
              <span>{queue.length} pending</span>
            </span>
          )}
        </div>
        <Link href="/orders?status=placed" className="text-xs text-accent hover:underline font-semibold">
          View all
        </Link>
      </CardHeader>

      <CardContent className="flex-1 p-0">
        {queue.length === 0 ? (
          <div className="flex h-48 items-center justify-center text-xs text-muted">
            No orders waiting
          </div>
        ) : (
          <div className="divide-y divide-border">
            {queue.map((item) => {
              const createdMs = new Date(item.createdAt).getTime();
              const elapsedMinutes = Math.floor((now - createdMs) / 60000);

              let ageColor = 'text-muted bg-surface-2 border-border';
              let rowHighlight = 'border-l-2 border-l-transparent';
              if (elapsedMinutes >= 10) {
                ageColor = 'text-rose-700 dark:text-rose-400 bg-rose-500/15 border-rose-500/30 font-bold';
                rowHighlight = 'bg-rose-500/[0.04] border-l-2 border-l-rose-500';
              } else if (elapsedMinutes >= 5) {
                ageColor = 'text-amber-700 dark:text-amber-400 bg-amber-500/15 border-amber-500/30 font-semibold';
                rowHighlight = 'bg-amber-500/[0.03] border-l-2 border-l-amber-500';
              }

              return (
                <div
                  key={item.code}
                  className={cn(
                    'p-3 sm:px-4 flex items-center justify-between gap-3 hover:bg-surface-2/50 transition-colors',
                    rowHighlight,
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-ink">
                        {item.code}
                      </span>
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 rounded-[4px] border px-1.5 py-0.5 text-[10px] tabular-nums',
                          ageColor,
                        )}
                      >
                        <Clock className="h-3 w-3 shrink-0" />
                        <span>{elapsedMinutes}m ago</span>
                      </span>
                    </div>

                    <div className="mt-0.5 flex items-center gap-2 text-xs text-muted truncate">
                      <span className="truncate font-medium">{item.customerName}</span>
                      <span>·</span>
                      <span className="tabular-nums">{item.itemCount} items</span>
                      <span>·</span>
                      <span className="font-semibold text-ink tabular-nums">
                        {formatINR(item.totalPaise)}
                      </span>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="primary"
                    loading={prepareMutation.isPending && prepareMutation.variables === item.code}
                    onClick={() => prepareMutation.mutate(item.code)}
                    className="shrink-0 h-7 px-2.5 text-xs font-semibold shadow-xs"
                  >
                    Start preparing
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

