import Link from "next/link";
import { requireSession } from "@/lib/auth/dal";
import { getWeekSummary } from "@/lib/metrics";
import { Card } from "@/components/ui/card";
import { LogMetricForm } from "./log-metric-form";

function formatNumber(n: number | null, digits = 0) {
  if (n === null) return "—";
  return n.toLocaleString(undefined, { maximumFractionDigits: digits });
}

export default async function FitnessPage() {
  const session = await requireSession();
  const summary = await getWeekSummary(session.user.id);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="eyebrow">This week</p>
          <h1 className="mt-1 font-serif text-3xl">Fitness</h1>
          <p className="mt-1 text-sm text-muted">
            Synced from Hevy, plus anything you log manually.
          </p>
        </div>
        <LogMetricForm />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="eyebrow">Workouts</p>
          <p className="mt-2 font-serif text-3xl">{summary.workoutCount}</p>
          <p className="mt-1 text-sm text-muted">
            {formatNumber(summary.workoutMinutes)} min · {formatNumber(summary.workoutVolumeKg)} kg lifted
          </p>
          <Link href="/fitness/lifts" className="mt-2 inline-block text-xs text-muted hover:text-foreground">
            View all lifts →
          </Link>
        </Card>

        <Card>
          <p className="eyebrow">Avg calories/day</p>
          <p className="mt-2 font-serif text-3xl">{formatNumber(summary.avgCalories)}</p>
          <p className="mt-1 text-sm text-muted">Avg protein: {formatNumber(summary.avgProtein)}g</p>
        </Card>

        <Card>
          <p className="eyebrow">Weight</p>
          {summary.recentWeights.length > 0 ? (
            <>
              <p className="mt-2 font-serif text-3xl">
                {summary.recentWeights[0].value.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                <span className="ml-1 text-base text-muted">kg</span>
              </p>
              <p className="mt-1 text-sm text-muted">
                {summary.recentWeights[0].date.toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })}
              </p>
            </>
          ) : (
            <p className="mt-2 text-sm text-muted">No weight logged this week.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
