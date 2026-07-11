import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost";
};

export function Button({
  className,
  variant = "primary",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-lg px-3.5 py-2 text-sm font-medium transition disabled:opacity-50",
        variant === "primary" &&
          "bg-foreground text-background hover:opacity-90",
        variant === "ghost" &&
          "text-foreground/70 hover:bg-foreground/5 hover:text-foreground",
        className
      )}
      {...props}
    />
  );
}
