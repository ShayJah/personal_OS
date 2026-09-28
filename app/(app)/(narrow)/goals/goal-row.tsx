"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { GOAL_METRIC_META, GOAL_STATUS_META, isGoalMetric, type GoalPace } from "@/lib/goal-pace";
import { GOAL_METRICS } from "@/lib/validation/goal";
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
  metric: string | null;
  /** Live count when auto-tracked, otherwise the typed value. */
  liveCurrent: number | null;
  pace: GoalPace | null;
};

const field = "rounded-lg border border-border-strong px-2 py-2 text-base sm:text-sm";

export function GoalRow({ goal, areas }: { goal: GoalRowData; areas: string[] }) {
  const [editing, setEditing] = useState(false);
  const [metric, setMetric] = useState(goal.metric ?? "");
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
          <input name="title" defaultValue={goal.title} required maxLength={300} className={cn(field, "w-full px-3")} />
          <textarea
            name="why"
            placeholder="Why does this matter? (optional)"
            defaultValue={goal.why ?? ""}
            rows={2}
            className={cn(field, "w-full px-3")}
          />
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <select name="horizon" defaultValue={goal.horizon} className={field}>
              <option value="year">Year</option>
              <option value="quarter">Quarter</option>
            </select>
            <select name="status" defaultValue={goal.status} className={field}>
              <option value="active">Active</option>
              <option value="done">Done</option>
              <option value="dropped">Dropped</option>
            </select>
            <input name="targetValue" type="number" placeholder="Target" defaultValue={goal.targetValue ?? ""} className={field} />
            {metric ? (
              <p className="flex items-center px-1 text-xs text-muted">Counted for you</p>
            ) : (
              <input name="currentValue" type="number" placeholder="Current" defaultValue={goal.currentValue ?? ""} className={field} />
            )}
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <label className="space-y-1 text-xs text-muted">
              Category
              <input name="area" list="goal-areas" defaultValue={goal.area} maxLength={50} className={cn(field, "w-full text-foreground")} />
            </label>
            <label className="space-y-1 text-xs text-muted">
              Track automatically
              <select name="metric" value={metric} onChange={(e) => setMetric(e.target.value)} className={cn(field, "w-full text-foreground")}>
                <option value="">Not tracked — I&apos;ll update it</option>
                {GOAL_METRICS.map((m) => (
                  <option key={m} value={m}>
                    {GOAL_METRIC_META[m].label} (outreach)
                  </option>
                ))}
              </select>
            </label>
          </div>
          <datalist id="goal-areas">
            {areas.map((a) => (
              <option key={a} value={a} />
            ))}
          </datalist>
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

  const tracked = isGoalMetric(goal.metric);
  const current = goal.liveCurrent;
  const hasProgress = goal.targetValue != null && current != null && goal.targetValue > 0;
  const pct = hasProgress ? (current! / goal.targetValue!) * 100 : 0;
  const meta = goal.pace ? GOAL_STATUS_META[goal.pace.status] : null;
  const noun = tracked ? GOAL_METRIC_META[goal.metric as keyof typeof GOAL_METRIC_META].noun : null;

  return (
    <Card className="space-y-2.5 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">{goal.title}</p>
          {goal.why && <p className="mt-0.5 text-xs text-muted">{goal.why}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="min-h-9 rounded-md px-2 py-1 text-xs text-muted hover:bg-foreground/5 hover:text-foreground"
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
            className="min-h-9 rounded-md px-2 py-1 text-xs text-muted hover:bg-danger-soft hover:text-danger"
          >
            Delete
          </button>
        </div>
      </div>

      {hasProgress ? (
        <div className="space-y-1.5">
          {tracked && meta ? (
            <div className="h-2 w-full rounded-full bg-surface-sunken">
              <div className={cn("h-full rounded-full transition-[width]", meta.bar)} style={{ width: `${Math.min(100, pct)}%` }} />
            </div>
          ) : (
            <Progress value={pct} />
          )}
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
            <span className="font-mono text-foreground">
              {current} / {goal.targetValue}
            </span>
            {noun && <span>{noun} this {goal.horizon}</span>}
            {tracked && meta && (
              <span className={cn("inline-flex h-5 items-center gap-1.5 rounded-full px-2 text-[11px] font-medium", meta.soft, meta.text)}>
                <span aria-hidden="true" className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
                {meta.label}
              </span>
            )}
          </p>
        </div>
      ) : (
        <span className="inline-block rounded bg-accent-soft px-1.5 py-0.5 text-xs text-accent">{goal.status}</span>
      )}

      {tracked && goal.pace && (
        <Link
          href="/outreach"
          className="flex min-h-11 items-center justify-between gap-3 rounded-xl bg-surface-sunken/60 px-3 text-xs transition hover:bg-surface-sunken"
        >
          <span>
            This week{" "}
            <span className="font-mono text-foreground">
              {goal.pace.doneThisWeek} of {goal.pace.neededThisWeek}
            </span>{" "}
            <span className="text-muted">{noun} needed</span>
          </span>
          <span className="shrink-0 text-accent">Open outreach →</span>
        </Link>
      )}
    </Card>
  );
}
