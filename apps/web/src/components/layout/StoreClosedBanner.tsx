'use client';

import { useQuery } from '@tanstack/react-query';
import { Clock } from 'lucide-react';
import type { PublicStoreDto } from '@jhatpat/shared';
import { api } from '@/lib/api';

export function StoreClosedBanner() {
  const { data: store } = useQuery<PublicStoreDto>({
    queryKey: ['store', 'status'],
    queryFn: () => api<PublicStoreDto>('/store'),
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000,
  });

  if (!store || store.isOpen) {
    return null;
  }

  return (
    <div className="bg-amber-500 text-white px-4 py-2 text-xs font-medium flex items-center justify-center gap-2 text-center sticky top-0 z-50 shadow-sm animate-in fade-in">
      <Clock className="h-4 w-4 shrink-0" />
      <span>Store is currently closed. Orders and deliveries will resume shortly.</span>
    </div>
  );
}
