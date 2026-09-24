"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { createBusinessAction } from "./actions";

export function NewBusinessForm() {
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
        New business
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
          <button type="button" aria-label="Close" onClick={() => setOpen(false)} className="absolute inset-0 bg-foreground/30" />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="New business"
            className="relative w-full max-w-md rounded-t-3xl border border-border bg-surface p-5 shadow-xl sm:rounded-3xl sm:p-6"
            style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))" }}
          >
            <p className="eyebrow">Run</p>
            <h2 className="mt-1 font-serif text-2xl">New business</h2>
            <form
              ref={formRef}
              action={async (formData) => {
                setSaving(true);
                try {
                  await createBusinessAction(formData);
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
                placeholder="Business name"
                required
                autoFocus
                maxLength={200}
                aria-label="Business name"
                className="min-h-11 w-full px-3.5 text-base sm:text-sm"
              />
              <textarea
                name="description"
                placeholder="What does it do? (optional)"
                rows={3}
                maxLength={2000}
                aria-label="Description"
                className="w-full px-3.5 py-2.5 text-base sm:text-sm"
              />
              <div className="flex items-center justify-end gap-2 pt-1">
                <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? "Creating…" : "Create business"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
