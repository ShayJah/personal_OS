"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";

export type ProjectOption = { id: string; name: string };

export type TaskFormValues = {
  title: string;
  description?: string | null;
  dueDate?: Date | string | null;
  priority?: number | null;
  projectId?: string | null;
  tags?: string[];
};

function toDateInputValue(value?: Date | string | null) {
  if (!value) return "";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

export function TaskForm({
  action,
  projects,
  initial,
  defaultProjectId,
  onDone,
  submitLabel = "Save task",
}: {
  action: (formData: FormData) => Promise<void>;
  projects: ProjectOption[];
  initial?: TaskFormValues;
  defaultProjectId?: string;
  onDone?: () => void;
  submitLabel?: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [saving, setSaving] = useState(false);

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        setSaving(true);
        await action(formData);
        formRef.current?.reset();
        setSaving(false);
        onDone?.();
      }}
      className="space-y-3"
    >
      <input
        name="title"
        placeholder="Task title"
        required
        maxLength={300}
        defaultValue={initial?.title}
        className="w-full rounded-lg border border-border-strong px-3 py-2 text-sm"
      />

      <textarea
        name="description"
        placeholder="Description (optional)"
        maxLength={5000}
        defaultValue={initial?.description ?? ""}
        rows={2}
        className="w-full rounded-lg border border-border-strong px-3 py-2 text-sm"
      />

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <input
          type="date"
          name="dueDate"
          aria-label="Due date"
          defaultValue={toDateInputValue(initial?.dueDate)}
          className="rounded-lg border border-border-strong px-2 py-2 text-sm"
        />

        <select
          name="priority"
          aria-label="Priority"
          defaultValue={initial?.priority ? String(initial.priority) : ""}
          className="rounded-lg border border-border-strong px-2 py-2 text-sm"
        >
          <option value="">No priority</option>
          <option value="1">High</option>
          <option value="2">Medium</option>
          <option value="3">Low</option>
        </select>

        <select
          name="projectId"
          aria-label="Project"
          defaultValue={initial?.projectId ?? defaultProjectId ?? ""}
          disabled={Boolean(defaultProjectId)}
          className="rounded-lg border border-border-strong px-2 py-2 text-sm disabled:opacity-60"
        >
          <option value="">No project</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        <input
          name="tags"
          placeholder="tags, comma sep"
          defaultValue={initial?.tags?.join(", ") ?? ""}
          className="rounded-lg border border-border-strong px-2 py-2 text-sm"
        />
      </div>

      <div className="flex items-center gap-2">
        <Button type="submit" disabled={saving}>
          {saving ? "Saving..." : submitLabel}
        </Button>
        {onDone && (
          <Button type="button" variant="ghost" onClick={() => onDone()}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
