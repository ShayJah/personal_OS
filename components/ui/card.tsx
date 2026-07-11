import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-black/10 bg-background p-5 dark:border-white/10",
        className
      )}
      {...props}
    />
  );
}
