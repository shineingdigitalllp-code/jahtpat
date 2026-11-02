import { Skeleton } from "@/components/ui/Skeleton";

export default function OrdersLoading() {
  return (
    <div aria-busy="true" aria-label="Loading" className="space-y-3 px-4 pt-4">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-12 rounded-2xl" />
      <Skeleton className="h-96 rounded-card" />
      <Skeleton className="h-48 rounded-card" />
    </div>
  );
}
