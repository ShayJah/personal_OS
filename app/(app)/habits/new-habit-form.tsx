"use client";

import { useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createHabitAction } from "./actions";

export function NewHabitForm() {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  if (!open) {
    return (
      <Button
        variant="ghost"
        onClick={() => setOpen(true)}
        aria-expanded={false}
        className="w-fit"
      >
        + New habit
      </Button>
    );
  }

  return (
    <Card>
      <form
        ref={formRef}
        action={async (formData) => {
          setSaving(true);
          await createHabitAction(formData);
          formRef.current?.reset();
          setSaving(false);
          setOpen(false);
        }}
        className="space-y-3"
      >
        <input
          name="name"
          placeholder="Habit name"
          required
          maxLength={200}
          className="w-full rounded-lg border border-border-strong px-3 py-2 text-sm"
        />
        <select
          name="frequency"
          aria-label="Habit frequency"
          defaultValue="daily"
          className="w-full rounded-lg border border-border-strong px-2 py-2 text-sm"
        >
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
        </select>
        <div className="flex items-center gap-2">
          <Button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Create habit"}
          </Button>
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}
