"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";

export type TaskOption = { id: string; title: string };

export type EventFormValues = {
  title: string;
  description?: string | null;
  location?: string | null;
  startAt: Date | string;
  endAt: Date | string;
  taskId?: string | null;
};

function toDateTimeInputValue(value: Date | string) {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function EventForm({
  action,
  tasks,
  initial,
  defaultStart,
  onDone,
  submitLabel = "Save event",
}: {
  action: (formData: FormData) => Promise<void>;
  tasks: TaskOption[];
  initial?: EventFormValues;
  defaultStart?: Date;
  onDone?: () => void;
  submitLabel?: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        setError(null);
        setSaving(true);
        try {
          await action(formData);
          formRef.current?.reset();
          onDone?.();
        } catch {
          setError("End time must be after start time.");
        } finally {
          setSaving(false);
        }
      }}
      className="space-y-3"
    >
      <input
        name="title"
        placeholder="Event title"
        required
        maxLength={300}
        defaultValue={initial?.title}
        className="w-full rounded-lg border border-border-strong px-3 py-2 text-sm"
      />

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <label className="space-y-1 text-xs text-muted">
          Starts
          <input
            type="datetime-local"
            name="startAt"
            required
            defaultValue={
              initial ? toDateTimeInputValue(initial.startAt) : defaultStart ? toDateTimeInputValue(defaultStart) : ""
            }
            className="w-full rounded-lg border border-border-strong px-2 py-2 text-sm"
          />
        </label>
        <label className="space-y-1 text-xs text-muted">
          Ends
          <input
            type="datetime-local"
            name="endAt"
            required
            defaultValue={initial ? toDateTimeInputValue(initial.endAt) : ""}
            className="w-full rounded-lg border border-border-strong px-2 py-2 text-sm"
          />
        </label>
      </div>

      <input
        name="location"
        placeholder="Location (optional)"
        maxLength={300}
        defaultValue={initial?.location ?? ""}
        className="w-full rounded-lg border border-border-strong px-3 py-2 text-sm"
      />

      <textarea
        name="description"
        placeholder="Description (optional)"
        maxLength={5000}
        rows={2}
        defaultValue={initial?.description ?? ""}
        className="w-full rounded-lg border border-border-strong px-3 py-2 text-sm"
      />

      <select
        name="taskId"
        aria-label="Linked task"
        defaultValue={initial?.taskId ?? ""}
        className="w-full rounded-lg border border-border-strong px-2 py-2 text-sm"
      >
        <option value="">Not linked to a task</option>
        {tasks.map((t) => (
          <option key={t.id} value={t.id}>
            {t.title}
          </option>
        ))}
      </select>

      {error && <p className="text-xs text-danger">{error}</p>}

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
