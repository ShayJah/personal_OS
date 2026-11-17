import { cn } from "@/lib/utils";
import { readinessBand, type Band } from "@/lib/study/plan";

/* Small, dependency-free SVG visuals for the study page. Theme tokens only; no course data lives here. */

const BAND_STROKE: Record<Band, string> = { red: "stroke-danger", amber: "stroke-warning", green: "stroke-success", strong: "stroke-foreground" };
export const BAND_TILE: Record<Band, string> = { red: "bg-danger-soft", amber: "bg-warning-soft", green: "bg-success-soft", strong: "bg-success text-background" };
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** "2026-12-13" -> "Sun Dec 13". Pure string/UTC math, so no timezone drift. */
export function shortDate(iso: string, withDow = false): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return iso;
  const dow = DOW[new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])).getUTCDay()];
  return `${withDow ? dow + " " : ""}${MONTHS[+m[2] - 1]} ${+m[3]}`;
}

export type TimelineItem = { id: string; label: string; date: string; days: number; verified: boolean };

/** One axis from today to the last exam. Filled dot = verified date, hollow = unverified. Stems are staggered so close dates never collide. */
export function ExamTimeline({ items }: { items: TimelineItem[] }) {
  const live = items.filter((i) => i.days >= 0).sort((a, b) => a.days - b.days);
  if (!live.length) return null;
  const max = Math.max(...live.map((i) => i.days), 1);
  const W = 720, L = 28, R = 692, AX = 112;
  const x = (d: number) => L + ((R - L) * d) / max;
  const rise = [34, 62, 90];
  return (
    <div className="overflow-x-auto">
      <svg role="img" aria-labelledby="exam-tl-t" viewBox={`0 0 ${W} 150`} className="h-auto min-w-[560px] w-full">
        <title id="exam-tl-t">Exam timeline from today to the last exam</title>
        <line x1={L} x2={R} y1={AX} y2={AX} pathLength={1} className="study-draw stroke-border-strong" strokeWidth={2} />
        {live.map((i, k) => {
          const px = x(i.days), top = AX - rise[k % 3];
          const anchor = px > R - 50 ? "end" : "start";
          const tx = anchor === "end" ? px - 6 : px + 6;
          return (
            <g key={i.id} className="study-rise" style={{ "--d": `${0.15 + k * 0.08}s` } as React.CSSProperties}>
              <line x1={px} x2={px} y1={top} y2={AX} className="stroke-border-strong" strokeWidth={1} />
              <text x={tx} y={top + 4} textAnchor={anchor} className="fill-foreground text-[12px] font-semibold">{i.label}</text>
              <text x={tx} y={top + 17} textAnchor={anchor} className="fill-muted text-[11px]">{shortDate(i.date)} · {i.days === 0 ? "today" : `${i.days} d`}</text>
              <circle cx={px} cy={AX} r={6} className={cn("stroke-foreground", i.verified ? "fill-foreground" : "fill-surface")} strokeWidth={2} />
            </g>
          );
        })}
        <circle cx={L} cy={AX} r={5} className="fill-accent" />
        <text x={L} y={AX + 22} className="fill-accent text-[11px] font-semibold">today</text>
        <circle cx={W - 140} cy={140} r={4} className="fill-foreground" /><text x={W - 132} y={144} className="fill-muted text-[10px]">verified</text>
        <circle cx={W - 70} cy={140} r={4} className="fill-surface stroke-foreground" strokeWidth={1.5} /><text x={W - 62} y={144} className="fill-muted text-[10px]">unverified</text>
      </svg>
    </div>
  );
}

