import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "outline";
  size?: "sm" | "md";
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-lg font-medium tracking-tight transition disabled:opacity-40 active:scale-[0.98]",
        size === "md" && "min-h-11 px-4 py-2 text-sm",
        size === "sm" && "min-h-9 px-3 py-1.5 text-xs",
        variant === "primary" &&
          "bg-foreground text-background shadow-[0_1px_0_rgba(0,0,0,0.05)] hover:bg-foreground/85",
        variant === "ghost" &&
          "text-muted hover:bg-foreground/5 hover:text-foreground",
        variant === "outline" &&
          "border border-border-strong text-foreground hover:bg-foreground/5",
        className
      )}
      {...props}
    />
  );
}
