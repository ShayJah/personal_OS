"use client";

import { useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createGoalAction } from "./actions";

export function NewGoalForm() {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
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
          className="w-full rounded-lg border border-border-strong px-3 py-2 text-sm"
        />
        <textarea
          name="why"
          placeholder="Why does this matter? (optional)"
          rows={2}
          className="w-full rounded-lg border border-border-strong px-3 py-2 text-sm"
        />
        <div className="grid grid-cols-2 gap-2">
          <select
            name="horizon"
            defaultValue="year"
            className="rounded-lg border border-border-strong px-2 py-2 text-sm"
          >
            <option value="year">Year</option>
            <option value="quarter">Quarter</option>
          </select>
          <input
            name="area"
            placeholder="Area (optional)"
            defaultValue="personal"
            className="rounded-lg border border-border-strong px-2 py-2 text-sm"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <input
            name="targetValue"
            type="number"
            placeholder="Target (optional)"
            className="rounded-lg border border-border-strong px-2 py-2 text-sm"
          />
          <input
            name="currentValue"
            type="number"
            placeholder="Current (optional)"
            className="rounded-lg border border-border-strong px-2 py-2 text-sm"
          />
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