/** Ring gauge. value is 0-100, or null for "no reading yet" (empty track, dash in the centre). */
export function Ring({ value, label, sub, stroke = "stroke-accent", size = 64 }: { value: number | null; label: string; sub?: string; stroke?: string; size?: number }) {
  const r = 24, C = 2 * Math.PI * r, v = value === null ? 0 : Math.max(0, Math.min(100, value));
  return (
    <div className="flex items-center gap-2">
      <svg role="img" aria-label={`${label}: ${value === null ? "no reading yet" : Math.round(v) + "%"}`} width={size} height={size} viewBox="0 0 64 64">
        <circle cx={32} cy={32} r={r} fill="none" className="stroke-surface-sunken" strokeWidth={7} />
        {v > 0 && <circle cx={32} cy={32} r={r} fill="none" strokeWidth={7} strokeLinecap="round" strokeDasharray={`${(C * v) / 100} ${C}`} transform="rotate(-90 32 32)" className={cn(stroke, "study-ring")} style={{ "--c": C } as React.CSSProperties} />}
        <text x={32} y={36} textAnchor="middle" className="fill-foreground text-[14px] font-semibold">{value === null ? "–" : Math.round(v)}</text>
      </svg>
      <div className="leading-tight"><p className="text-xs font-medium">{label}</p>{sub && <p className="text-[11px] text-muted">{sub}</p>}</div>
    </div>
  );
}

/** Score ring colour follows the readiness band; null band = muted (not enough auto-marked attempts). */
export const scoreStroke = (b: Band | null) => (b ? BAND_STROKE[b] : "stroke-muted-soft");

/** Four-block day ring: one arc per block, filled when done. Centre shows blocks done. */
export function DayRing({ blocks }: { blocks: Array<{ title: string; done: boolean }> }) {
  const r = 34, C = 2 * Math.PI * r, n = blocks.length || 1, seg = C / n, gap = 5;
  const done = blocks.filter((b) => b.done).length;
  return (
    <svg role="img" aria-label={`${done} of ${blocks.length} blocks done today`} width={88} height={88} viewBox="0 0 88 88">
      {blocks.map((b, i) => (
        <circle key={b.title} cx={44} cy={44} r={r} fill="none" strokeWidth={9} strokeDasharray={`${seg - gap} ${C - seg + gap}`} strokeDashoffset={-i * seg} transform="rotate(-90 44 44)" className={cn(b.done ? "stroke-success study-ring" : "stroke-surface-sunken")} style={{ "--c": C, "--d": `${i * 0.12}s` } as React.CSSProperties} />
      ))}
      <text x={44} y={50} textAnchor="middle" className="fill-foreground text-[18px] font-semibold">{done}/{blocks.length}</text>
    </svg>
  );
}

export type MapTile = { id: string; title: string; autoAvg: number | null; autoN: number; selfAvg: number | null; selfN: number };

/** Topic heatmap tile grid for one course. Colour is the readiness band; dashed = nothing tried; plain = under 5 auto-marked attempts. */
export function MasteryMap({ tiles }: { tiles: MapTile[] }) {
  return (
    <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-4">
      {tiles.map((t, i) => {
        const band = readinessBand(t.autoAvg, t.autoN);
        const untouched = t.autoN + t.selfN === 0;
        const pct = (x: number | null) => (x === null ? "–" : `${Math.round(x * 100)}%`);
        return (
          <div key={t.id} title={`${t.title}: auto ${pct(t.autoAvg)} (n=${t.autoN}), self ${pct(t.selfAvg)} (n=${t.selfN})`}
            style={{ "--d": `${Math.min(i, 12) * 0.03}s` } as React.CSSProperties} className={cn("study-rise rounded-lg border px-2.5 py-2", band ? cn(BAND_TILE[band], "border-transparent") : untouched ? "border-dashed border-border-strong" : "border-border bg-surface")}>
            <p className="truncate text-xs font-medium">{t.title}</p>
            <p className="text-[11px] opacity-80">{band ? pct(t.autoAvg) : t.autoN ? `${t.autoN}/5 tries` : untouched ? "untried" : "self only"}{t.selfN ? ` · self ${pct(t.selfAvg)}` : ""}</p>
          </div>
        );
      })}
    </div>
  );
}

export function MapLegend() {
  const items: Array<[string, string]> = [["border border-dashed border-border-strong", "untried"], ["border border-border bg-surface", "under 5 tries"], ["bg-danger-soft", "<50%"], ["bg-warning-soft", "50-69%"], ["bg-success-soft", "70-84%"], ["bg-success", "85%+"]];
  return <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted">{items.map(([c, l]) => <span key={l} className="flex items-center gap-1"><span className={cn("inline-block h-3 w-3 rounded", c)} />{l}</span>)}</div>;
}
