import "server-only";
import type { GoalMetric } from "@/lib/validation/goal";
import { listAccessibleBusinesses } from "@/lib/crm";
import { getOutreachTotals, type OutreachTotals } from "@/lib/business-stats";
import { computeGoalPace, goalPeriod, isGoalMetric, type GoalPace } from "@/lib/goal-pace";

export type GoalWithProgress<G> = G & {
  metric: GoalMetric | null;
  /** Live count for auto-tracked goals, else the number typed on the goal. */
  liveCurrent: number | null;
  pace: GoalPace | null;
};

/**
 * Auto-tracked goals (metric set) get their current value counted from outreach
 * so it can't go stale; the rest keep whatever was typed.
 */
export async function withLiveProgress<
  G extends { horizon: string; metric: string | null; targetValue: number | null; currentValue: number | null },
>(userId: string, goals: G[]): Promise<GoalWithProgress<G>[]> {
  const tracked = goals.filter((g) => isGoalMetric(g.metric));
  const totalsByHorizon = new Map<string, OutreachTotals>();

  if (tracked.length > 0) {
    const businessIds = (await listAccessibleBusinesses(userId)).map((b) => b.id);
    for (const horizon of new Set(tracked.map((g) => g.horizon))) {
      totalsByHorizon.set(horizon, await getOutreachTotals(businessIds, goalPeriod(horizon).start));
    }
  }

  return goals.map((g) => {
    const metric = isGoalMetric(g.metric) ? g.metric : null;
    const totals = metric ? totalsByHorizon.get(g.horizon) : undefined;
    const liveCurrent = metric && totals ? totals[metric] : g.currentValue;
    const period = goalPeriod(g.horizon);
    const pace =
      g.targetValue && g.targetValue > 0 && liveCurrent != null
        ? computeGoalPace({
            target: g.targetValue,
            current: liveCurrent,
            doneThisWeek: metric && totals ? totals.thisWeek[metric] : 0,
            ...period,
          })
        : null;
    return { ...g, metric, liveCurrent, pace };
  });
}
