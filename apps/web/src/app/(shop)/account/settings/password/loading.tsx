import { Skeleton } from "@/components/ui/Skeleton";

export default function PasswordLoading() {
  return (
    <div aria-busy="true" aria-label="Loading" className="space-y-3 px-4 pt-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-14 rounded-2xl" />
      <Skeleton className="h-14 rounded-2xl" />
      <Skeleton className="h-14 rounded-full" />
    </div>
  );
}
