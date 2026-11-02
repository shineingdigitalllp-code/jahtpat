import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function ForbiddenPage() {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center p-6 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--tone-warning-bg)] text-[var(--tone-warning-text)]">
        <ShieldAlert className="h-6 w-6 stroke-[2]" />
      </div>
      <h2 className="text-base font-semibold text-ink">Access Restricted</h2>
      <p className="mt-1 max-w-sm text-xs text-muted leading-relaxed">
        You do not have access to this page. Please contact the store owner if you need elevated permissions.
      </p>
      <Button asChild className="mt-6" size="sm">
        <Link href="/dashboard">Return to Dashboard</Link>
      </Button>
    </div>
  );
}

