import { requireSession } from "@/lib/auth/dal";
import { listHabitsWithHistory } from "@/lib/habits";
import { EmptyState } from "@/components/ui/empty-state";
import { HabitRow } from "./habit-row";
import { NewHabitForm } from "./new-habit-form";

export default async function HabitsPage() {
  const session = await requireSession();
  const habits = await listHabitsWithHistory(session.user.id);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="eyebrow">Build</p>
          <h1 className="mt-1 font-serif text-3xl">Habits</h1>
          <p className="mt-1 text-sm text-muted">
            Build streaks, one day at a time.
          </p>
        </div>
        <NewHabitForm />
      </div>

      {habits.length === 0 ? (
        <EmptyState
          title="No habits yet"
          description="Create one to start tracking your streaks."
        />
      ) : (
        <div className="space-y-2">
          {habits.map((habit) => (
            <HabitRow key={habit.id} habit={habit} />
          ))}
        </div>
      )}
    </div>
  );
}
