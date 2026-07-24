"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Today" },
  { href: "/tasks", label: "Tasks" },
  { href: "/projects", label: "Projects" },
  { href: "/businesses", label: "Businesses" },
  { href: "/outreach", label: "Outreach" },
  { href: "/calendar", label: "Calendar" },
  { href: "/habits", label: "Habits" },
  { href: "/fitness", label: "Fitness" },
  { href: "/capture", label: "Capture" },
  { href: "/journal", label: "Journal" },
  { href: "/goals", label: "Goals" },
  { href: "/coach", label: "Coach" },
  { href: "/reports", label: "Reports" },
  { href: "/share-links", label: "Share" },
];

export function SidebarNav({
  userLabel,
  signOutAction,
}: {
  userLabel: string;
  signOutAction: () => Promise<void>;
}) {
  const pathname = usePathname();

  return (
    <aside
      className="hidden w-60 shrink-0 flex-col border-r border-border bg-surface/60 px-6 pb-6 pt-8 md:flex"
      style={{ paddingTop: "max(2rem, env(safe-area-inset-top))" }}
    >
      <Link href="/dashboard" className="block">
        <span className="font-serif text-2xl leading-none">PersonalOS</span>
        <span className="eyebrow mt-1 block">daily operations</span>
      </Link>

      <nav aria-label="Primary" className="mt-10 flex flex-1 flex-col gap-0.5">
        {NAV_ITEMS.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "rounded-lg px-3 py-2 text-sm transition",
                active
                  ? "bg-accent-soft font-medium text-foreground"
                  : "text-muted hover:bg-foreground/5 hover:text-foreground"
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-0.5 border-t border-border pt-4">
        <Link
          href="/settings"
          className="block rounded-lg px-3 py-2 text-sm text-muted hover:bg-foreground/5 hover:text-foreground"
        >
          {userLabel}
        </Link>
        <form action={signOutAction}>
          <button
            type="submit"
            className="w-full rounded-lg px-3 py-2 text-left text-sm text-muted hover:bg-foreground/5 hover:text-foreground"
          >
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}
