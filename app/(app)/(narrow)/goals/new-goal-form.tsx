"use client";

import { useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { GOAL_METRIC_META } from "@/lib/goal-pace";
import { GOAL_METRICS } from "@/lib/validation/goal";
import { createGoalAction } from "./actions";

export type GoalPrefill = {
  title: string;
  horizon: "year" | "quarter";
  area: string;
  metric: string;
  target: number;
};

const field = "rounded-lg border border-border-strong px-2 py-2 text-base sm:text-sm";

export function NewGoalForm({
  areas,
  prefill,
}: {
  areas: string[];
  /** Opens the form already filled in, e.g. arriving from the Outreach page. */
  prefill?: GoalPrefill;
}) {
  const [open, setOpen] = useState(Boolean(prefill));
  const [saving, setSaving] = useState(false);
  const [metric, setMetric] = useState(prefill?.metric ?? "");
  const formRef = useRef<HTMLFormElement>(null);

  if (!open) {
    return (
      <Button variant="ghost" onClick={() => setOpen(true)} className="w-fit">
        + New goal
      </Button>
    );
  }

  return (
    <Card className="w-full sm:max-w-sm">
      <form
        ref={formRef}
        action={async (formData) => {
          setSaving(true);
          await createGoalAction(formData);
          formRef.current?.reset();
          setSaving(false);
          setOpen(false);
        }}
        className="space-y-3"
      >
        <input
          name="title"
          placeholder="Goal title"
          required
          maxLength={300}
          defaultValue={prefill?.title}
          className={cn(field, "w-full px-3")}
        />
        <textarea name="why" placeholder="Why does this matter? (optional)" rows={2} className={cn(field, "w-full px-3")} />
        <div className="grid grid-cols-2 gap-2">
          <select name="horizon" defaultValue={prefill?.horizon ?? "year"} className={field}>
            <option value="year">Year</option>
            <option value="quarter">Quarter</option>
          </select>
          <input name="area" list="goal-areas" placeholder="Category" defaultValue={prefill?.area ?? "personal"} className={field} />
        </div>
        <datalist id="goal-areas">
          {areas.map((a) => (
            <option key={a} value={a} />
          ))}
        </datalist>
        <label className="block space-y-1 text-xs text-muted">
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
        <div className="grid grid-cols-2 gap-2">
          <input name="targetValue" type="number" placeholder="Target" defaultValue={prefill?.target} className={field} />
          {metric ? (
            <p className="flex items-center px-1 text-xs text-muted">Counted for you</p>
          ) : (
            <input name="currentValue" type="number" placeholder="Current (optional)" className={field} />
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Create goal"}
          </Button>
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}
