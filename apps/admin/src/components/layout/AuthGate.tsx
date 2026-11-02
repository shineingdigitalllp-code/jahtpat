'use client';

import * as React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAdmin } from '@/lib/auth-context';
import { Skeleton } from '@/components/ui/Skeleton';

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { admin, isLoading } = useAdmin();
  const router = useRouter();
  const pathname = usePathname();

  React.useEffect(() => {
    if (!isLoading) {
      if (!admin) {
        const next = encodeURIComponent(pathname);
        router.replace(`/login?next=${next}`);
      } else if (admin.mustChangePassword && pathname !== '/change-password') {
        router.replace('/change-password');
      }
    }
  }, [admin, isLoading, pathname, router]);

  if (isLoading || !admin) {
    return (
      <div className="flex h-screen w-screen overflow-hidden bg-canvas">
        {/* Sidebar skeleton */}
        <div className="hidden md:flex w-[248px] flex-col border-r border-border bg-sidebar p-4 gap-4">
          <div className="flex items-center gap-2 mb-4">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-4 w-10" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
          <div className="mt-auto pt-4 border-t border-border flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="space-y-1">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-2 w-12" />
            </div>
          </div>
        </div>

        {/* Content skeleton */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="h-14 border-b border-border bg-canvas px-6 flex items-center justify-between">
            <Skeleton className="h-5 w-32" />
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
          </div>
          <div className="flex-1 p-6 space-y-6 overflow-auto">
            <div className="flex items-center justify-between">
              <Skeleton className="h-7 w-40" />
              <Skeleton className="h-8 w-24" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Skeleton className="h-28 rounded-[12px]" />
              <Skeleton className="h-28 rounded-[12px]" />
              <Skeleton className="h-28 rounded-[12px]" />
              <Skeleton className="h-28 rounded-[12px]" />
            </div>
            <Skeleton className="h-64 rounded-[12px]" />
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

