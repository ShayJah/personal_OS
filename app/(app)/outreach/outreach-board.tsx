"use client";

import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { BoardStageKey, OutreachCard, OutreachColumn } from "@/lib/outreach-board";

const DOT: Record<BoardStageKey, string> = {
  to_contact: "bg-muted-soft",
  drafted: "bg-warning",
  sent: "bg-info",
  replied: "bg-success",
  meeting: "bg-violet",
};

const INITIAL = 4;

function Card({ card }: { card: OutreachCard }) {
  return (
    <li className="group relative flex flex-col gap-2 rounded-2xl border border-border bg-surface p-3.5 transition motion-safe:hover:-translate-y-0.5 hover:border-border-strong hover:shadow-md">
      <Link href={card.href} className="text-sm font-medium leading-snug after:absolute after:inset-0 after:rounded-2xl focus-visible:after:ring-2 focus-visible:after:ring-accent">
        {card.title}
      </Link>
      {card.subtitle && <p className="-mt-1 truncate text-xs text-muted">{card.subtitle}</p>}
      <Link
        href={`/businesses/${card.business.id}`}
        className="relative z-10 inline-flex min-h-8 max-w-full items-center gap-1.5 self-start rounded-full border border-border bg-surface-sunken/60 px-2.5 text-xs transition hover:border-border-strong hover:bg-surface-sunken"
      >
        <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: card.business.color }} />
        <span className="truncate">{card.business.name}</span>
      </Link>
      <p className={cn("text-xs", card.stale ? "text-warning" : "text-muted")}>{card.meta}</p>
      {card.action && (
        <span className="mt-0.5 inline-flex min-h-8 items-center self-start rounded-lg border border-border-strong px-3 text-xs font-medium transition group-hover:bg-foreground group-hover:text-background">
          {card.action}
        </span>
      )}
    </li>
  );
}

function Column({ column, moreHref, className }: { column: OutreachColumn; moreHref: string; className?: string }) {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? column.cards : column.cards.slice(0, INITIAL);
  const hiddenLoaded = column.cards.length - shown.length;
  const beyondLoaded = column.total - column.cards.length;

  return (
    <section aria-label={`${column.label}, ${column.total}`} className={cn("min-w-0 flex-col gap-2.5 rounded-2xl border border-border bg-surface-sunken/50 p-3", className)}>
      <h2 className="hidden items-center justify-between px-1 pt-0.5 !font-sans text-sm font-semibold xl:flex">
        <span className="flex items-center gap-2">
          <span aria-hidden="true" className={cn("h-2 w-2 rounded-full", DOT[column.key])} />
          {column.label}
        </span>
        <span className="font-mono text-xs font-normal text-muted">{column.total}</span>
      </h2>

      {column.cards.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border-strong px-3 py-6 text-center text-sm text-muted">Nothing here yet.</p>
      ) : (
        <ul className="grid gap-2.5 md:grid-cols-2 xl:grid-cols-1">
          {shown.map((card) => (
            <Card key={card.id} card={card} />
          ))}
        </ul>
      )}

      {hiddenLoaded > 0 && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="min-h-11 rounded-xl border border-dashed border-border-strong text-sm text-muted transition hover:bg-surface hover:text-foreground"
        >
          Show {hiddenLoaded} more
        </button>
      )}
      {expanded && beyondLoaded > 0 && (
        <Link href={moreHref} className="flex min-h-11 items-center justify-center rounded-xl text-sm text-accent hover:underline">
          {beyondLoaded} more in the business pipeline
        </Link>
      )}
    </section>
  );
}

/**
 * Five pipeline columns on wide screens. Below that, the stage pills switch a
 * single column so cards keep a readable width on phones and tablets.
 */
export function OutreachBoard({ columns, moreHref }: { columns: OutreachColumn[]; moreHref: string }) {
  const [active, setActive] = useState<BoardStageKey>(
    () => columns.find((c) => c.key === "drafted" && c.total > 0)?.key ?? columns.find((c) => c.total > 0)?.key ?? "to_contact"
  );

  return (
    <div>
      <div role="group" aria-label="Pipeline stage" className="mb-3 flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] xl:hidden [&::-webkit-scrollbar]:hidden">
        {columns.map((c) => (
          <button
            key={c.key}
            type="button"
            aria-pressed={active === c.key}
            onClick={() => setActive(c.key)}
            className={cn(
              "inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-4 text-sm transition",
              active === c.key ? "border-foreground bg-foreground text-background" : "border-border-strong bg-surface hover:bg-foreground/5"
            )}
          >
            <span aria-hidden="true" className={cn("h-1.5 w-1.5 rounded-full", DOT[c.key])} />
            {c.label}
            <span className={cn("font-mono text-xs", active === c.key ? "text-background/70" : "text-muted")}>{c.total}</span>
          </button>
        ))}
      </div>

      <div className="xl:grid xl:grid-cols-5 xl:items-start xl:gap-3.5">
        {columns.map((c) => (
          <Column key={c.key} column={c} moreHref={moreHref} className={active === c.key ? "flex" : "hidden xl:flex"} />
        ))}
      </div>
    </div>
  );
}
