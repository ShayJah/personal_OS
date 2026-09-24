"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { toggleTaskAction } from "../(narrow)/tasks/actions";
import { quickAddTask } from "./actions";

export type TodayTask = {
  id: string;
  title: string;
  /** Whole days past due; 0 = due today. */
  daysOverdue: number;
};

export function TodayTasks({
  tasks,
  totalOpen,
}: {
  tasks: TodayTask[];
  totalOpen: number;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [done, setDone] = useState<Set<string>>(new Set());
  const [adding, setAdding] = useState(false);
  const [, startTransition] = useTransition();

  function toggle(id: string, completed: boolean) {
    setDone((prev) => {
      const next = new Set(prev);
      if (completed) next.add(id);
      else next.delete(id);
      return next;
    });
    startTransition(() => toggleTaskAction(id, completed));
  }

  return (
    <section aria-labelledby="tasks-heading">
      <div className="flex items-baseline justify-between">
        <p id="tasks-heading" className="eyebrow">
          Due today &amp; overdue
        </p>
        <Link href="/tasks" className="text-xs text-muted hover:text-foreground">
          All {totalOpen} →
        </Link>
      </div>

      {tasks.length === 0 ? (
        <p className="mt-3 rounded-xl bg-surface-sunken/60 px-4 py-3 text-sm text-muted">
          Nothing due. Add something below or pick from your task list.
        </p>
      ) : (
        <ul className="mt-2">
          {tasks.map((task) => {
            const checked = done.has(task.id);
            return (
              <li key={task.id}>
                <label className="flex min-h-11 cursor-pointer items-start gap-3 py-2.5">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => toggle(task.id, e.target.checked)}
                    aria-label={`Mark "${task.title}" as done`}
                    className="mt-0.5 shrink-0"
                  />
                  <span className="min-w-0 flex-1">
                    <span
                      className={cn(
                        "block text-[15px] leading-snug",
                        checked && "text-muted-soft line-through"
                      )}
                    >
                      {task.title}
                    </span>
                    {task.daysOverdue > 0 && !checked && (
                      <span className="mt-0.5 block text-xs text-danger">
                        {task.daysOverdue === 1
                          ? "1 day overdue"
                          : `${task.daysOverdue} days overdue`}
                      </span>
                    )}
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      )}

      <form
        ref={formRef}
        action={async (formData) => {
          setAdding(true);
          try {
            await quickAddTask(formData);
            formRef.current?.reset();
          } finally {
            setAdding(false);
          }
        }}
        className="mt-3 flex gap-2"
      >
        <input
          name="title"
          placeholder="Add a task…"
          required
          maxLength={300}
          aria-label="New task"
          className="min-h-11 min-w-0 flex-1 px-3.5 text-base sm:text-sm"
        />
        <button
          type="submit"
          disabled={adding}
          className="min-h-11 shrink-0 rounded-lg bg-foreground px-4 text-sm font-medium text-background transition hover:bg-foreground/85 active:scale-[0.98] disabled:opacity-40"
        >
          {adding ? "Adding…" : "Add"}
        </button>
      </form>
    </section>
  );
}
