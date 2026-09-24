"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { OutreachPerson, WeekBucket } from "@/lib/business-stats";
import { REPLIES_COLOR, SENT_COLOR, dayLabel, niceScale } from "./outreach-chart";

const rangeLabel = (iso: string) => {
  const start = new Date(iso);
  const end = new Date(start.getTime() + 6 * 86_400_000);
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", timeZone: "UTC" };
  return `${start.toLocaleDateString(undefined, opts)} – ${
    start.getUTCMonth() === end.getUTCMonth() ? end.getUTCDate() : end.toLocaleDateString(undefined, opts)
  }`;
};

const sum = (weeks: WeekBucket[], key: "sent" | "replies") => weeks.reduce((n, w) => n + w[key], 0);
const rate = (replies: number, sent: number) => (sent > 0 ? `${Math.min(100, Math.round((replies / sent) * 100))}%` : "—");

export function OutreachPanel({ weeks, people }: { weeks: WeekBucket[]; people: OutreachPerson[] }) {
  const [view, setView] = useState<"chart" | "table">("chart");
  const [personId, setPersonId] = useState("all");

  const selected = people.find((p) => p.id === personId);
  const shown = selected ? selected.weeks : weeks;
  const totalSent = sum(shown, "sent");
  const totalReplies = sum(shown, "replies");
  const empty = totalSent + totalReplies === 0;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="eyebrow">Outreach · last {weeks.length} weeks</p>
        <div role="group" aria-label="View" className="flex rounded-xl border border-border-strong bg-surface p-0.5 text-xs">
          {(["chart", "table"] as const).map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={view === v}
              onClick={() => setView(v)}
              className={cn(
                "min-h-8 rounded-[10px] px-3 capitalize transition",
                view === v ? "bg-foreground text-background" : "text-muted hover:text-foreground"
              )}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {people.length > 1 && (
        <div className="mt-3 w-full overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="group" aria-label="Show outreach by teammate">
          <div className="flex w-max gap-1.5">
            {[{ id: "all", name: "Everyone" }, ...people].map((p) => (
              <button
                key={p.id}
                type="button"
                aria-pressed={personId === p.id}
                onClick={() => setPersonId(p.id)}
                className={cn(
                  "min-h-9 max-w-40 truncate rounded-full border px-3.5 text-sm transition",
                  personId === p.id
                    ? "border-foreground bg-foreground text-background"
                    : "border-border-strong bg-surface text-foreground hover:bg-foreground/5"
                )}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* The legend doubles as the totals, so the numbers you'd otherwise hunt for sit next to the key. */}
      <ul className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-1 text-sm" aria-label="Totals">
        <li className="flex items-center gap-2">
          <span aria-hidden="true" className="h-2.5 w-2.5 rounded-sm" style={{ background: SENT_COLOR }} />
          <span className="text-muted">Sent</span>
          <span className="font-mono">{totalSent}</span>
        </li>
        <li className="flex items-center gap-2">
          <span aria-hidden="true" className="h-2.5 w-2.5 rounded-sm" style={{ background: REPLIES_COLOR }} />
          <span className="text-muted">Replies</span>
          <span className="font-mono">{totalReplies}</span>
        </li>
        <li className="text-muted">
          Reply rate <span className="font-mono text-foreground">{rate(totalReplies, totalSent)}</span>
        </li>
      </ul>

      {empty ? (
        <p className="mt-4 rounded-2xl bg-surface-sunken/60 px-4 py-10 text-center text-sm text-muted">
          {selected ? `Nothing from ${selected.name} in this period.` : "Nothing sent yet. Approved drafts, logged calls and replies show up here."}
        </p>
      ) : view === "chart" ? (
        <ChartPlot weeks={shown} />
      ) : (
        <WeekTable weeks={shown} />
      )}

      {view === "table" && !empty && !selected && people.length > 1 && <TeammateBreakdown people={people} />}
    </div>
  );
}

function ChartPlot({ weeks }: { weeks: WeekBucket[] }) {
  const max = Math.max(0, ...weeks.flatMap((w) => [w.sent, w.replies]));
  const { step, top } = niceScale(max);
  const ticks = [0, 1, 2, 3, 4].map((i) => i * step);
  const pct = (v: number) => (v / top) * 100;

  return (
    <div className="mt-4 flex gap-2">
      <div className="relative h-52 w-7 shrink-0 text-right font-mono text-[11px] text-muted-soft sm:h-60" aria-hidden="true">
        {ticks.map((t) => (
          <span key={t} className="absolute right-0 translate-y-1/2 leading-none" style={{ bottom: `${pct(t)}%` }}>
            {t.toLocaleString()}
          </span>
        ))}
      </div>

      <div className="min-w-0 flex-1">
        <div className="relative h-52 sm:h-60">
          {ticks.map((t) => (
            <div key={t} aria-hidden="true" className="absolute inset-x-0 border-t border-border-strong" style={{ bottom: `${pct(t)}%` }} />
          ))}

          <div className="absolute inset-0 flex items-stretch">
            {weeks.map((w, i) => (
              <div
                key={w.weekStart}
                tabIndex={0}
                role="img"
                aria-label={`Week of ${dayLabel(w.weekStart)}${w.partial ? " (in progress)" : ""}: ${w.sent} sent, ${w.replies} replies`}
                className="group relative flex flex-1 items-end justify-center gap-[2px] rounded-md px-0.5 outline-none hover:bg-surface-sunken/60 focus-visible:bg-surface-sunken/60"
              >
                <Bar value={w.sent} top={top} color={SENT_COLOR} partial={w.partial} />
                <Bar value={w.replies} top={top} color={REPLIES_COLOR} partial={w.partial} />

                <div
                  className={cn(
                    "pointer-events-none absolute bottom-full z-10 mb-1.5 hidden w-max min-w-36 rounded-xl border border-border-strong bg-surface px-3 py-2 text-xs shadow-lg group-hover:block group-focus-visible:block",
                    i < 2 ? "left-0" : i >= weeks.length - 2 ? "right-0" : "left-1/2 -translate-x-1/2"
                  )}
                >
                  <p className="text-muted">
                    {rangeLabel(w.weekStart)}
                    {w.partial && <span className="ml-1.5 rounded bg-surface-sunken px-1.5 py-0.5 text-[10px]">in progress</span>}
                  </p>
                  <p className="mt-1 flex items-center gap-1.5">
                    <span aria-hidden="true" className="h-2 w-2 rounded-full" style={{ background: SENT_COLOR }} />
                    Sent <span className="ml-auto pl-3 font-mono">{w.sent}</span>
                  </p>
                  <p className="flex items-center gap-1.5">
                    <span aria-hidden="true" className="h-2 w-2 rounded-full" style={{ background: REPLIES_COLOR }} />
                    Replies <span className="ml-auto pl-3 font-mono">{w.replies}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Label every other week, counting back from now so the current week always has one. */}
        <div className="mt-2 flex" aria-hidden="true">
          {weeks.map((w, i) => (
            <span key={w.weekStart} className="relative flex-1 text-center text-[11px] text-muted-soft">
              {(weeks.length - 1 - i) % 2 === 0 && (
                <span className={cn("absolute whitespace-nowrap", w.partial ? "right-0 text-foreground" : "left-1/2 -translate-x-1/2")}>
                  {w.partial ? "This wk" : dayLabel(w.weekStart)}
                </span>
              )}
              &nbsp;
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function Bar({ value, top, color, partial }: { value: number; top: number; color: string; partial: boolean }) {
  if (value === 0) return <span className="max-w-6 flex-1" />;
  return (
    <span
      className="max-w-6 flex-1 rounded-t-[4px]"
      // The week in progress is drawn lighter so an unfinished week doesn't read as a drop.
      style={{ height: `max(3px, ${(value / top) * 100}%)`, background: color, opacity: partial ? 0.55 : 1 }}
    />
  );
}

function Delta({ now, before, partial }: { now: number; before: number | null; partial: boolean }) {
  if (partial || before === null) return <span className="text-muted-soft">—</span>;
  const d = now - before;
  if (d === 0) return <span className="text-muted-soft">no change</span>;
  return (
    <span className={d > 0 ? "text-success" : "text-danger"}>
      <span aria-hidden="true" className="mr-0.5 text-[9px]">{d > 0 ? "▲" : "▼"}</span>
      <span className="sr-only">{d > 0 ? "up" : "down"} </span>
      {Math.abs(d)}
    </span>
  );
}

function WeekTable({ weeks }: { weeks: WeekBucket[] }) {
  const maxSent = Math.max(1, ...weeks.map((w) => w.sent));
  const rows = weeks.map((w, i) => ({ w, before: i > 0 ? weeks[i - 1].sent : null })).reverse(); // newest first

  return (
    <div className="mt-4 w-full overflow-x-auto">
      <table className="w-full min-w-[19rem] border-collapse text-sm">
        <caption className="sr-only">Outreach sent and replies per week</caption>
        <thead>
          <tr className="text-left text-xs text-muted">
            <th scope="col" className="pb-2 pr-3 font-normal">Week</th>
            <th scope="col" className="pb-2 pr-3 font-normal">Sent</th>
            <th scope="col" className="pb-2 pr-3 text-right font-normal">Replies</th>
            <th scope="col" className="pb-2 pr-3 text-right font-normal">Rate</th>
            <th scope="col" className="hidden pb-2 text-right font-normal sm:table-cell">vs prior</th>
          </tr>
        </thead>
        <tbody className="tabular-nums">
          {rows.map(({ w, before }) => (
            <tr key={w.weekStart} className={cn("border-t border-border-strong", w.partial && "bg-surface-sunken/50")}>
              <th scope="row" className="min-h-11 whitespace-nowrap py-2.5 pr-3 text-left font-normal">
                {rangeLabel(w.weekStart)}
                {w.partial && <span className="ml-2 rounded bg-surface-sunken px-1.5 py-0.5 text-[10px] text-muted">in progress</span>}
              </th>
              <td className="py-2.5 pr-3">
                <div className="flex items-center gap-2">
                  <span className="hidden h-1.5 w-14 overflow-hidden rounded-full bg-surface-sunken sm:block" aria-hidden="true">
                    <span className="block h-full rounded-full" style={{ width: `${(w.sent / maxSent) * 100}%`, background: SENT_COLOR }} />
                  </span>
                  <span className="font-mono">{w.sent}</span>
                </div>
              </td>
              <td className="py-2.5 pr-3 text-right font-mono">{w.replies}</td>
              <td className="py-2.5 pr-3 text-right font-mono text-muted">{rate(w.replies, w.sent)}</td>
              <td className="hidden py-2.5 text-right font-mono text-xs sm:table-cell">
                <Delta now={w.sent} before={before} partial={w.partial} />
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot className="tabular-nums">
          <tr className="border-t-2 border-border-strong font-medium">
            <th scope="row" className="py-2.5 pr-3 text-left">Total</th>
            <td className="py-2.5 pr-3 font-mono sm:pl-16">{sum(weeks, "sent")}</td>
            <td className="py-2.5 pr-3 text-right font-mono">{sum(weeks, "replies")}</td>
            <td className="py-2.5 pr-3 text-right font-mono">{rate(sum(weeks, "replies"), sum(weeks, "sent"))}</td>
            <td className="hidden sm:table-cell" />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

function TeammateBreakdown({ people }: { people: OutreachPerson[] }) {
  const totals = people.map((p) => ({ id: p.id, name: p.name, sent: sum(p.weeks, "sent"), replies: sum(p.weeks, "replies") }));
  const maxSent = Math.max(1, ...totals.map((t) => t.sent));

  return (
    <div className="mt-6 border-t border-border-strong pt-4">
      <p className="eyebrow">By teammate</p>
      <ul className="mt-3 space-y-3">
        {totals.map((t) => (
          <li key={t.id} className="flex items-center gap-3">
            <span aria-hidden="true" className="grid h-8 w-8 shrink-0 place-content-center rounded-full bg-accent-soft text-xs font-medium text-accent">
              {t.name.charAt(0).toUpperCase()}
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-baseline justify-between gap-3 text-sm">
                <span className="truncate">{t.name}</span>
                <span className="shrink-0 font-mono text-xs text-muted">
                  {t.sent} sent · {t.replies} {t.replies === 1 ? "reply" : "replies"}
                </span>
              </span>
              <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-surface-sunken">
                <span className="block h-full rounded-full" style={{ width: `${(t.sent / maxSent) * 100}%`, background: SENT_COLOR }} />
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
