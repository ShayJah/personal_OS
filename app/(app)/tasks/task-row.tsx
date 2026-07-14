"use client";

import { useState, useTransition } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TaskForm, type ProjectOption } from "./task-form";
import { deleteTaskAction, toggleTaskAction, updateTaskAction } from "./actions";

const PRIORITY_LABEL: Record<number, string> = {
  1: "High",
  2: "Medium",
  3: "Low",
};

export type TaskRowData = {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
  dueDate: Date | string | null;
  priority: number | null;
  tags: string[];
  projectId: string | null;
  project: { id: string; name: string } | null;
};

export function TaskRow({
  task,
  projects,
}: {
  task: TaskRowData;
  projects: ProjectOption[];
}) {
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (editing) {
    return (
      <Card>
        <TaskForm
          action={updateTaskAction.bind(null, task.id)}
          projects={projects}
          initial={task}
          submitLabel="Save changes"
          onDone={() => setEditing(false)}
        />
      </Card>
    );
  }

  const dueDate = task.dueDate ? new Date(task.dueDate) : null;

  return (
    <Card className="flex items-start gap-3 py-3">
      <input
        type="checkbox"
        checked={task.completed}
        disabled={isPending}
        onChange={(e) => {
          const completed = e.target.checked;
          startTransition(() => toggleTaskAction(task.id, completed));
        }}
        aria-label={`Mark "${task.title}" as ${task.completed ? "not completed" : "completed"}`}
        className="mt-1 h-4 w-4 shrink-0"
      />

      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "truncate text-sm",
            task.completed && "text-muted-soft line-through"
          )}
        >
          {task.title}
        </p>

        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
          {dueDate && (
            <span>
              Due {dueDate.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
            </span>
          )}
          {task.priority && <span>{PRIORITY_LABEL[task.priority]}</span>}
          {task.project && <span>#{task.project.name}</span>}
          {task.tags.map((tag) => (
            <span key={tag} className="rounded bg-foreground/5 px-1.5 py-0.5">
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={() => setEditing(true)}
          aria-expanded={editing}
          className="rounded-md px-2 py-1 text-xs text-muted hover:bg-foreground/5 hover:text-foreground"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={() => {
            if (confirm(`Delete "${task.title}"?`)) {
              startTransition(() =>
                deleteTaskAction(task.id, task.projectId)
              );
            }
          }}
          className="rounded-md px-2 py-1 text-xs text-muted hover:bg-danger-soft hover:text-danger"
        >
          Delete
        </button>
      </div>
    </Card>
  );
}
