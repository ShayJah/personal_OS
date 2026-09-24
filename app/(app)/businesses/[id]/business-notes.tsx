"use client";

import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { updateBusinessNoteAction } from "./actions";

const SAVE_DELAY_MS = 800;

export function BusinessNotes({
  businessId,
  initialNote,
}: {
  businessId: string;
  initialNote: string;
}) {
  const [value, setValue] = useState(initialNote);
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  function handleChange(next: string) {
    setValue(next);
    setStatus("idle");
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(async () => {
      setStatus("saving");
      await updateBusinessNoteAction(businessId, next);
      setStatus("saved");
    }, SAVE_DELAY_MS);
  }

  return (
    <Card className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="eyebrow">Notes</p>
        <span className="text-xs text-muted">
          {status === "saving" ? "Saving…" : status === "saved" ? "Saved" : ""}
        </span>
      </div>
      <textarea
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Freeform notes for this business — context, plans, anything worth remembering. Autosaves as you type."
        rows={6}
        className="w-full resize-y rounded-lg border border-border-strong bg-transparent px-3 py-2 text-sm leading-relaxed focus:outline-none focus:ring-1 focus:ring-foreground/20"
      />
    </Card>
  );
}
