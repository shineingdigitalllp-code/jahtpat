import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center bg-canvas">
      <div className="text-4xl font-bold text-accent font-serif mb-2">404</div>
      <h1 className="text-lg font-semibold text-ink">Page not found</h1>
      <p className="mt-1 max-w-sm text-xs text-muted leading-relaxed">
        The page you are looking for does not exist or has been moved.
      </p>
      <Button asChild className="mt-6" size="sm">
        <Link href="/dashboard">Back to Dashboard</Link>
      </Button>
    </div>
  );
}

