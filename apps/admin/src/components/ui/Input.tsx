'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', error, ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        className={cn(
          'flex h-9 w-full rounded-[8px] border bg-white dark:bg-surface px-3 py-1.5 text-[13px] text-ink placeholder:text-muted/80 shadow-2xs transition-all',
          'border-border/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-border-strong',
          'disabled:cursor-not-allowed disabled:opacity-50',
          error && 'border-[var(--tone-danger-text)] focus-visible:ring-[var(--tone-danger-text)]',
          className,
        )}
        {...props}
      />
    );
  },
);
Input.displayName = 'Input';

