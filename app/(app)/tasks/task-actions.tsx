"use client";

import { useTransition } from "react";
import { moveTaskToTodayAction, rescheduleOverdueAction } from "./actions";

export function RescheduleAllButton({ count }: { count: number }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (confirm(`Move all ${count} overdue tasks to today?`)) {
          startTransition(() => rescheduleOverdueAction());
        }
      }}
      className="min-h-9 rounded-md px-2 text-xs text-muted hover:text-foreground disabled:opacity-40"
    >
      {pending ? "Moving…" : "Reschedule all"}
    </button>
  );
}

export function MoveToTodayButton({ taskId }: { taskId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => moveTaskToTodayAction(taskId))}
      className="min-h-9 shrink-0 rounded-lg border border-border-strong bg-surface px-3 text-xs font-medium transition hover:bg-foreground/5 active:scale-[0.98] disabled:opacity-40"
    >
      {pending ? "…" : "Move to today"}
    </button>
  );
}
