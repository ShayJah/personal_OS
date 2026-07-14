"use client";

import { useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createProjectAction } from "./actions";

export function NewProjectForm() {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  if (!open) {
    return (
      <Button
        variant="ghost"
        onClick={() => setOpen(true)}
        aria-expanded={false}
        className="w-fit"
      >
        + New project
      </Button>
    );
  }

  return (
    <Card>
      <form
        ref={formRef}
        action={async (formData) => {
          setSaving(true);
          await createProjectAction(formData);
          formRef.current?.reset();
          setSaving(false);
          setOpen(false);
        }}
        className="space-y-3"
      >
        <input
          name="name"
          placeholder="Project name"
          required
          maxLength={200}
          className="w-full rounded-lg border border-border-strong px-3 py-2 text-sm"
        />
        <textarea
          name="description"
          placeholder="Description (optional)"
          maxLength={2000}
          rows={2}
          className="w-full rounded-lg border border-border-strong px-3 py-2 text-sm"
        />
        <div className="flex items-center gap-2">
          <Button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Create project"}
          </Button>
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}
