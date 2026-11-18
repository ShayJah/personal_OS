const DAY_MS = 86_400_000;

export type ProjectStatus = "on_track" | "at_risk" | "behind" | "not_started" | "done";

export const STATUS_META: Record<
  ProjectStatus,
  { label: string; text: string; soft: string; bar: string; dot: string }
> = {
  on_track: { label: "On track", text: "text-success", soft: "bg-success-soft", bar: "bg-success", dot: "bg-success" },
  at_risk: { label: "At risk", text: "text-warning", soft: "bg-warning-soft", bar: "bg-warning", dot: "bg-warning" },
  behind: { label: "Behind", text: "text-danger", soft: "bg-danger-soft", bar: "bg-danger", dot: "bg-danger" },
  not_started: { label: "Not started", text: "text-muted", soft: "bg-surface-sunken", bar: "bg-muted-soft", dot: "bg-muted-soft" },
  done: { label: "Done", text: "text-foreground", soft: "bg-surface-sunken", bar: "bg-foreground", dot: "bg-foreground" },
};

export const STATUS_ORDER: ProjectStatus[] = ["on_track", "at_risk", "behind", "not_started", "done"];

export type Pace = { kind: "ahead" | "behind" | "on"; days: number };

export type ProjectHealth = { status: ProjectStatus; pct: number; pace: Pace | null };

/**
 * Status is derived, not stored: it compares how much of the work is done with
 * how much of the schedule (start = createdAt, end = dueDate) has elapsed.
 */
export function computeProjectHealth(input: {
  total: number;
  completed: number;
  createdAt: Date;
  dueDate: Date | null;
  now?: Date;
}): ProjectHealth {
  const { total, completed, createdAt, dueDate } = input;
  const now = input.now ?? new Date();
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100);

  if (total > 0 && completed === total) return { status: "done", pct, pace: null };
  if (dueDate && now > dueDate) return { status: "behind", pct, pace: null };
  if (completed === 0) return { status: "not_started", pct, pace: null };
  if (!dueDate) return { status: "on_track", pct, pace: null };

  const duration = Math.max(DAY_MS, dueDate.getTime() - createdAt.getTime());
  const elapsed = Math.min(1, Math.max(0, (now.getTime() - createdAt.getTime()) / duration));
  const delta = completed / total - elapsed;
  const days = Math.round((delta * duration) / DAY_MS);

  const pace: Pace =
    days >= 1 ? { kind: "ahead", days } : days <= -1 ? { kind: "behind", days: -days } : { kind: "on", days: 0 };
  const status: ProjectStatus = delta >= -0.05 ? "on_track" : delta >= -0.2 ? "at_risk" : "behind";
  return { status, pct, pace };
}

export function paceLabel(pace: Pace): string {
  if (pace.kind === "on") return "On pace";
  return `${pace.kind === "ahead" ? "Ahead" : "Behind"} ${pace.days} ${pace.days === 1 ? "day" : "days"}`;
}

/** The next thing to do: earliest-due open task, then oldest. */
export function pickNextTask<T extends { completed: boolean; title: string; dueDate: Date | null; createdAt?: Date }>(
  tasks: T[]
): T | null {
  const open = tasks.filter((t) => !t.completed);
  if (open.length === 0) return null;
  return [...open].sort((a, b) => {
    const ad = a.dueDate?.getTime() ?? Infinity;
    const bd = b.dueDate?.getTime() ?? Infinity;
    if (ad !== bd) return ad - bd;
    return (a.createdAt?.getTime() ?? 0) - (b.createdAt?.getTime() ?? 0);
  })[0];
}

export function formatDay(date: Date, withYear = false): string {
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    ...(withYear && { year: "numeric" }),
    timeZone: "UTC",
  });
}

const PALETTE = ["--accent", "--info", "--violet", "--success", "--warning", "--danger"];
/** Stable color for an entity id (e.g. a business chip dot). */
export function colorForKey(key: string): string {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return `var(${PALETTE[h % PALETTE.length]})`;
}
