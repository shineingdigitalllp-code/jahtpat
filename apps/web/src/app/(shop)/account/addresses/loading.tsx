import { Skeleton } from "@/components/ui/Skeleton";

export default function AddressesLoading() {
  return (
    <div aria-busy="true" aria-label="Loading" className="space-y-3 px-4 pt-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-14 rounded-full" />
      {Array.from({ length: 2 }, (_, index) => (
        <Skeleton key={index} className="h-36 rounded-card" />
      ))}
    </div>
  );
}
