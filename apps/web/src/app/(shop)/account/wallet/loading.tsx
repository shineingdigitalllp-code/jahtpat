import { Skeleton } from "@/components/ui/Skeleton";

export default function WalletLoading() {
  return (
    <div aria-busy="true" aria-label="Loading" className="space-y-5 px-4 pt-4">
      <Skeleton className="h-14 rounded-b-[1.75rem]" />
      <Skeleton className="h-36 rounded-card" />
      <Skeleton className="h-48 rounded-card" />
    </div>
  );
}
