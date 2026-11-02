import { Skeleton } from "@/components/ui/Skeleton";

export default function ProfileLoading() {
  return (
    <div aria-busy="true" aria-label="Loading" className="space-y-3 px-4 pt-4">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="mx-auto my-4 size-20 rounded-3xl" />
      {Array.from({ length: 3 }, (_, index) => (
        <Skeleton key={index} className="h-14 rounded-2xl" />
      ))}
    </div>
  );
}
