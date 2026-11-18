"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { createProjectAction } from "./actions";

export type BusinessOption = { id: string; name: string };

export function NewProjectForm({ businesses }: { businesses: BusinessOption[] }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        className="inline-flex min-h-11 shrink-0 items-center whitespace-nowrap rounded-xl bg-foreground px-4 text-sm font-medium text-background shadow-[0_1px_0_rgba(0,0,0,0.05)] transition hover:bg-foreground/85 active:scale-[0.98] sm:px-5"
      >
        <span aria-hidden="true" className="mr-1.5 text-base leading-none">+</span>
        New project
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
          <button
            type="button"
            aria-label="Close"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-foreground/30"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="New project"
            className="relative w-full max-w-md rounded-t-3xl border border-border bg-surface p-5 shadow-xl sm:rounded-3xl sm:p-6"
            style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))" }}
          >
            <p className="eyebrow">Build</p>
            <h2 className="mt-1 font-serif text-2xl">New project</h2>

            <form
              ref={formRef}
              action={async (formData) => {
                setSaving(true);
                try {
                  await createProjectAction(formData);
                  formRef.current?.reset();
                  setOpen(false);
                } finally {
                  setSaving(false);
                }
              }}
              className="mt-4 space-y-3"
            >
              <input
                name="name"
                placeholder="Project name"
                required
                autoFocus
                maxLength={200}
                aria-label="Project name"
                className="min-h-11 w-full px-3.5 text-base sm:text-sm"
              />
              <div className="grid grid-cols-2 gap-2">
                <select
                  name="businessId"
                  aria-label="Business"
                  defaultValue=""
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
                  className="min-h-11 px-3 text-base sm:text-sm"
                />
              </div>
              <textarea
                name="description"
                placeholder="Description (optional)"
                maxLength={2000}
                rows={2}
                aria-label="Description"
                className="w-full px-3.5 py-2.5 text-base sm:text-sm"
              />
              <div className="flex items-center justify-end gap-2 pt-1">
                <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? "Creating…" : "Create project"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
