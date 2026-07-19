import Link from "next/link";
import { requireSession } from "@/lib/auth/dal";
import { listWorkouts, listExerciseNames, getExerciseHistory, type ExerciseHistoryEntry } from "@/lib/workouts";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ExercisePicker } from "./exercise-picker";

export default async function LiftsPage() {
  const session = await requireSession();
  const userId = session.user.id;

  const workouts = await listWorkouts(userId, 20);
  const exerciseNames = await listExerciseNames(userId);

  const historyByExercise: Record<string, ExerciseHistoryEntry[]> = {};
  await Promise.all(
    exerciseNames.map(async (name) => {
      historyByExercise[name] = await getExerciseHistory(userId, name);
    })
  );

  return (
    <div className="space-y-6">
      <div>
        <Link href="/fitness" className="text-sm text-muted hover:text-foreground">
          ← Fitness
        </Link>
        <p className="eyebrow mt-3">Hevy</p>
        <h1 className="mt-1 font-serif text-3xl">Lifts</h1>
        <p className="mt-1 text-sm text-muted">Your recent workouts and per-exercise history.</p>
      </div>

      {workouts.length === 0 ? (
        <EmptyState
          title="No workouts synced yet"
          description="Connect Hevy in Settings and trigger a sync to see your lifts here."
        />
      ) : (
        <>
          <ExercisePicker exerciseNames={exerciseNames} historyByExercise={historyByExercise} />

          <div className="space-y-2">
            <p className="eyebrow">Recent workouts</p>
            {workouts.map((workout) => {
              const minutes = Math.round((workout.endAt.getTime() - workout.startAt.getTime()) / 60000);
              return (
                <Card key={workout.id} className="py-3">
                  <details>
                    <summary className="flex cursor-pointer items-center justify-between gap-3">
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">
                          {workout.title ?? "Workout"}
                        </span>
                        <span className="block text-xs text-muted">
                          {workout.startAt.toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                          })}{" "}
                          · {minutes} min ·{" "}
                          {workout.volumeKg.toLocaleString(undefined, { maximumFractionDigits: 0 })} kg
                        </span>
                      </span>
                    </summary>
                    <div className="mt-3 space-y-2 border-t border-border pt-3">
                      {workout.exercises.map((exercise, i) => (
                        <div key={i}>
                          <p className="text-sm font-medium">{exercise.name}</p>
                          <p className="text-xs text-muted">
                            {exercise.sets
                              .map((set) => `${set.weightKg}kg × ${set.reps}`)
                              .join(", ")}
                          </p>
                        </div>
                      ))}
                    </div>
                  </details>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
