"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { createCaptureAction } from "@/app/(app)/capture/actions";

export function QuickCaptureFab() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <div
      className="fixed right-4 z-40 flex flex-col items-end gap-3 md:hidden"
      style={{ bottom: "calc(4.5rem + env(safe-area-inset-bottom))" }}
    >
      {open && (
        <form
          ref={formRef}
          action={async (formData) => {
            startTransition(async () => {
              await createCaptureAction(formData);
              formRef.current?.reset();
              setOpen(false);
            });
          }}
          className="w-64 rounded-2xl border border-border bg-surface p-3 shadow-lg"
        >
          <input type="hidden" name="type" value="text" />
          <textarea
            name="content"
            autoFocus
            required
            maxLength={5000}
            rows={3}
            placeholder="Quick note..."
            className="w-full resize-none rounded-lg border border-border-strong bg-surface px-3 py-2 text-sm"
          />
          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-1.5 text-xs text-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-lg bg-foreground px-3 py-1.5 text-xs font-medium text-background disabled:opacity-50"
            >
              {isPending ? "Adding..." : "Add"}
            </button>
          </div>
        </form>
      )}

      <div className="flex flex-col gap-2.5">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label="Quick note"
          aria-expanded={open}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-foreground text-background shadow-lg active:scale-95"
        >
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path
              d="M14.2 2.8a1.7 1.7 0 0 1 2.4 2.4L6 15.8l-3.2.8.8-3.2 10.6-10.6Z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <Link
          href="/capture"
          aria-label="Voice capture"
          className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-background shadow-lg active:scale-95"
        >
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <rect x="7" y="2" width="6" height="10" rx="3" stroke="currentColor" strokeWidth="1.5" />
            <path d="M4 9.5a6 6 0 0 0 12 0M10 15.5v2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
