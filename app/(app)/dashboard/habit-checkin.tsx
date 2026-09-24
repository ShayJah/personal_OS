"use client";

import { useState, useTransition } from "react";
import { cn } from "@/lib/utils";
import { toggleHabit } from "./actions";

export type HabitItem = { id: string; name: string; done: boolean; streak: number };

export function HabitCheckin({ habits }: { habits: HabitItem[] }) {
  const [state, setState] = useState(() => new Map(habits.map((h) => [h.id, h.done])));
  const [, startTransition] = useTransition();

  if (habits.length === 0) {
    return <p className="mt-3 text-sm text-muted">No habits yet. Add one from Settings.</p>;
  }

  function toggle(id: string) {
    const next = !state.get(id);
    setState((prev) => new Map(prev).set(id, next));
    startTransition(() => toggleHabit(id, next));
  }

  return (
    <ul className="mt-2">
      {habits.map((habit) => {
        const done = state.get(habit.id) ?? false;
        return (
          <li key={habit.id}>
            <button
              type="button"
              onClick={() => toggle(habit.id)}
              aria-pressed={done}
              className="flex min-h-11 w-full items-center gap-3 rounded-lg py-2 text-left"
            >
              <span
                aria-hidden="true"
                className={cn(
                  "grid h-5 w-5 shrink-0 place-content-center rounded-full border-[1.5px] transition",
                  done
                    ? "border-success bg-success text-surface"
                    : "border-border-strong bg-surface"
                )}
              >
                {done && (
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M2 5.2 4.1 7.3 8 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </span>
              <span className={cn("min-w-0 flex-1 truncate text-[15px]", done && "text-muted")}>
                {habit.name}
              </span>
              {habit.streak > 0 && (
                <span className="font-mono text-xs text-muted">{habit.streak}d</span>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
