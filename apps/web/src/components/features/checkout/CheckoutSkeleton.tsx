import { Skeleton } from "@/components/ui/Skeleton";

export function CheckoutSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading" className="space-y-3 px-4">
      <Skeleton className="h-24 rounded-card" />
      <Skeleton className="h-32 rounded-card" />
      <Skeleton className="h-16 rounded-card" />
      <Skeleton className="h-96 rounded-card" />
    </div>
  );
}
