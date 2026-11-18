import type { WeekBucket } from "@/lib/business-stats";

// Two categorical series, checked with the dataviz validator against the
// surface (lightness band, chroma floor, CVD separation, 3:1 contrast).
export const SENT_COLOR = "#bf5730";
export const REPLIES_COLOR = "#2f7fb8";

export const dayLabel = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", timeZone: "UTC" });

/** Round the top of the axis up to a clean tick step (1, 2, 5, 10, 20, 25, 50, 100…). */
export function niceScale(max: number) {
  const steps = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000, 5000];
  const step = steps.find((s) => s * 4 >= max) ?? Math.ceil(max / 4);
  return { step, top: step * 4 };
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
