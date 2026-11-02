'use client';

import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { AdminProductDetail } from '@jhatpat/shared';
import { ProductForm } from '@/components/features/products/ProductForm';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { apiFetch } from '@/lib/api-client';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EditProductPage({ params }: PageProps) {
  const { id } = use(params);

  const { data: product, isLoading, error } = useQuery<AdminProductDetail>({
    queryKey: ['admin', 'products', id],
    queryFn: () => apiFetch(`/api/v1/admin/products/${id}`),
    staleTime: 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-48 w-full rounded-xl" />
            <Skeleton className="h-48 w-full rounded-xl" />
            <Skeleton className="h-40 w-full rounded-xl" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-40 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <EmptyState
        title="Product not found"
        description="The product you are trying to edit does not exist or has been removed."
      />
    );
  }

  return <ProductForm initialData={product} />;
}

