import { Card } from "@/components/ui/card";
import type { OutreachStats } from "@/lib/crm";

// Validated categorical palette (dataviz skill) — only the first 3 slots
// clear all-pairs CVD separation, which a pie/donut needs since every
// segment sits adjacent to every other. A 4th+ contributor folds into a
// neutral "Other" bucket rather than generating a new hue.
const SERIES_COLORS = ["#2a78d6", "#eb6834", "#1baf7a"];
const OTHER_COLOR = "#b8ab99"; // --muted-soft — neutral, never confused with a real series

const SIZE = 160;
const STROKE = 22;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const GAP = 3;

export function OutreachStatsCard({ stats }: { stats: OutreachStats }) {
  const { totalLeads, totalActivities, won, byUser } = stats;

  const top = byUser.slice(0, 3);
  const otherCount = byUser.slice(3).reduce((sum, u) => sum + u.count, 0);
  const segments = [
    ...top.map((u, i) => ({ name: u.name, count: u.count, color: SERIES_COLORS[i] })),
    ...(otherCount > 0 ? [{ name: "Other", count: otherCount, color: OTHER_COLOR }] : []),
  ];

  let cumulative = 0;
  const arcs = segments.map((seg) => {
    const trueLength = totalActivities > 0 ? (seg.count / totalActivities) * CIRCUMFERENCE : 0;
    const visibleLength = Math.max(trueLength - GAP, 0);
    const offset = cumulative;
    cumulative += trueLength;
    return { ...seg, visibleLength, offset };
  });

  return (
    <Card className="space-y-4">
      <div>
        <p className="eyebrow">Team performance</p>
        <p className="mt-1 text-sm text-muted">Who&apos;s reaching out, and how the pipeline&apos;s doing.</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <p className="text-2xl font-semibold">{totalLeads}</p>
          <p className="text-xs text-muted">Leads</p>
        </div>
        <div>
          <p className="text-2xl font-semibold">{totalActivities}</p>
          <p className="text-xs text-muted">Touches logged</p>
        </div>
        <div>
          <p className="text-2xl font-semibold">{won}</p>
          <p className="text-xs text-muted">Won</p>
        </div>
      </div>

      {totalActivities === 0 ? (
        <p className="text-sm text-muted">No activity logged yet — this fills in as the team reaches out.</p>
      ) : (
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
          <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} role="img" aria-label="Outreach by teammate">
            <g transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}>
              <circle
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={RADIUS}
                fill="none"
                stroke="var(--border-strong)"
                strokeWidth={STROKE}
              />
              {arcs.map((arc) => (
                <circle
                  key={arc.name}
                  cx={SIZE / 2}
                  cy={SIZE / 2}
                  r={RADIUS}
                  fill="none"
                  stroke={arc.color}
                  strokeWidth={STROKE}
                  strokeDasharray={`${arc.visibleLength} ${CIRCUMFERENCE - arc.visibleLength}`}
                  strokeDashoffset={-arc.offset}
                  strokeLinecap="butt"
                >
                  <title>
                    {arc.name}: {arc.count} ({Math.round((arc.count / totalActivities) * 100)}%)
                  </title>
                </circle>
              ))}
            </g>
          </svg>

          {/* Legend — also the table-view fallback: every value here, not hover-only. */}
          <ul className="w-full space-y-1.5 text-sm">
            {arcs.map((arc) => (
              <li key={arc.name} className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 truncate">
                  <span
                    className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: arc.color }}
                  />
                  <span className="truncate">{arc.name}</span>
                </span>
                <span className="shrink-0 text-muted">
                  {arc.count} · {Math.round((arc.count / totalActivities) * 100)}%
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}
