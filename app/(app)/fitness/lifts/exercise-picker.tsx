"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import type { ExerciseHistoryEntry } from "@/lib/workouts";

export function ExercisePicker({
  exerciseNames,
  historyByExercise,
}: {
  exerciseNames: string[];
  historyByExercise: Record<string, ExerciseHistoryEntry[]>;
}) {
  const [selected, setSelected] = useState(exerciseNames[0] ?? "");
  const history = historyByExercise[selected] ?? [];

  if (exerciseNames.length === 0) return null;

  return (
    <Card>
      <p className="eyebrow">By exercise</p>
      <select
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        aria-label="Choose exercise"
        className="mt-3 w-full rounded-lg border border-border-strong px-3 py-2 text-sm"
      >
        {exerciseNames.map((name) => (
          <option key={name} value={name}>
            {name}
          </option>
        ))}
      </select>

      {history.length === 0 ? (
        <p className="mt-3 text-sm text-muted">No history yet for this exercise.</p>
      ) : (
        <ul className="mt-3 space-y-1.5 text-sm">
          {history.map((entry, i) => (
            <li key={i} className="flex items-center justify-between">
              <span className="text-muted">
                {entry.date.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
              </span>
              <span>
                {entry.bestSet
                  ? `${entry.bestSet.weightKg}kg × ${entry.bestSet.reps} (best set)`
                  : "—"}
                <span className="ml-2 text-muted">
                  {entry.totalVolumeKg.toLocaleString(undefined, { maximumFractionDigits: 0 })}kg total
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
