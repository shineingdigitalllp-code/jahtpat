'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'dark';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  loading?: boolean;
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      loading = false,
      asChild = false,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-all select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 cursor-pointer rounded-[8px] active:scale-[0.99]';

    const variants = {
      primary: 'bg-accent text-accent-ink hover:bg-accent-hover shadow-xs',
      secondary: 'bg-white dark:bg-surface-2 text-ink border border-border/80 hover:bg-neutral-100 dark:hover:bg-surface hover:border-border-strong shadow-2xs',
      outline: 'bg-transparent text-ink border border-border/80 hover:bg-neutral-100 dark:hover:bg-surface-2 hover:border-border-strong',
      ghost: 'bg-transparent text-ink hover:bg-neutral-100 dark:hover:bg-surface-2',
      danger: 'bg-[var(--tone-danger-text)] text-white hover:opacity-90 shadow-xs',
      dark: 'bg-neutral-950 text-white hover:bg-neutral-900 dark:bg-surface dark:text-ink dark:border dark:border-border shadow-xs',
    };

    const sizes = {
      sm: 'h-8 px-3 text-xs gap-1.5',
      md: 'h-9 px-3.5 text-[13px] gap-2',
      lg: 'h-10 px-4 text-sm gap-2',
      icon: 'h-9 w-9 text-ink',
    };

    if (asChild) {
      return (
        <Slot
          ref={ref}
          className={cn(baseStyles, variants[variant], sizes[size], className)}
          {...props}
        >
          {children}
        </Slot>
      );
    }

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin text-current" />}
        {children}
      </button>
    );
  },
);
Button.displayName = 'Button';
