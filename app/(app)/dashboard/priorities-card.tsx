"use client";

import { useEffect, useRef, useState } from "react";
import { saveTodayPriorities } from "./actions";

const SLOTS = [0, 1, 2];

export function Priorities({ initial }: { initial: string[] }) {
  const formRef = useRef<HTMLFormElement>(null);
  const saved = useRef(initial.join("\n"));
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");

  // Server data changed underneath us (e.g. "Set as my Top 3" on a suggestion):
  // uncontrolled inputs won't pick that up, so push it in — unless it's just
  // the echo of our own save, which `saved` already matches.
  const incoming = initial.join("\n");
  useEffect(() => {
    if (incoming === saved.current) return;
    saved.current = incoming;
    formRef.current
      ?.querySelectorAll<HTMLInputElement>('input[name="priority"]')
      .forEach((input, i) => {
        input.value = initial[i] ?? "";
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incoming]);

  async function save() {
    const form = formRef.current;
    if (!form) return;
    const formData = new FormData(form);
    const snapshot = formData.getAll("priority").map((v) => String(v).trim()).join("\n");
    if (snapshot === saved.current) return;

    setStatus("saving");
    await saveTodayPriorities(formData);
    saved.current = snapshot;
    setStatus("saved");
  }

  return (
    <section aria-labelledby="top3-heading">
      <div className="flex items-baseline justify-between">
        <p id="top3-heading" className="eyebrow">
          Top 3 for today
        </p>
        <span aria-live="polite" className="text-xs text-muted-soft">
          {status === "saving" ? "Saving…" : status === "saved" ? "Saved" : ""}
        </span>
      </div>

      <form
        ref={formRef}
        onSubmit={(e) => {
          e.preventDefault();
          (document.activeElement as HTMLElement | null)?.blur();
        }}
        className="mt-3 space-y-1"
      >
        {SLOTS.map((i) => (
          <label
            key={i}
            className="flex items-center gap-3 rounded-xl px-1 py-0.5 focus-within:bg-surface-sunken/60"
          >
            <span className="w-4 shrink-0 text-center font-mono text-sm text-muted-soft">
              {i + 1}
            </span>
            <input
              name="priority"
              defaultValue={initial[i] ?? ""}
              placeholder={i === 0 ? "What matters most today?" : "Add a priority"}
              maxLength={300}
              onBlur={save}
              aria-label={`Priority ${i + 1}`}
              className="min-h-11 min-w-0 flex-1 !border-transparent !bg-transparent px-2 text-base sm:text-sm"
            />
          </label>
        ))}
      </form>
    </section>
  );
}
