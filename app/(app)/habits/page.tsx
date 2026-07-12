import { requireSession } from "@/lib/auth/dal";
import { listHabitsWithHistory } from "@/lib/habits";
import { Card } from "@/components/ui/card";
import { HabitRow } from "./habit-row";
import { NewHabitForm } from "./new-habit-form";

export default async function HabitsPage() {
  const session = await requireSession();
  const habits = await listHabitsWithHistory(session.user.id);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Habits</h1>
          <p className="text-sm text-foreground/60">
            Build streaks, one day at a time.
          </p>
        </div>
        <NewHabitForm />
      </div>

      {habits.length === 0 ? (
        <Card className="py-10 text-center text-sm text-foreground/40">
          No habits yet — create one to start tracking.
        </Card>
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
