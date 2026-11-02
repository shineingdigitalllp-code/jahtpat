import * as React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'info' | 'warning' | 'danger' | 'success';
  title?: string;
}

export function Alert({
  className,
  variant = 'info',
  title,
  children,
  ...props
}: AlertProps) {
  const icons = {
    info: <Info className="h-4 w-4 shrink-0 text-[var(--tone-info-text)]" />,
    warning: <AlertTriangle className="h-4 w-4 shrink-0 text-[var(--tone-warning-text)]" />,
    danger: <AlertCircle className="h-4 w-4 shrink-0 text-[var(--tone-danger-text)]" />,
    success: <CheckCircle2 className="h-4 w-4 shrink-0 text-[var(--tone-success-text)]" />,
  };

  const styles = {
    info: 'bg-[var(--tone-info-bg)] text-[var(--tone-info-text)] border-[var(--tone-info-text)]/20',
    warning: 'bg-[var(--tone-warning-bg)] text-[var(--tone-warning-text)] border-[var(--tone-warning-text)]/20',
    danger: 'bg-[var(--tone-danger-bg)] text-[var(--tone-danger-text)] border-[var(--tone-danger-text)]/20',
    success: 'bg-[var(--tone-success-bg)] text-[var(--tone-success-text)] border-[var(--tone-success-text)]/20',
  };

  return (
    <div
      role="alert"
      className={cn(
        'flex items-start gap-2.5 rounded-[8px] border p-3 text-xs leading-relaxed',
        styles[variant],
        className,
      )}
      {...props}
    >
      <div className="mt-0.5">{icons[variant]}</div>
      <div className="flex-1">
        {title && <div className="font-semibold">{title}</div>}
        <div className="opacity-95">{children}</div>
      </div>
    </div>
  );
}

