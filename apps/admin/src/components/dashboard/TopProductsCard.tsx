import * as React from 'react';
import Image from 'next/image';
import { Package } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { formatINR } from '@/lib/format';
import { cn } from '@/lib/utils';

export interface TopProductItem {
  id: number;
  name: string;
  image: string | null;
  units: number;
  revenuePaise: number;
}

export interface TopProductsCardProps {
  products: TopProductItem[];
  className?: string;
}

export function TopProductsCard({ products = [], className }: TopProductsCardProps) {
  return (
    <Card className={cn('flex flex-col', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-ink">Top Selling Products</CardTitle>
      </CardHeader>

      <CardContent className="flex-1 p-0">
        {products.length === 0 ? (
          <div className="flex h-44 items-center justify-center text-xs text-muted">
            No product sales in this period
          </div>
        ) : (
          <div className="divide-y divide-border">
            {products.map((item, idx) => (
              <div
                key={item.id}
                className="p-3 sm:px-4 flex items-center justify-between gap-3 hover:bg-surface-2/40 transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  {idx === 0 ? (
                    <span className="h-5 w-5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-[10px] font-extrabold flex items-center justify-center shrink-0">
                      1
                    </span>
                  ) : idx === 1 ? (
                    <span className="h-5 w-5 rounded-full bg-slate-200 border border-slate-300 dark:bg-slate-800 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-extrabold flex items-center justify-center shrink-0">
                      2
                    </span>
                  ) : idx === 2 ? (
                    <span className="h-5 w-5 rounded-full bg-amber-700/15 border border-amber-700/30 text-amber-800 dark:text-amber-400 text-[10px] font-extrabold flex items-center justify-center shrink-0">
                      3
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-muted w-5 text-center tabular-nums">
                      {idx + 1}
                    </span>
                  )}

                  <div className="h-9 w-9 rounded-[6px] border border-border/80 bg-white overflow-hidden shrink-0 flex items-center justify-center text-muted shadow-2xs">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.name}
                        width={36}
                        height={36}
                        className="h-full w-full object-contain p-0.5"
                      />
                    ) : (
                      <Package className="h-4 w-4" />
                    )}
                  </div>

                  <span className="text-xs font-medium text-ink truncate min-w-0 flex-1">
                    {item.name}
                  </span>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-xs font-bold text-ink tabular-nums">
                    {formatINR(item.revenuePaise)}
                  </div>
                  <div className="text-[11px] text-muted tabular-nums font-medium">
                    {item.units} sold
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

