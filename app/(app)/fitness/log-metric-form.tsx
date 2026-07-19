"use client";

import { useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { logMetricAction } from "./actions";

const KINDS = [
  { value: "weight", label: "Weight", unit: "kg" },
  { value: "calories", label: "Calories", unit: "kcal" },
  { value: "protein", label: "Protein", unit: "g" },
  { value: "workout_min", label: "Workout minutes", unit: "min" },
];

function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

export function LogMetricForm() {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  if (!open) {
    return (
      <Button variant="ghost" onClick={() => setOpen(true)} className="w-fit">
        + Log a metric
      </Button>
    );
  }

  return (
    <Card>
      <form
        ref={formRef}
        action={async (formData) => {
          setSaving(true);
          await logMetricAction(formData);
          formRef.current?.reset();
          setSaving(false);
          setOpen(false);
        }}
        className="space-y-3"
      >
        <div className="grid grid-cols-2 gap-2">
          <select
            name="kind"
            aria-label="Metric kind"
            defaultValue="weight"
            className="rounded-lg border border-border-strong px-2 py-2 text-sm"
          >
            {KINDS.map((k) => (
              <option key={k.value} value={k.value}>
                {k.label}
              </option>
            ))}
          </select>
          <input
            type="date"
            name="date"
            aria-label="Date"
            defaultValue={todayInputValue()}
            className="rounded-lg border border-border-strong px-2 py-2 text-sm"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <input
            name="value"
            type="number"
            step="any"
            placeholder="Value"
            required
            className="rounded-lg border border-border-strong px-2 py-2 text-sm"
          />
          <input
            name="unit"
            placeholder="Unit (optional)"
            className="rounded-lg border border-border-strong px-2 py-2 text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Log metric"}
          </Button>
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}
