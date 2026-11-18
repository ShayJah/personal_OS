import Link from "next/link";
import { cn } from "@/lib/utils";
import { GOAL_METRIC_META, GOAL_STATUS_META, type GoalPace } from "@/lib/goal-pace";
import type { GoalMetric } from "@/lib/validation/goal";

export type OutreachGoal = {
  id: string;
  title: string;
  area: string;
  horizon: string;
  metric: GoalMetric;
  current: number;
  target: number;
  pace: GoalPace;
};

const arrow = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

/**
 * The bridge to the Goals page: this week's target for the outreach goal, and
 * where the goal stands overall. The whole strip is a link to /goals.
 */
export function GoalStrip({ goal }: { goal: OutreachGoal | null }) {
  if (!goal) {
    return (
      <Link
        href="/goals?new=outreach"
        className="group flex min-h-16 flex-wrap items-center justify-between gap-x-6 gap-y-2 rounded-2xl border border-dashed border-border-strong bg-surface/60 px-5 py-4 transition hover:border-foreground/30 hover:bg-surface"
      >
        <span className="min-w-0">
          <span className="block text-sm font-medium">Give your outreach a target</span>
          <span className="mt-0.5 block text-sm text-muted">
            Set a goal like &ldquo;100 messages this quarter&rdquo; and this page will show what each week needs.
          </span>
        </span>
        <span className="inline-flex items-center gap-2 text-sm font-medium text-accent">
          Set an outreach goal {arrow}
        </span>
      </Link>
    );
  }

  const { pace } = goal;
  const meta = GOAL_STATUS_META[pace.status];
  const noun = GOAL_METRIC_META[goal.metric].noun;
  const weekPct = pace.neededThisWeek > 0 ? Math.min(100, (pace.doneThisWeek / pace.neededThisWeek) * 100) : 100;
  const weekDone = pace.doneThisWeek >= pace.neededThisWeek;

  return (
    <Link
      href="/goals"
      className="group grid gap-x-8 gap-y-4 rounded-2xl border border-border bg-surface px-5 py-4 shadow-[0_1px_2px_rgba(33,24,16,0.04)] transition hover:border-border-strong hover:shadow-md sm:px-6 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:items-center"
    >
      <span className="block">
        <span className="eyebrow block">This week</span>
        <span className="mt-1 block font-mono text-2xl">
          {pace.doneThisWeek}{" "}
          <span className="font-sans text-base text-muted">
            of {pace.neededThisWeek} {noun} needed
          </span>
        </span>
      </span>

      <span className="block" role="img" aria-label={`${pace.doneThisWeek} of ${pace.neededThisWeek} ${noun} this week`}>
        <span className="block h-2.5 overflow-hidden rounded-full bg-surface-sunken">
          <span
            className={cn("block h-full rounded-full", weekDone ? "bg-success" : "bg-warning")}
            style={{ width: `${weekPct}%` }}
          />
        </span>
        <span className="mt-1.5 block text-xs text-muted">
          {weekDone ? "This week's target is met." : `${pace.neededThisWeek - pace.doneThisWeek} to go before Sunday.`}
        </span>
      </span>

      <span className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
        <span className={cn("inline-flex h-7 items-center gap-1.5 rounded-full px-3 text-xs font-medium", meta.soft, meta.text)}>
          <span aria-hidden="true" className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
          {meta.label}
        </span>
        <span className="min-w-0 text-muted">
          <span className="capitalize">{goal.area}</span> goal ·{" "}
          <span className="font-mono text-foreground">
            {goal.current} / {goal.target}
          </span>
        </span>
        <span className="text-muted transition group-hover:translate-x-0.5 group-hover:text-foreground">{arrow}</span>
      </span>
    </Link>
  );
}
