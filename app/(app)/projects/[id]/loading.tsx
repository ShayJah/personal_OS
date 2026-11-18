import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-5">
      <Skeleton className="h-10 w-40" />
      <Skeleton className="h-14 w-96 max-w-full" />
      <Skeleton className="h-24 w-full rounded-3xl" />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-11 w-full" />
          ))}
        </div>
        <Skeleton className="h-52 w-full rounded-3xl" />
      </div>
    </div>
  );
}
