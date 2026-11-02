import * as React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'neutral' | 'accent' | 'info' | 'dark';
}

export function Badge({ className, variant = 'neutral', ...props }: BadgeProps) {
  const variants = {
    neutral: 'bg-neutral-200/70 text-neutral-800 dark:bg-surface-2 dark:text-ink-2 border-border/80',
    accent: 'bg-accent-soft text-accent border-accent/20 font-semibold',
    info: 'bg-[var(--tone-info-bg)] text-[var(--tone-info-text)] border-[var(--tone-info-text)]/20 font-semibold',
    dark: 'bg-neutral-950 text-white dark:bg-surface-2 dark:text-ink border-neutral-900 dark:border-border font-bold shadow-2xs',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium leading-none tabular-nums',
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}

