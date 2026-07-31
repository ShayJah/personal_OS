import { requireSession } from "@/lib/auth/dal";
import { listGoals } from "@/lib/goals";
import { EmptyState } from "@/components/ui/empty-state";
import { GoalRow } from "./goal-row";
import { NewGoalForm } from "./new-goal-form";

export default async function GoalsPage() {
  const session = await requireSession();
  const rawGoals = await listGoals(session.user.id);

  const goals = rawGoals.map((g) => ({
    ...g,
    targetValue: g.targetValue ? Number(g.targetValue) : null,
    currentValue: g.currentValue ? Number(g.currentValue) : null,
  }));

  const yearGoals = goals.filter((g) => g.horizon === "year");
  const quarterGoals = goals.filter((g) => g.horizon === "quarter");

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="eyebrow">Aim</p>
          <h1 className="mt-1 font-serif text-3xl">Goals</h1>
          <p className="mt-1 text-sm text-muted">What you&apos;re working toward.</p>
        </div>
        <NewGoalForm />
      </div>

      {goals.length === 0 ? (
        <EmptyState
          title="No goals yet"
          description="Set a year or quarter goal to give your priorities direction."
        />
      ) : (
        <div className="space-y-8">
          {yearGoals.length > 0 && (
            <div className="space-y-2">
              <p className="eyebrow">Year</p>
              {yearGoals.map((goal) => (
                <GoalRow key={goal.id} goal={goal} />
              ))}
            </div>
          )}
          {quarterGoals.length > 0 && (
            <div className="space-y-2">
              <p className="eyebrow">Quarter</p>
              {quarterGoals.map((goal) => (
                <GoalRow key={goal.id} goal={goal} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
