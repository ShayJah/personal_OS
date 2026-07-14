"use client";

import Link from "next/link";
import { useState } from "react";

const MORE_ITEMS = [
  { href: "/projects", label: "Projects" },
  { href: "/coach", label: "Coach" },
  { href: "/reports", label: "Reports" },
  { href: "/share-links", label: "Share" },
  { href: "/settings", label: "Settings" },
];

export function MoreSheet({
  userLabel,
  signOutAction,
}: {
  userLabel: string;
  signOutAction: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-controls="more-sheet"
        className="flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5 text-[11px] tracking-wide text-muted"
      >
        <span className="uppercase">More</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-foreground/30"
          />
          <div
            id="more-sheet"
            role="dialog"
            aria-label="More navigation"
            className="absolute inset-x-0 bottom-0 space-y-1 rounded-t-2xl border-t border-border bg-surface p-4"
            style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
          >
            <p className="eyebrow px-2 pb-2">{userLabel}</p>
            {MORE_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="flex min-h-11 items-center rounded-lg px-3 text-sm text-foreground hover:bg-foreground/5"
              >
                {item.label}
              </Link>
            ))}
            <form action={signOutAction}>
              <button
                type="submit"
                className="flex min-h-11 w-full items-center rounded-lg px-3 text-left text-sm text-muted hover:bg-foreground/5"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
