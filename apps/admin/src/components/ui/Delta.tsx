import * as React from 'react';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DeltaProps extends React.HTMLAttributes<HTMLDivElement> {
  deltaPct: number | null;
  periodLabel?: string;
  inverse?: boolean;
}

export function Delta({
  deltaPct,
  periodLabel = 'vs previous period',
  inverse = false,
  className,
  ...props
}: DeltaProps) {
  if (deltaPct === null || isNaN(deltaPct)) {
    return (
      <div className={cn('flex items-center gap-1.5 text-xs text-muted font-medium', className)} {...props}>
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-neutral-200/60 dark:bg-white/10 text-neutral-700 dark:text-neutral-300">
          —
        </span>
      </div>
    );
  }

  const isPositive = deltaPct > 0;
  const isNeutral = deltaPct === 0;

  let isGood = isPositive;
  if (inverse) {
    isGood = !isPositive;
  }

  const pillClass = isNeutral
    ? 'bg-neutral-200/70 text-neutral-800 dark:bg-white/10 dark:text-neutral-300'
    : isGood
      ? 'bg-emerald-50 text-emerald-800 border border-emerald-300/60 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/40'
      : 'bg-rose-50 text-rose-800 border border-rose-300/60 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/40';

  const Icon = isPositive ? ArrowUpRight : ArrowDownRight;

  return (
    <div className={cn('flex items-center gap-1.5 text-xs font-medium', className)} {...props}>
      <span className={cn('inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-bold shadow-2xs', pillClass)}>
        {!isNeutral && <Icon className="h-3 w-3 shrink-0 stroke-[2.5]" />}
        <span>{isPositive ? `+${deltaPct}%` : `${deltaPct}%`}</span>
      </span>
      {periodLabel && (
        <span className="text-muted font-medium text-[11px] ml-0.5">{periodLabel}</span>
      )}
    </div>
  );
}
