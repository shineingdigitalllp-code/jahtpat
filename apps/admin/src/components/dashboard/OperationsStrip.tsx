import * as React from 'react';
import Link from 'next/link';
import { Activity, AlertTriangle, Package, Zap } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

export interface OperationsStripProps {
  avgDeliveryMinutes: number | null;
  cancellationRate: number;
  activeOrders: number;
  lowStockCount: number;
  className?: string;
}

export function OperationsStrip({
  avgDeliveryMinutes,
  cancellationRate,
  activeOrders,
  lowStockCount,
  className,
}: OperationsStripProps) {
  const stats = [
    {
      label: 'Avg delivery time',
      value: avgDeliveryMinutes !== null ? `${avgDeliveryMinutes} min` : '—',
      sub: 'Target 10 min quick SLA',
      href: '/orders?status=delivered',
      icon: Zap,
      iconColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25',
      hoverBg: 'hover:bg-amber-500/[0.03]',
      ping: false,
      badgeText: undefined,
    },
    {
      label: 'Cancellation rate',
      value: `${cancellationRate}%`,
      sub: cancellationRate > 5 ? 'Above 5% target' : 'Within normal limits',
      href: '/orders?status=cancelled',
      warning: cancellationRate > 5,
      icon: AlertTriangle,
      iconColor:
        cancellationRate > 5
          ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30'
          : 'bg-neutral-500/10 text-neutral-600 dark:text-neutral-400 border-neutral-500/20',
      hoverBg: cancellationRate > 5 ? 'hover:bg-rose-500/[0.04]' : 'hover:bg-surface-2/40',
      ping: cancellationRate > 5,
      badgeText: cancellationRate > 5 ? 'High' : undefined,
    },
    {
      label: 'Active orders',
      value: activeOrders,
      sub: 'In fulfillment pipeline',
      href: '/orders?status=active',
      icon: Activity,
      iconColor: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/25',
      hoverBg: 'hover:bg-sky-500/[0.03]',
      ping: activeOrders > 0,
      badgeText: activeOrders > 0 ? 'Live' : undefined,
    },
    {
      label: 'Low stock items',
      value: lowStockCount,
      sub: lowStockCount > 0 ? 'Requires restocking' : 'Healthy inventory',
      href: '/products?stock=low',
      warning: lowStockCount > 0,
      icon: Package,
      iconColor:
        lowStockCount > 0
          ? 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30'
          : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25',
      hoverBg: lowStockCount > 0 ? 'hover:bg-orange-500/[0.04]' : 'hover:bg-surface-2/40',
      ping: lowStockCount > 0,
      badgeText: lowStockCount > 0 ? `${lowStockCount} items` : undefined,
    },
  ];

  return (
    <Card className={cn('overflow-hidden', className)}>
      <div className="grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-border">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;

          return (
            <Link
              key={idx}
              href={stat.href}
              className={cn(
                'p-4 sm:p-5 flex flex-col justify-between transition-colors cursor-pointer group',
                stat.hoverBg,
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-muted uppercase tracking-wider group-hover:text-ink transition-colors">
                  {stat.label}
                </span>

                <div className="flex items-center gap-1.5">
                  {/* Radar ping dot & status badge */}
                  {stat.badgeText && (
                    <span
                      className={cn(
                        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border shadow-2xs',
                        stat.label.includes('Active') &&
                          'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/25',
                        stat.label.includes('Low stock') &&
                          'bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30',
                        stat.label.includes('Cancellation') &&
                          'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30',
                      )}
                    >
                      {stat.ping && (
                        <span className="relative flex h-1.5 w-1.5">
                          <span
                            className={cn(
                              'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
                              stat.label.includes('Active') && 'bg-sky-400',
                              stat.label.includes('Low stock') && 'bg-orange-400',
                              stat.label.includes('Cancellation') && 'bg-rose-400',
                            )}
                          />
                          <span
                            className={cn(
                              'relative inline-flex rounded-full h-1.5 w-1.5',
                              stat.label.includes('Active') && 'bg-sky-500',
                              stat.label.includes('Low stock') && 'bg-orange-500',
                              stat.label.includes('Cancellation') && 'bg-rose-500',
                            )}
                          />
                        </span>
                      )}
                      {stat.badgeText}
                    </span>
                  )}

                  <span className={cn('p-1.5 rounded-lg border text-xs shadow-2xs', stat.iconColor)}>
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                </div>
              </div>

              <div className="mt-2.5 flex items-baseline gap-2">
                <span
                  className={cn(
                    'text-2xl sm:text-[28px] font-extrabold tabular-nums tracking-tight',
                    stat.warning && stat.label.includes('Low stock') && 'text-orange-600 dark:text-orange-400',
                    stat.warning && stat.label.includes('Cancellation') && 'text-rose-600 dark:text-rose-400',
                    !stat.warning && 'text-ink',
                  )}
                >
                  {stat.value}
                </span>
              </div>

              <div
                className={cn(
                  'mt-1.5 text-xs font-semibold truncate',
                  stat.warning ? 'text-orange-600 dark:text-orange-400' : 'text-muted',
                )}
              >
                {stat.sub}
              </div>
            </Link>
          );
        })}
      </div>
    </Card>
  );
}
