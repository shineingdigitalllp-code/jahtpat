import { Skeleton } from "@/components/ui/Skeleton";

export default function ProductLoading() {
  return (
    <div aria-busy="true" aria-label="Loading" className="mx-auto min-h-dvh max-w-app bg-canvas">
      <Skeleton className="aspect-square w-full rounded-none" />
      <div className="relative -mt-7 rounded-t-[1.75rem] bg-surface px-5 pt-6">
        <div className="flex items-start justify-between gap-3">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="size-11 rounded-2xl" />
        </div>
        <Skeleton className="mt-2 h-6 w-28" />
        <Skeleton className="mt-5 h-5 w-full" />
        <Skeleton className="mt-10 h-5 w-32" />
        <Skeleton className="mt-3 h-16 w-full" />
      </div>
    </div>
  );
}
