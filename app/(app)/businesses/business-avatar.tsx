import { cn } from "@/lib/utils";

/**
 * The business's tile, in order of preference: an uploaded photo, a chosen
 * emoji (on a soft tint of the business color), or the first letter on the
 * business color (the default).
 */
export function BusinessAvatar({
  name,
  color,
  icon,
  image,
  className,
}: {
  name: string;
  color: string;
  icon?: string | null;
  image?: string | null;
  className?: string;
}) {
  const size = className ?? "h-10 w-10 text-xl";

  if (image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={image}
        alt=""
        aria-hidden="true"
        className={cn("shrink-0 rounded-xl object-cover ring-1 ring-border-strong", size)}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-grid shrink-0 place-content-center rounded-xl leading-none",
        icon ? "text-foreground" : "font-serif text-white",
        size
      )}
      style={{
        background: icon ? `color-mix(in srgb, ${color} 16%, var(--surface))` : color,
        boxShadow: icon ? `inset 0 0 0 1.5px color-mix(in srgb, ${color} 35%, transparent)` : undefined,
      }}
    >
      {icon || name.trim().charAt(0).toUpperCase() || "?"}
    </span>
  );
}
