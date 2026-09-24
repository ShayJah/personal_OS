"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { FocusQuickAddButton } from "@/app/(app)/tasks/quick-add";
import { deleteProjectAction, updateProjectAction } from "../actions";
import type { BusinessOption } from "../new-project-form";

export function ProjectHeader({
  project,
  businesses,
}: {
  project: {
    id: string;
    name: string;
    description: string | null;
    businessId: string | null;
    /** yyyy-mm-dd, for the date input */
    dueDate: string | null;
  };
  businesses: BusinessOption[];
}) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (editing) {
    return (
      <form
        action={async (formData) => {
          setSaving(true);
          try {
            await updateProjectAction(project.id, formData);
            setEditing(false);
          } finally {
            setSaving(false);
          }
        }}
        className="mt-3 space-y-3 rounded-3xl border border-border bg-surface p-4 sm:p-5"
      >
        <input
          name="name"
          defaultValue={project.name}
          required
          maxLength={200}
          aria-label="Project name"
          className="min-h-11 w-full px-3.5 font-serif text-xl"
        />
        <div className="grid gap-2 sm:grid-cols-2">
          <select
            name="businessId"
            aria-label="Business"
            defaultValue={project.businessId ?? ""}
            className="min-h-11 px-3 text-base sm:text-sm"
          >
            <option value="">No business</option>
            {businesses.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
          <input
            type="date"
            name="dueDate"
            aria-label="Due date"
            defaultValue={project.dueDate ?? ""}
            className="min-h-11 px-3 text-base sm:text-sm"
          />
        </div>
        <textarea
          name="description"
          defaultValue={project.description ?? ""}
          placeholder="Description"
          maxLength={2000}
          rows={2}
          aria-label="Description"
          className="w-full px-3.5 py-2.5 text-base sm:text-sm"
        />
        <div className="flex flex-wrap items-center gap-2">
          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </Button>
          <Button type="button" variant="ghost" onClick={() => setEditing(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="ghost"
            disabled={isPending}
            onClick={() => {
              if (confirm(`Delete "${project.name}"? Its tasks will be kept but unlinked.`)) {
                startTransition(() => deleteProjectAction(project.id));
              }
            }}
            className="ml-auto text-danger hover:bg-danger-soft"
          >
            Delete project
          </Button>
        </div>
      </form>
    );
  }

  return (
    <div className="mt-3 flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
      <div className="min-w-0">
        <h1 className="font-serif text-4xl leading-[1.05] sm:text-5xl">{project.name}</h1>
        {project.description && (
          <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-muted">{project.description}</p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="min-h-11 rounded-xl border border-border-strong bg-surface px-4 text-sm transition hover:bg-foreground/5 active:scale-[0.98]"
        >
          Edit
        </button>
        <FocusQuickAddButton
          label="Add task"
          className="inline-flex min-h-11 items-center rounded-xl bg-foreground px-5 text-sm font-medium text-background shadow-[0_1px_0_rgba(0,0,0,0.05)] transition hover:bg-foreground/85 active:scale-[0.98]"
        />
      </div>
    </div>
  );
}
