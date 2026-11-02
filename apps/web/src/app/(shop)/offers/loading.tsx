import { Skeleton } from "@/components/ui/Skeleton";

export default function OffersLoading() {
  return (
    <div aria-busy="true" aria-label="Loading" className="space-y-3 px-4 pt-3">
      <Skeleton className="h-11 w-full" />
      <Skeleton className="h-7 w-28" />
      <Skeleton className="h-4 w-56" />
      <Skeleton className="h-40 rounded-card" />
      <div className="flex gap-2">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-9 w-24 shrink-0 rounded-full" />
        ))}
      </div>
      {Array.from({ length: 3 }, (_, index) => (
        <Skeleton key={index} className="h-26 rounded-card" />
      ))}
    </div>
  );
}
