"use client";

import { useState, useTransition } from "react";
import { EventForm, type TaskOption } from "./event-form";
import { deleteEventAction, updateEventAction } from "./actions";

export type EventRowData = {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  startAt: Date | string;
  endAt: Date | string;
  taskId: string | null;
  task: { id: string; title: string } | null;
};

function formatTime(value: Date | string) {
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function EventRow({
  event,
  tasks,
}: {
  event: EventRowData;
  tasks: TaskOption[];
}) {
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (editing) {
    return (
      <div className="rounded-lg border border-border-strong p-3">
        <EventForm
          action={updateEventAction.bind(null, event.id)}
          tasks={tasks}
          initial={event}
          submitLabel="Save changes"
          onDone={() => setEditing(false)}
        />
      </div>
    );
  }

  return (
    <div className="flex items-start justify-between gap-2 rounded-lg border border-border-strong px-3 py-2 text-sm">
      <div className="min-w-0">
        <p className="truncate font-medium">{event.title}</p>
        <p className="text-xs text-muted">
          {formatTime(event.startAt)} &ndash; {formatTime(event.endAt)}
          {event.location && <> &middot; {event.location}</>}
          {event.task && <> &middot; linked to {event.task.title}</>}
        </p>
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
          disabled={isPending}
          onClick={() => {
            if (confirm(`Delete "${event.title}"?`)) {
              startTransition(() => deleteEventAction(event.id));
            }
          }}
          className="rounded-md px-2 py-1 text-xs text-muted hover:bg-danger-soft hover:text-danger"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
