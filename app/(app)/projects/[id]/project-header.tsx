"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { deleteProjectAction, updateProjectAction } from "../actions";

export function ProjectHeader({
  project,
}: {
  project: { id: string; name: string; description: string | null };
}) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (editing) {
    return (
      <form
        action={async (formData) => {
          setSaving(true);
          await updateProjectAction(project.id, formData);
          setSaving(false);
          setEditing(false);
        }}
        className="space-y-3"
      >
        <input
          name="name"
          defaultValue={project.name}
          required
          maxLength={200}
          className="w-full rounded-lg border border-border-strong px-3 py-2 text-lg font-semibold"
        />
        <textarea
          name="description"
          defaultValue={project.description ?? ""}
          maxLength={2000}
          rows={2}
          className="w-full rounded-lg border border-border-strong px-3 py-2 text-sm"
        />
        <div className="flex items-center gap-2">
          <Button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save changes"}
          </Button>
          <Button type="button" variant="ghost" onClick={() => setEditing(false)}>
            Cancel
          </Button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="eyebrow">Project</p>
        <h1 className="mt-1 font-serif text-3xl">{project.name}</h1>
        {project.description && (
          <p className="mt-1 text-sm text-muted">
            {project.description}
          </p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Button variant="ghost" onClick={() => setEditing(true)} aria-expanded={editing}>
          Edit
        </Button>
        <Button
          variant="ghost"
          disabled={isPending}
          onClick={() => {
            if (confirm(`Delete "${project.name}"? Its tasks will be kept but unlinked.`)) {
              startTransition(() => deleteProjectAction(project.id));
            }
          }}
          className="text-danger hover:bg-danger-soft"
        >
          Delete
        </Button>
      </div>
    </div>
  );
}
