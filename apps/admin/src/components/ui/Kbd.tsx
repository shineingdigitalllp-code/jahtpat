import * as React from 'react';
import { cn } from '@/lib/utils';

export function Kbd({ className, children, ...props }: React.HTMLAttributes<HTMLElement>) {
  return (
    <kbd
      className={cn(
        'pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded-[5px] border border-neutral-900 bg-neutral-950 text-white dark:border-border dark:bg-surface-2 dark:text-muted px-1.5 font-mono text-[10px] font-semibold shadow-2xs',
        className,
      )}
      {...props}
    >
      {children}
    </kbd>
  );
}

