"use client";

import { useState, useTransition } from "react";
import { cn } from "@/lib/utils";
import type { TaskItemData } from "@/lib/task-groups";
import { TaskForm, type ProjectOption } from "./task-form";
import { deleteTaskAction, toggleTaskAction, updateTaskAction } from "./actions";

export function TaskItem({
  task,
  projects,
  compact = false,
  hideProject = false,
  sections,
}: {
  task: TaskItemData;
  projects: ProjectOption[];
  /** Narrow containers (the side rail): always stack title above details. */
  compact?: boolean;
  /** On a project page every task shares the project, so the chip is noise. */
  hideProject?: boolean;
  sections?: string[];
}) {
  const [editing, setEditing] = useState(false);
  const [checked, setChecked] = useState(task.completed);
  const [pending, startTransition] = useTransition();

  if (editing) {
    return (
      <li className="my-2 rounded-2xl border border-border-strong bg-surface p-4">
        <TaskForm
          action={updateTaskAction.bind(null, task.id)}
          projects={projects}
          initial={task}
          sections={sections}
          submitLabel="Save changes"
          onDone={() => setEditing(false)}
        />
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            if (confirm(`Delete "${task.title}"?`)) {
              startTransition(() => deleteTaskAction(task.id, task.projectId));
            }
          }}
          className="mt-3 min-h-9 rounded-md px-2 text-xs text-muted hover:bg-danger-soft hover:text-danger"
        >
          Delete task
        </button>
      </li>
    );
  }

  return (
    <li className="flex items-start gap-3">
      <label className="flex min-h-11 shrink-0 cursor-pointer items-center pl-1 pr-0.5">
        <input
          type="checkbox"
          checked={checked}
          disabled={pending}
          onChange={(e) => {
            const completed = e.target.checked;
            setChecked(completed);
            startTransition(() => toggleTaskAction(task.id, completed));
          }}
          aria-label={`Mark "${task.title}" as ${checked ? "not completed" : "completed"}`}
          className="h-5 w-5 rounded-md"
        />
      </label>

      <button
        type="button"
        onClick={() => setEditing(true)}
        aria-label={`Edit "${task.title}"`}
        className={cn(
          "flex min-h-11 min-w-0 flex-1 flex-col gap-1 rounded-lg py-2.5 text-left hover:bg-surface-sunken/40",
          !compact && "sm:flex-row sm:items-center sm:gap-3"
        )}
      >
        <span
          className={cn(
            "min-w-0 flex-1 text-[15px] leading-snug",
            !compact && "sm:truncate",
            checked && "text-muted-soft line-through"
          )}
        >
          {task.title}
        </span>

        <span className="flex shrink-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs">
          {task.priority === 1 && !checked && (
            <span className="rounded-full bg-warning-soft px-2 py-0.5 text-warning">High</span>
          )}
          {task.project && !hideProject && (
            <span className="inline-flex max-w-40 items-center gap-1.5 rounded-full bg-surface-sunken px-2.5 py-0.5 text-foreground/80">
              <span
                aria-hidden="true"
                className="h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ background: task.project.color }}
              />
              <span className="truncate">{task.project.name}</span>
            </span>
          )}
          {task.dueLabel && (
            <span
              className={cn(
                "whitespace-nowrap",
                !compact && "sm:w-24 sm:text-right",
                task.tone === "overdue" && !checked && "text-danger",
                task.tone === "today" && !checked && "font-medium text-foreground",
                (task.tone === "normal" || checked) && "text-muted"
              )}
            >
              {task.dueLabel}
            </span>
          )}
        </span>
      </button>
    </li>
  );
}
