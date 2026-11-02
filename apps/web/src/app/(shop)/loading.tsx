import { Skeleton } from "@/components/ui/Skeleton";

export default function HomeLoading() {
  return (
    <div aria-busy="true" aria-label="Loading">
      <div className="bg-linear-to-b from-primary-soft to-canvas px-4 pt-4 pb-3">
        <div className="flex gap-3">
          <div className="flex-1 space-y-2 pt-1">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="mt-4 h-8 w-36" />
            <Skeleton className="h-3 w-44" />
          </div>
          <Skeleton className="size-28 rounded-3xl" />
        </div>
        <Skeleton className="mt-4 h-13 rounded-2xl" />
      </div>
      <div className="flex gap-2 overflow-hidden px-4 py-2">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className="h-[4.5rem] w-16 shrink-0 rounded-chip" />
        ))}
      </div>
      <div className="mt-2 space-y-4 px-4">
        <Skeleton className="h-40 rounded-card" />
        <Skeleton className="h-6 w-40" />
        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-52 w-34 shrink-0 rounded-card" />
          ))}
        </div>
      </div>
    </div>
  );
}
