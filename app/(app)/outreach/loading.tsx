import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-[90rem] space-y-5">
      <Skeleton className="h-16 w-56" />
      <Skeleton className="h-20 w-full rounded-2xl" />
      <Skeleton className="h-10 w-2/3" />
      <div className="grid gap-3.5 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-72 w-full rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
