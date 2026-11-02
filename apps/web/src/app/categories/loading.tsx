import { Skeleton } from "@/components/ui/Skeleton";

export default function CategoriesLoading() {
  return (
    <div aria-busy="true" aria-label="Loading">
      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3 px-4 pt-3 pb-2">
        <Skeleton className="size-11 rounded-[0.875rem]" />
        <Skeleton className="mx-auto h-10 w-36 rounded-full" />
        <Skeleton className="size-11 rounded-[0.875rem]" />
      </div>
      <div className="grid grid-cols-[4.5rem_1fr] gap-3 px-4">
        <div className="space-y-2 rounded-card bg-surface p-1.5 shadow-card">
          {Array.from({ length: 7 }, (_, index) => (
            <Skeleton key={index} className="h-[4.25rem] rounded-chip" />
          ))}
        </div>
        <div className="min-w-0 space-y-3">
          <Skeleton className="h-40 rounded-card" />
          <Skeleton className="h-12 rounded-2xl" />
          <div className="flex gap-2">
            {Array.from({ length: 3 }, (_, index) => (
              <Skeleton key={index} className="h-9 w-20 rounded-full" />
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton key={index} className="h-60 rounded-card" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
