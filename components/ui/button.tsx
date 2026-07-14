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
        "inline-flex items-center justify-center rounded-lg font-medium transition disabled:opacity-50",
        size === "md" && "px-3.5 py-2 text-sm",
        size === "sm" && "px-2.5 py-1.5 text-xs",
        variant === "primary" &&
          "bg-foreground text-background hover:opacity-90",
        variant === "ghost" &&
          "text-foreground/70 hover:bg-foreground/5 hover:text-foreground",
        variant === "outline" &&
          "border border-foreground/20 text-foreground hover:bg-foreground/5",
        className
      )}
      {...props}
    />
  );
}
