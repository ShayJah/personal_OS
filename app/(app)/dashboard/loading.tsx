import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-5">
      <Skeleton className="h-14 w-56" />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_21rem]">
        <Skeleton className="h-[34rem] w-full rounded-3xl" />
        <div className="space-y-5">
          <Skeleton className="h-44 w-full rounded-3xl" />
          <Skeleton className="h-44 w-full rounded-3xl" />
        </div>
      </div>
    </div>
  );
}
