'use client';

import * as React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error('App error boundary caught:', error);
  }, [error]);

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center p-6 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--tone-danger-bg)] text-[var(--tone-danger-text)]">
        <AlertCircle className="h-6 w-6 stroke-[2]" />
      </div>
      <h2 className="text-base font-semibold text-ink">Something went wrong</h2>
      <p className="mt-1 max-w-md text-xs text-muted leading-relaxed">
        {error.message || 'An unexpected error occurred while loading this page.'}
      </p>
      {error.digest && (
        <p className="mt-2 text-[10px] font-mono text-faint">Error ID: {error.digest}</p>
      )}
      <Button onClick={() => reset()} className="mt-6 gap-2" size="sm">
        <RefreshCw className="h-3.5 w-3.5" />
        <span>Try again</span>
      </Button>
    </div>
  );
}

