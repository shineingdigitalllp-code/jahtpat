import * as React from 'react';
import Link from 'next/link';
import { ORDER_STATUS_META, PAYMENT_STATUS_META } from '@jhatpat/shared';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { StatusPill } from '@/components/ui/StatusPill';
import { formatINR, formatRelativeTime } from '@/lib/format';
import { cn } from '@/lib/utils';

export interface RecentOrderItem {
  code: string;
  customerName: string;
  itemCount: number;
  totalPaise: number;
  paymentMethod: string;
  paymentStatus: string;
  status: string;
  createdAt: string;
}

export interface RecentOrdersCardProps {
  orders: RecentOrderItem[];
  className?: string;
}

export function RecentOrdersCard({ orders = [], className }: RecentOrdersCardProps) {
  return (
    <Card className={cn('flex flex-col', className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-sm font-semibold text-ink">Recent Orders</CardTitle>
        <Link href="/orders" className="text-xs text-accent hover:underline font-medium">
          View all
        </Link>
      </CardHeader>

      <CardContent className="flex-1 p-0">
        {orders.length === 0 ? (
          <div className="flex h-48 items-center justify-center text-xs text-muted">
            No orders found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-2 border-y border-border text-muted font-medium">
                <tr>
                  <th className="py-2.5 px-3 sm:px-4">Order</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3">Items</th>
                  <th className="py-2.5 px-3">Total</th>
                  <th className="py-2.5 px-3">Payment</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 sm:px-4 text-right">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {orders.map((o) => {
                  const statusMeta = ORDER_STATUS_META[o.status] || {
                    label: o.status,
                    tone: 'neutral' as const,
                  };
                  const paymentMeta = PAYMENT_STATUS_META[o.paymentStatus] || {
                    label: o.paymentStatus,
                    tone: 'neutral' as const,
                  };

                  return (
                    <tr
                      key={o.code}
                      className="hover:bg-surface-2/50 transition-colors cursor-pointer group"
                    >
                      <td className="py-2.5 px-3 sm:px-4 font-mono font-semibold text-ink group-hover:text-accent">
                        <Link href={`/orders/${o.code}`}>{o.code}</Link>
                      </td>
                      <td className="py-2.5 px-3 text-ink truncate max-w-[120px]">
                        {o.customerName}
                      </td>
                      <td className="py-2.5 px-3 text-muted tabular-nums">
                        {o.itemCount} items
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-ink tabular-nums">
                        {formatINR(o.totalPaise)}
                      </td>
                      <td className="py-2.5 px-3">
                        <StatusPill tone={paymentMeta.tone} label={paymentMeta.label} />
                      </td>
                      <td className="py-2.5 px-3">
                        <StatusPill tone={statusMeta.tone} label={statusMeta.label} />
                      </td>
                      <td className="py-2.5 px-3 sm:px-4 text-right text-muted tabular-nums">
                        {formatRelativeTime(o.createdAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

