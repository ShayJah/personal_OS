"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { saveJournalEntryAction } from "./actions";

const MOODS = [1, 2, 3, 4, 5];

export function JournalEditor({
  dateKey,
  initial,
}: {
  dateKey: string;
  initial: { body: string; mood?: number };
}) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  return (
    <Card>
      <form
        action={async (formData) => {
          setSaving(true);
          setSaved(false);
          await saveJournalEntryAction(formData);
          setSaving(false);
          setSaved(true);
        }}
        className="space-y-3"
      >
        <input type="hidden" name="date" value={dateKey} />
        <textarea
          name="body"
          placeholder="What happened today?"
          required
          maxLength={20000}
          rows={8}
          defaultValue={initial.body}
          className="w-full rounded-lg border border-border-strong px-3 py-2 text-sm"
        />

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1" role="radiogroup" aria-label="Mood">
            {MOODS.map((m) => (
              <label key={m} className="cursor-pointer">
                <input
                  type="radio"
                  name="mood"
                  value={m}
                  defaultChecked={initial.mood === m}
                  className="peer sr-only"
                />
                <span className="flex h-8 w-8 items-center justify-center rounded-full text-sm text-muted peer-checked:bg-foreground peer-checked:text-background">
                  {m}
                </span>
              </label>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {saved && !saving && <span className="text-xs text-muted">Saved</span>}
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save entry"}
            </Button>
          </div>
        </div>
      </form>
    </Card>
  );
}
