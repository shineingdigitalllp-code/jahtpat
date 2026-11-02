"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import type { ProductFilters, ProductPage } from "@jhatpat/shared";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { api } from "@/lib/api";
import { toQueryString } from "@/lib/utils";
import { ProductCard } from "./ProductCard";

type ProductGridProps = { filters: ProductFilters; initialPage: ProductPage };

export function ProductGrid({ filters, initialPage }: ProductGridProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const { data, hasNextPage, fetchNextPage, isFetchingNextPage, isError } = useInfiniteQuery({
    queryKey: ["products", filters],
    queryFn: ({ pageParam }) => api<ProductPage>(`/products?${toQueryString({ ...filters, cursor: pageParam })}`),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (page) => page.nextCursor ?? undefined,
    initialData: { pages: [initialPage], pageParams: [undefined] },
  });

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasNextPage) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && !isFetchingNextPage) void fetchNextPage();
      },
      { rootMargin: "400px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const products = data.pages.flatMap((page) => page.items);

  if (products.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="font-display text-lg font-semibold">No products found</p>
        <p className="mt-1 text-sm text-muted">Try a different search or filter.</p>
      </div>
    );
  }

  return (
    <>
      <ul className="grid grid-cols-[repeat(2,minmax(0,1fr))] gap-3">
        {products.map((product) => (
          <li key={product.id} className="grid">
            <ProductCard product={product} />
          </li>
        ))}
        {isFetchingNextPage &&
          Array.from({ length: 2 }, (_, index) => (
            <li key={index}>
              <Skeleton className="h-60 rounded-card" />
            </li>
          ))}
      </ul>
      {isError && (
        <div className="mt-4 text-center">
          <Button variant="outline" size="sm" onClick={() => void fetchNextPage()}>
            Couldn&apos;t load more. Retry
          </Button>
        </div>
      )}
      <div ref={sentinelRef} aria-hidden />
    </>
  );
}
