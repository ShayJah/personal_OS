import { cn } from "@/lib/utils";

/** The Shay diamond: two nested bands around a caramel core. Rings follow the text colour. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" className={cn("size-8", className)}>
      <path
        fill="currentColor"
        d="M50 2L98 50L50 98L2 50ZM50 11L11 50L50 89L89 50ZM50 19L81 50L50 81L19 50ZM50 28L28 50L50 72L72 50Z"
      />
      <path fill="var(--caramel)" d="M50 36L64 50L50 64L36 50Z" />
    </svg>
  );
}
