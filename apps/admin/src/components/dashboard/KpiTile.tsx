import * as React from 'react';
import type { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Delta } from '@/components/ui/Delta';
import { Sparkline } from '@/components/ui/Sparkline';
import { cn } from '@/lib/utils';

export type KpiColorTheme = 'emerald' | 'blue' | 'purple' | 'pink';

export interface KpiTileProps {
  label: string;
  value: string | number;
  deltaPct: number | null;
  periodLabel?: string;
  sparklineData?: number[];
  colorTheme?: KpiColorTheme;
  icon?: LucideIcon;
  className?: string;
}

const THEMES: Record<
  KpiColorTheme,
  {
    gradientBar: string;
    bgTint: string;
    iconBg: string;
    sparklineColor: string;
    borderHover: string;
  }
> = {
  emerald: {
    gradientBar: 'from-emerald-500 via-teal-400 to-emerald-500',
    bgTint: 'from-emerald-500/[0.04] to-surface dark:from-emerald-500/[0.07] dark:to-surface',
    iconBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25',
    sparklineColor: '#10B981',
    borderHover: 'hover:border-emerald-500/40',
  },
  blue: {
    gradientBar: 'from-blue-500 via-sky-400 to-indigo-500',
    bgTint: 'from-blue-500/[0.04] to-surface dark:from-blue-500/[0.07] dark:to-surface',
    iconBg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/25',
    sparklineColor: '#3B82F6',
    borderHover: 'hover:border-blue-500/40',
  },
  purple: {
    gradientBar: 'from-purple-500 via-indigo-400 to-violet-500',
    bgTint: 'from-purple-500/[0.04] to-surface dark:from-purple-500/[0.07] dark:to-surface',
    iconBg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/25',
    sparklineColor: '#8B5CF6',
    borderHover: 'hover:border-purple-500/40',
  },
  pink: {
    gradientBar: 'from-pink-500 via-rose-400 to-amber-500',
    bgTint: 'from-pink-500/[0.04] to-surface dark:from-pink-500/[0.07] dark:to-surface',
    iconBg: 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/25',
    sparklineColor: '#EC4899',
    borderHover: 'hover:border-pink-500/40',
  },
};

export function KpiTile({
  label,
  value,
  deltaPct,
  periodLabel,
  sparklineData = [],
  colorTheme = 'emerald',
  icon: Icon,
  className,
}: KpiTileProps) {
  const theme = THEMES[colorTheme] || THEMES.emerald;

  return (
    <Card
      className={cn(
        'relative p-4 sm:p-5 flex flex-col justify-between overflow-hidden transition-all duration-200',
        'bg-gradient-to-b',
        theme.bgTint,
        theme.borderHover,
        'hover:shadow-md',
        className,
      )}
    >
      {/* Top Accent Gradient Bar */}
      <span
        aria-hidden
        className={cn(
          'absolute inset-x-0 top-0 h-1 bg-gradient-to-r',
          theme.gradientBar,
        )}
      />

      <div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-bold text-muted uppercase tracking-wider">{label}</span>
          {Icon && (
            <span className={cn('p-1.5 rounded-lg border text-xs shadow-2xs', theme.iconBg)}>
              <Icon className="h-4 w-4" />
            </span>
          )}
        </div>

        <div className="mt-2 text-[26px] sm:text-[30px] font-extrabold text-ink leading-tight tabular-nums tracking-tight">
          {value}
        </div>

        <div className="mt-2.5 flex items-center">
          <Delta deltaPct={deltaPct} periodLabel={periodLabel} />
        </div>
      </div>

      <div className="mt-4 pt-1">
        <Sparkline data={sparklineData} color={theme.sparklineColor} height={38} />
      </div>
    </Card>
  );
}
