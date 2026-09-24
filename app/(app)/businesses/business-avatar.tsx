import { cn } from "@/lib/utils";

/** Letter tile in the business's color, as in the mockups. */
export function BusinessAvatar({
  name,
  color,
  className,
}: {
  name: string;
  color: string;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-grid shrink-0 place-content-center rounded-xl font-serif text-white",
        className ?? "h-10 w-10 text-xl"
      )}
      style={{ background: color }}
    >
      {name.trim().charAt(0).toUpperCase() || "?"}
    </span>
  );
}
