"use client";

import { useState, useTransition } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { deleteGoalAction, updateGoalAction } from "./actions";

export type GoalRowData = {
  id: string;
  horizon: string;
  title: string;
  why: string | null;
  area: string;
  targetValue: number | null;
  currentValue: number | null;
  status: string;
};

export function GoalRow({ goal }: { goal: GoalRowData }) {
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (editing) {
    return (
      <Card>
        <form
          action={async (formData) => {
            await updateGoalAction(goal.id, formData);
            setEditing(false);
          }}
          className="space-y-3"
        >
          <input
            name="title"
            defaultValue={goal.title}
            required
            maxLength={300}
            className="w-full rounded-lg border border-border-strong px-3 py-2 text-sm"
          />
          <textarea
            name="why"
            placeholder="Why does this matter? (optional)"
            defaultValue={goal.why ?? ""}
            rows={2}
            className="w-full rounded-lg border border-border-strong px-3 py-2 text-sm"
          />
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <select
              name="horizon"
              defaultValue={goal.horizon}
              className="rounded-lg border border-border-strong px-2 py-2 text-sm"
            >
              <option value="year">Year</option>
              <option value="quarter">Quarter</option>
            </select>
            <select
              name="status"
              defaultValue={goal.status}
              className="rounded-lg border border-border-strong px-2 py-2 text-sm"
            >
              <option value="active">Active</option>
              <option value="done">Done</option>
              <option value="dropped">Dropped</option>
            </select>
            <input
              name="targetValue"
              type="number"
              placeholder="Target"
              defaultValue={goal.targetValue ?? ""}
              className="rounded-lg border border-border-strong px-2 py-2 text-sm"
            />
            <input
              name="currentValue"
              type="number"
              placeholder="Current"
              defaultValue={goal.currentValue ?? ""}
              className="rounded-lg border border-border-strong px-2 py-2 text-sm"
            />
          </div>
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

  const hasProgress = goal.targetValue != null && goal.currentValue != null && goal.targetValue > 0;
  const pct = hasProgress ? (goal.currentValue! / goal.targetValue!) * 100 : 0;

  return (
    <Card className="space-y-2 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{goal.title}</p>
          {goal.why && <p className="mt-0.5 text-xs text-muted">{goal.why}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="rounded-md px-2 py-1 text-xs text-muted hover:bg-foreground/5 hover:text-foreground"
          >
            Edit
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => {
              if (confirm(`Delete "${goal.title}"?`)) {
                startTransition(() => deleteGoalAction(goal.id));
              }
            }}
            className="rounded-md px-2 py-1 text-xs text-muted hover:bg-danger-soft hover:text-danger"
          >
            Delete
          </button>
        </div>
      </div>

      {hasProgress ? (
        <div className="space-y-1">
          <Progress value={pct} />
          <p className="text-xs text-muted">
            {goal.currentValue} / {goal.targetValue}
          </p>
        </div>
      ) : (
        <span className="inline-block rounded bg-accent-soft px-1.5 py-0.5 text-xs text-accent">
          {goal.status}
        </span>
      )}
    </Card>
  );
}
