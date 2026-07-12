"use client";

import { useTransition } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { classifyCaptureAction, deleteCaptureAction } from "./actions";

export type CaptureRowData = {
  id: string;
  content: string;
  type: string;
  classified: string | null;
  createdAt: Date | string;
};

const CLASSIFICATIONS = [
  { value: "task", label: "Task" },
  { value: "idea", label: "Idea" },
  { value: "note", label: "Note" },
] as const;

export function CaptureRow({ capture }: { capture: CaptureRowData }) {
  const [isPending, startTransition] = useTransition();
  const createdAt = new Date(capture.createdAt);

  return (
    <Card className="space-y-2 py-3">
      <div className="flex items-start justify-between gap-2">
        <p className="whitespace-pre-wrap text-sm">{capture.content}</p>
        <button
          type="button"
          disabled={isPending}
          onClick={() => {
            if (confirm("Delete this capture?")) {
              startTransition(() => deleteCaptureAction(capture.id));
            }
          }}
          className="shrink-0 rounded-md px-2 py-1 text-xs text-foreground/40 hover:bg-red-500/10 hover:text-red-500"
        >
          Delete
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs text-foreground/40">
        <span>{capture.type === "voice" ? "🎙 voice" : "text"}</span>
        <span>
          {createdAt.toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
          })}
        </span>

        {capture.classified ? (
          <span
            className={cn(
              "rounded px-1.5 py-0.5",
              capture.classified === "task"
                ? "bg-green-500/10 text-green-600"
                : "bg-foreground/5"
            )}
          >
            {capture.classified === "task"
              ? "→ added to tasks"
              : capture.classified}
          </span>
        ) : (
          <div className="flex items-center gap-1">
            <span>Classify:</span>
            {CLASSIFICATIONS.map((c) => (
              <button
                key={c.value}
                type="button"
                disabled={isPending}
                onClick={() =>
                  startTransition(() =>
                    classifyCaptureAction(capture.id, c.value)
                  )
                }
                className="rounded bg-foreground/5 px-1.5 py-0.5 hover:bg-foreground/10 hover:text-foreground"
              >
                {c.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
