"use client";

import { useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { ProjectOption } from "./task-form";
import { createTaskAction } from "./actions";

export const QUICK_ADD_ID = "quick-add-title";

function isoDay(offset: number) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toLocaleDateString("en-CA"); // YYYY-MM-DD in the viewer's timezone
}

const chip =
  "inline-flex min-h-9 items-center rounded-full border px-3 text-xs transition active:scale-[0.97]";

export function FocusQuickAddButton({
  className,
  label = "New task",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => {
        const el = document.getElementById(QUICK_ADD_ID);
        el?.scrollIntoView({ block: "center", behavior: "smooth" });
        el?.focus({ preventScroll: true });
      }}
      className={className}
    >
      <span aria-hidden="true" className="mr-1.5 text-base leading-none">+</span>
      {label}
    </button>
  );
}

export function QuickAdd({
  projects,
  defaultProjectId,
  hideProject = false,
  sections,
}: {
  projects: ProjectOption[];
  defaultProjectId?: string;
  /** Project pages fix the project, so the picker is replaced by a hidden field. */
  hideProject?: boolean;
  /** When set, shows a Section field suggesting these names. */
  sections?: string[];
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [due, setDue] = useState("");
  const [projectId, setProjectId] = useState(defaultProjectId ?? "");
  const [high, setHigh] = useState(false);
  const [section, setSection] = useState("");
  const [saving, setSaving] = useState(false);

  const today = isoDay(0);
  const tomorrow = isoDay(1);
  const hasOptions = Boolean(due || high || section || (projectId && projectId !== defaultProjectId));

  return (
    <form
      action={async (formData) => {
        if (!title.trim()) return;
        setSaving(true);
        try {
          await createTaskAction(formData);
          setTitle("");
          setDue("");
          setHigh(false);
          inputRef.current?.focus(); // stay ready for the next one
        } finally {
          setSaving(false);
        }
      }}
      className="group rounded-2xl border border-border-strong bg-surface p-1.5 shadow-[0_1px_2px_rgba(33,24,16,0.04)] focus-within:border-accent focus-within:shadow-[0_0_0_3px_var(--accent-soft)]"
    >
      <div className="flex items-center gap-2 pl-3">
        <span aria-hidden="true" className="text-lg leading-none text-muted-soft">+</span>
        <input
          id={QUICK_ADD_ID}
          ref={inputRef}
          name="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Add a task…"
          maxLength={300}
          autoComplete="off"
          enterKeyHint="done"
          aria-label="New task"
          className="min-h-11 min-w-0 flex-1 !border-transparent !bg-transparent !shadow-none px-1 text-base sm:text-sm"
        />
        <button
          type="submit"
          disabled={saving || !title.trim()}
          className="mr-1 min-h-9 shrink-0 rounded-lg bg-foreground px-4 text-sm font-medium text-background transition hover:bg-foreground/85 active:scale-[0.98] disabled:opacity-30"
        >
          {saving ? "Adding…" : "Add"}
        </button>
      </div>

      {/* Optional details: appear once you focus the bar, stay if you set one. */}
      <div
        className={cn(
          "flex-wrap items-center gap-2 px-3 pb-2 pt-1.5",
          hasOptions ? "flex" : "hidden group-focus-within:flex"
        )}
      >
        <button
          type="button"
          onClick={() => setDue(due === today ? "" : today)}
          aria-pressed={due === today}
          className={cn(chip, due === today ? "border-foreground bg-foreground text-background" : "border-border-strong text-muted")}
        >
          Today
        </button>
        <button
          type="button"
          onClick={() => setDue(due === tomorrow ? "" : tomorrow)}
          aria-pressed={due === tomorrow}
          className={cn(chip, due === tomorrow ? "border-foreground bg-foreground text-background" : "border-border-strong text-muted")}
        >
          Tomorrow
        </button>
        <input
          type="date"
          name="dueDate"
          value={due}
          onChange={(e) => setDue(e.target.value)}
          aria-label="Due date"
          className="!min-h-9 !rounded-full px-3 text-xs"
        />
        {hideProject ? (
          <input type="hidden" name="projectId" value={defaultProjectId ?? ""} />
        ) : (
          <select
            name="projectId"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            aria-label="Project"
            className="!min-h-9 !rounded-full px-3 text-xs"
          >
            <option value="">No project</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        )}
        {sections && (
          <>
            <input
              name="section"
              value={section}
              onChange={(e) => setSection(e.target.value)}
              list="quick-add-sections"
              placeholder="Section"
              aria-label="Section"
              maxLength={60}
              className="!min-h-9 w-32 !rounded-full px-3 text-xs"
            />
            <datalist id="quick-add-sections">
              {sections.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
          </>
        )}
        <button
          type="button"
          onClick={() => setHigh(!high)}
          aria-pressed={high}
          className={cn(chip, high ? "border-warning bg-warning-soft text-warning" : "border-border-strong text-muted")}
        >
          High priority
        </button>
        {high && <input type="hidden" name="priority" value="1" />}
      </div>
    </form>
  );
}
