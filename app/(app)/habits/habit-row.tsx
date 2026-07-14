"use client";

import { useState, useTransition } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  deleteHabitAction,
  toggleHabitTodayAction,
  updateHabitAction,
} from "./actions";

export type HabitRowData = {
  id: string;
  name: string;
  frequency: string;
  completedToday: boolean;
  streak: number;
  history: { date: string; completed: boolean }[];
};

export function HabitRow({ habit }: { habit: HabitRowData }) {
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (editing) {
    return (
      <Card>
        <form
          action={async (formData) => {
            await updateHabitAction(habit.id, formData);
            setEditing(false);
          }}
          className="space-y-3"
        >
          <input
            name="name"
            defaultValue={habit.name}
            required
            maxLength={200}
            className="w-full rounded-lg border border-border-strong px-3 py-2 text-sm"
          />
          <select
            name="frequency"
            aria-label="Habit frequency"
            defaultValue={habit.frequency}
            className="w-full rounded-lg border border-border-strong px-2 py-2 text-sm"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
          </select>
          <div className="flex items-center gap-2">
            <Button type="submit">Save changes</Button>
            <Button type="button" variant="ghost" onClick={() => setEditing(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    );
  }

  return (
    <Card className="flex items-center gap-3 py-3">
      <input
        type="checkbox"
        checked={habit.completedToday}
        disabled={isPending}
        onChange={(e) => {
          const completed = e.target.checked;
          startTransition(() => toggleHabitTodayAction(habit.id, completed));
        }}
        aria-label={`Mark "${habit.name}" as ${habit.completedToday ? "not done" : "done"} today`}
        className="h-4 w-4 shrink-0"
      />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium">{habit.name}</p>
          {habit.streak > 0 && (
            <span className="shrink-0 rounded bg-accent-soft px-1.5 py-0.5 text-xs text-accent">
              {habit.streak} day{habit.streak === 1 ? "" : "s"}
            </span>
          )}
        </div>

        <div className="mt-1.5 flex gap-1">
          {habit.history.map((day) => (
            <span
              key={day.date}
              title={day.date}
              className={cn(
                "h-2.5 w-2.5 rounded-sm",
                day.completed ? "bg-foreground" : "bg-foreground/10"
              )}
            />
          ))}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={() => setEditing(true)}
          aria-expanded={editing}
          className="rounded-md px-2 py-1 text-xs text-muted hover:bg-foreground/5 hover:text-foreground"
        >
          Edit
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => {
            if (confirm(`Delete "${habit.name}"?`)) {
              startTransition(() => deleteHabitAction(habit.id));
            }
          }}
          className="rounded-md px-2 py-1 text-xs text-muted hover:bg-danger-soft hover:text-danger"
        >
          Delete
        </button>
      </div>
    </Card>
  );
}
