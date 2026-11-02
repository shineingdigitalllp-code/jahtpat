import { Skeleton } from "@/components/ui/Skeleton";

export default function AccountLoading() {
  return (
    <div aria-busy="true" aria-label="Loading" className="space-y-3 px-4 pt-4">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-24 rounded-card" />
      <div className="grid grid-cols-3 gap-2">
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton key={index} className="h-24 rounded-card" />
        ))}
      </div>
      <Skeleton className="h-[28rem] rounded-card" />
    </div>
  );
}
