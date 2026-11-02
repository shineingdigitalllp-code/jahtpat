import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { formatINR } from '@/lib/format';
import { cn } from '@/lib/utils';

export interface PaymentSplitItem {
  method: string;
  orders: number;
  revenuePaise: number;
}

export interface PaymentMethodsCardProps {
  paymentSplit: PaymentSplitItem[];
  className?: string;
}

const PAYMENT_STYLES: Record<
  string,
  { label: string; barGradient: string; dotColor: string }
> = {
  online: {
    label: 'Online (UPI / Cards)',
    barGradient: 'from-emerald-500 to-teal-400',
    dotColor: 'bg-emerald-500',
  },
  razorpay: {
    label: 'Online (UPI / Cards)',
    barGradient: 'from-emerald-500 to-teal-400',
    dotColor: 'bg-emerald-500',
  },
  cod: {
    label: 'Cash on Delivery',
    barGradient: 'from-amber-500 to-orange-400',
    dotColor: 'bg-amber-500',
  },
  wallet: {
    label: 'Wallet Balance',
    barGradient: 'from-indigo-500 to-purple-400',
    dotColor: 'bg-indigo-500',
  },
};

export function PaymentMethodsCard({ paymentSplit = [], className }: PaymentMethodsCardProps) {
  const totalRevenue = paymentSplit.reduce((sum, item) => sum + item.revenuePaise, 0);

  const getStyle = (method: string) => {
    const key = method.toLowerCase();
    return (
      PAYMENT_STYLES[key] || {
        label: method.toUpperCase(),
        barGradient: 'from-sky-500 to-blue-400',
        dotColor: 'bg-sky-500',
      }
    );
  };

  return (
    <Card className={cn('flex flex-col', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-ink">Payment Methods</CardTitle>
      </CardHeader>

      <CardContent className="flex-1 space-y-4">
        {paymentSplit.length === 0 ? (
          <div className="flex h-44 items-center justify-center text-xs text-muted">
            No payments recorded in this period
          </div>
        ) : (
          <div className="space-y-4">
            {paymentSplit.map((item) => {
              const pct = totalRevenue > 0 ? (item.revenuePaise / totalRevenue) * 100 : 0;
              const style = getStyle(item.method);

              return (
                <div key={item.method} className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className={cn('h-2 w-2 rounded-full shrink-0 shadow-2xs', style.dotColor)} />
                      <span className="font-medium text-ink">{style.label}</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <span className="text-muted tabular-nums text-[11px]">{item.orders} orders</span>
                      <span className="font-bold text-ink tabular-nums">
                        {formatINR(item.revenuePaise)}
                      </span>
                    </div>
                  </div>

                  <div className="h-2 w-full rounded-full bg-surface-2 overflow-hidden border border-border/80">
                    <div
                      style={{ width: `${pct}%` }}
                      className={cn('h-full bg-gradient-to-r transition-all duration-300 rounded-full', style.barGradient)}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

