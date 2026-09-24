import { cn } from "@/lib/utils";
import type { WeekBucket } from "@/lib/business-stats";

// Two categorical series, checked with the dataviz validator against the
// surface (lightness band, chroma floor, CVD separation, 3:1 contrast).
export const SENT_COLOR = "#bf5730";
export const REPLIES_COLOR = "#2f7fb8";

const dayLabel = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", timeZone: "UTC" });

/** Round the top of the axis up to a clean tick step (1, 2, 5, 10, 20, 25, 50, 100…). */
function niceScale(max: number) {
  const steps = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000, 5000];
  const step = steps.find((s) => s * 4 >= max) ?? Math.ceil(max / 4);
  return { step, top: step * 4 };
}

export function OutreachChart({ weeks }: { weeks: WeekBucket[] }) {
  const max = Math.max(0, ...weeks.flatMap((w) => [w.sent, w.replies]));
  const total = weeks.reduce((n, w) => n + w.sent + w.replies, 0);

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <p className="eyebrow">Outreach · last {weeks.length} weeks</p>
        <ul className="flex items-center gap-4 text-xs text-muted" aria-label="Legend">
          <li className="flex items-center gap-1.5">
            <span aria-hidden="true" className="h-2.5 w-2.5 rounded-sm" style={{ background: SENT_COLOR }} />
            Sent
          </li>
          <li className="flex items-center gap-1.5">
            <span aria-hidden="true" className="h-2.5 w-2.5 rounded-sm" style={{ background: REPLIES_COLOR }} />
            Replies
          </li>
        </ul>
      </div>

      {total === 0 ? (
        <p className="mt-6 rounded-2xl bg-surface-sunken/60 px-4 py-10 text-center text-sm text-muted">
          Nothing sent yet. Approved drafts, logged calls and replies show up here.
        </p>
      ) : (
        <ChartPlot weeks={weeks} top={niceScale(max).top} step={niceScale(max).step} />
      )}

      <details className="mt-3 text-xs text-muted">
        <summary className="inline-flex min-h-8 cursor-pointer items-center hover:text-foreground">
          View as table
        </summary>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-muted-soft">
                <th className="py-1 pr-4 font-normal">Week of</th>
                <th className="py-1 pr-4 font-normal">Sent</th>
                <th className="py-1 font-normal">Replies</th>
              </tr>
            </thead>
            <tbody>
              {weeks.map((w) => (
                <tr key={w.weekStart} className="border-t border-border-strong">
                  <td className="py-1 pr-4">{dayLabel(w.weekStart)}</td>
                  <td className="py-1 pr-4 font-mono">{w.sent}</td>
                  <td className="py-1 font-mono">{w.replies}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}

function ChartPlot({ weeks, top, step }: { weeks: WeekBucket[]; top: number; step: number }) {
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
            <div
              key={t}
              aria-hidden="true"
              className="absolute inset-x-0 border-t border-border-strong"
              style={{ bottom: `${pct(t)}%` }}
            />
          ))}

          <div className="absolute inset-0 flex items-stretch">
            {weeks.map((w, i) => (
              <div
                key={w.weekStart}
                tabIndex={0}
                role="img"
                aria-label={`Week of ${dayLabel(w.weekStart)}: ${w.sent} sent, ${w.replies} replies`}
                className="group relative flex flex-1 items-end justify-center gap-[2px] rounded-md px-0.5 outline-none hover:bg-surface-sunken/60 focus-visible:bg-surface-sunken/60"
              >
                <Bar value={w.sent} top={top} color={SENT_COLOR} />
                <Bar value={w.replies} top={top} color={REPLIES_COLOR} />

                <div
                  className={cn(
                    "pointer-events-none absolute bottom-full z-10 mb-1.5 hidden w-max rounded-xl border border-border-strong bg-surface px-3 py-2 text-xs shadow-lg group-hover:block group-focus-visible:block",
                    i < 2 ? "left-0" : i >= weeks.length - 2 ? "right-0" : "left-1/2 -translate-x-1/2"
                  )}
                >
                  <p className="text-muted">Week of {dayLabel(w.weekStart)}</p>
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

        <div className="mt-2 flex" aria-hidden="true">
          {weeks.map((w, i) => (
            <span key={w.weekStart} className="relative flex-1 text-center text-[11px] text-muted-soft">
              {i % 2 === 0 && <span className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap">{dayLabel(w.weekStart)}</span>}
              &nbsp;
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function Bar({ value, top, color }: { value: number; top: number; color: string }) {
  if (value === 0) return <span className="w-full max-w-6 flex-1" />;
  return (
    <span
      className="w-full max-w-6 flex-1 rounded-t-[4px]"
      style={{ height: `max(3px, ${(value / top) * 100}%)`, background: color, flex: "1 1 0" }}
    />
  );
}

/** Tiny bars for the business cards: sent per week, current week in the accent. */
export function MiniBars({ weeks }: { weeks: WeekBucket[] }) {
  const max = Math.max(1, ...weeks.map((w) => w.sent));
  const label = weeks.map((w) => `${dayLabel(w.weekStart)}: ${w.sent}`).join(", ");
  return (
    <div className="flex h-10 items-end gap-1" role="img" aria-label={`Sent per week — ${label}`}>
      {weeks.map((w, i) => {
        const current = i === weeks.length - 1;
        return (
          <span
            key={w.weekStart}
            className="w-3 rounded-t-[3px]"
            style={{
              height: `max(3px, ${(w.sent / max) * 100}%)`,
              background: current ? SENT_COLOR : "var(--muted-soft)",
              opacity: current ? 1 : 0.55,
            }}
          />
        );
      })}
    </div>
  );
}
