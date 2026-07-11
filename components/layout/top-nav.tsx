"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/tasks", label: "Tasks" },
  { href: "/projects", label: "Projects" },
  { href: "/calendar", label: "Calendar" },
  { href: "/habits", label: "Habits" },
  { href: "/capture", label: "Capture" },
  { href: "/coach", label: "Coach" },
  { href: "/reports", label: "Reports" },
];

export function TopNav({
  userLabel,
  signOutAction,
}: {
  userLabel: string;
  signOutAction: () => Promise<void>;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-black/10 bg-background/80 backdrop-blur dark:border-white/10">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="text-sm font-semibold">
            PersonalOS
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-md px-2.5 py-1.5 text-sm transition",
                  pathname.startsWith(item.href)
                    ? "bg-foreground/10 text-foreground"
                    : "text-foreground/60 hover:text-foreground"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/settings"
            className="text-sm text-foreground/60 hover:text-foreground"
          >
            {userLabel}
          </Link>
          <form action={signOutAction}>
            <button
              type="submit"
              className="rounded-md px-2.5 py-1.5 text-sm text-foreground/60 hover:text-foreground"
            >
              Sign out
            </button>
          </form>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex h-9 w-9 items-center justify-center rounded-md text-foreground/70 hover:bg-foreground/5 md:hidden"
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          <span className="sr-only">Toggle menu</span>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
              d="M3 5h14M3 10h14M3 15h14"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>

      {open && (
        <nav className="border-t border-black/10 px-4 pb-3 pt-2 dark:border-white/10 md:hidden">
          <div className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "rounded-md px-2.5 py-2 text-sm",
                  pathname.startsWith(item.href)
                    ? "bg-foreground/10 text-foreground"
                    : "text-foreground/60"
                )}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/settings"
              onClick={() => setOpen(false)}
              className="rounded-md px-2.5 py-2 text-sm text-foreground/60"
            >
              {userLabel}
            </Link>
            <form action={signOutAction}>
              <button
                type="submit"
                className="w-full rounded-md px-2.5 py-2 text-left text-sm text-foreground/60"
              >
                Sign out
              </button>
            </form>
          </div>
        </nav>
      )}
    </header>
  );
}
