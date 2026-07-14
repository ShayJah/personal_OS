"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { saveTodayPriorities } from "./actions";

export function PrioritiesCard({ initial }: { initial: string[] }) {
  const slots = [0, 1, 2];
  const [saving, setSaving] = useState(false);

  return (
    <Card>
      <p className="eyebrow">Top 3 for today</p>
      <form
        action={async (formData) => {
          setSaving(true);
          await saveTodayPriorities(formData);
          setSaving(false);
        }}
        className="mt-3 space-y-2"
      >
        {slots.map((i) => (
          <input
            key={i}
            name="priority"
            defaultValue={initial[i] ?? ""}
            placeholder={`Priority ${i + 1}`}
            maxLength={300}
            className="w-full px-3 py-2 text-sm"
          />
        ))}
        <Button type="submit" disabled={saving} className="w-full">
          {saving ? "Saving..." : "Save priorities"}
        </Button>
      </form>
    </Card>
  );
}
