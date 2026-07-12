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
      <h2 className="text-sm font-medium text-foreground/60">
        Top 3 priorities today
      </h2>
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
            className="w-full rounded-lg border border-black/10 bg-transparent px-3 py-2 text-sm dark:border-white/10"
          />
        ))}
        <Button type="submit" disabled={saving} className="w-full">
          {saving ? "Saving..." : "Save priorities"}
        </Button>
      </form>
    </Card>
  );
}
