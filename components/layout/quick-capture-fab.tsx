"use client";

import { useState } from "react";
import { QuickCaptureComposer } from "@/components/capture/quick-capture-composer";

export function QuickCaptureFab() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Quick capture"
        aria-expanded={open}
        aria-controls="quick-capture-sheet"
        className="fixed right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-foreground text-background shadow-lg active:scale-95 md:hidden"
        style={{ bottom: "calc(4.5rem + env(safe-area-inset-bottom))" }}
      >
        <svg width="22" height="22" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path d="M10 3v14M3 10h14" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
        </svg>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Close quick capture"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-foreground/30"
          />
          <div
            id="quick-capture-sheet"
            role="dialog"
            aria-label="Quick capture"
            className="absolute inset-x-0 bottom-0 rounded-t-2xl border-t border-border bg-surface p-4"
            style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
          >
            <p className="eyebrow mb-3">Quick capture</p>
            <QuickCaptureComposer autoFocus onDone={() => setOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
