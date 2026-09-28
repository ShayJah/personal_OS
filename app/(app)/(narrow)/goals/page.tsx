import Link from "next/link";
import { requireSession } from "@/lib/auth/dal";
import { listGoals } from "@/lib/goals";
import { withLiveProgress } from "@/lib/goal-progress";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";
import { GoalRow } from "./goal-row";
import { NewGoalForm, type GoalPrefill } from "./new-goal-form";

const OUTREACH_PREFILL: GoalPrefill = {
  title: "Send 100 outreach messages",
  horizon: "quarter",
  area: "outreach",
  metric: "sends",
  target: 100,
};

const chip = "inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full border px-4 text-sm capitalize transition";

export default async function GoalsPage({
  searchParams,
}: {
  searchParams: Promise<{ area?: string; new?: string }>;
}) {
  const session = await requireSession();
  const { area: areaParam, new: newParam } = await searchParams;
  const rawGoals = await listGoals(session.user.id);

  const goals = await withLiveProgress(
    session.user.id,
    rawGoals.map((g) => ({
      ...g,
      targetValue: g.targetValue ? Number(g.targetValue) : null,
      currentValue: g.currentValue ? Number(g.currentValue) : null,
    }))
  );

  const areaCounts = new Map<string, number>();
  for (const g of goals) areaCounts.set(g.area, (areaCounts.get(g.area) ?? 0) + 1);
  const areas = [...areaCounts.keys()].sort((a, b) => (areaCounts.get(b)! - areaCounts.get(a)!) || a.localeCompare(b));
  const activeArea = areaParam && areaCounts.has(areaParam) ? areaParam : null;

  const shown = activeArea ? goals.filter((g) => g.area === activeArea) : goals;
  const yearGoals = shown.filter((g) => g.horizon === "year");
  const quarterGoals = shown.filter((g) => g.horizon === "quarter");
  const hasTracked = goals.some((g) => g.metric);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="eyebrow">Aim</p>
          <h1 className="mt-1 font-serif text-3xl">Goals</h1>
          <p className="mt-1 text-sm text-muted">What you&apos;re working toward.</p>
        </div>
        <NewGoalForm areas={areas} prefill={newParam === "outreach" ? OUTREACH_PREFILL : undefined} />
      </div>

      {areas.length > 1 && (
        <nav aria-label="Filter by category" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <Link
            href="/goals"
            aria-current={!activeArea ? "true" : undefined}
            className={cn(chip, "normal-case", !activeArea ? "border-foreground bg-foreground text-background" : "border-border-strong bg-surface hover:bg-foreground/5")}
          >
            All <span className={cn("font-mono text-xs", !activeArea ? "text-background/70" : "text-muted")}>{goals.length}</span>
          </Link>
          {areas.map((a) => (
            <Link
              key={a}
              href={`/goals?area=${encodeURIComponent(a)}`}
              aria-current={activeArea === a ? "true" : undefined}
              className={cn(chip, activeArea === a ? "border-foreground bg-foreground text-background" : "border-border-strong bg-surface hover:bg-foreground/5")}
            >
              {a} <span className={cn("font-mono text-xs", activeArea === a ? "text-background/70" : "text-muted")}>{areaCounts.get(a)}</span>
            </Link>
          ))}
        </nav>
      )}

      {goals.length > 0 && !hasTracked && (
        <Link
          href="/goals?new=outreach"
          className="flex min-h-14 flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-2xl border border-dashed border-border-strong bg-surface/60 px-4 py-3 text-sm transition hover:border-foreground/30 hover:bg-surface"
        >
          <span>
            <span className="font-medium">Track outreach automatically.</span>{" "}
            <span className="text-muted">Set a target for messages sent and the Outreach board keeps the weekly pace.</span>
          </span>
          <span className="font-medium text-accent">Add an outreach goal →</span>
        </Link>
      )}

      {goals.length === 0 ? (
        <EmptyState title="No goals yet" description="Set a year or quarter goal to give your priorities direction." />
      ) : shown.length === 0 ? (
        <EmptyState title="Nothing in this category" description="Pick another category above." />
      ) : (
        <div className="space-y-8">
          {yearGoals.length > 0 && (
            <div className="space-y-2">
              <p className="eyebrow">Year</p>
              {yearGoals.map((goal) => (
                <GoalRow key={goal.id} goal={goal} areas={areas} />
              ))}
            </div>
          )}
          {quarterGoals.length > 0 && (
            <div className="space-y-2">
              <p className="eyebrow">Quarter</p>
              {quarterGoals.map((goal) => (
                <GoalRow key={goal.id} goal={goal} areas={areas} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
