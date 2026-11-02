import * as React from 'react';
import type { Tone } from '@jhatpat/shared';
import { cn } from '@/lib/utils';

export interface StatusPillProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
  label: string;
}

export function StatusPill({ tone = 'neutral', label, className, ...props }: StatusPillProps) {
  const toneStyles: Record<Tone, { bg: string; text: string; dot: string }> = {
    neutral: {
      bg: 'bg-[var(--tone-neutral-bg)]',
      text: 'text-[var(--tone-neutral-text)]',
      dot: 'bg-[var(--tone-neutral-text)]',
    },
    info: {
      bg: 'bg-[var(--tone-info-bg)]',
      text: 'text-[var(--tone-info-text)]',
      dot: 'bg-[var(--tone-info-text)]',
    },
    warning: {
      bg: 'bg-[var(--tone-warning-bg)]',
      text: 'text-[var(--tone-warning-text)]',
      dot: 'bg-[var(--tone-warning-text)]',
    },
    indigo: {
      bg: 'bg-[var(--tone-indigo-bg)]',
      text: 'text-[var(--tone-indigo-text)]',
      dot: 'bg-[var(--tone-indigo-text)]',
    },
    success: {
      bg: 'bg-[var(--tone-success-bg)]',
      text: 'text-[var(--tone-success-text)]',
      dot: 'bg-[var(--tone-success-text)]',
    },
    danger: {
      bg: 'bg-[var(--tone-danger-bg)]',
      text: 'text-[var(--tone-danger-text)]',
      dot: 'bg-[var(--tone-danger-text)]',
    },
  };

  const current = toneStyles[tone] || toneStyles.neutral;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium leading-none select-none',
        current.bg,
        current.text,
        className,
      )}
      {...props}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', current.dot)} />
      <span>{label}</span>
    </span>
  );
}

