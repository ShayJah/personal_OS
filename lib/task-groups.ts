const DAY_MS = 86_400_000;

export type TaskTone = "overdue" | "today" | "normal";

export type TaskItemData = {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
  /** ISO string; date-only values are stored at UTC midnight. */
  dueDate: string | null;
  priority: number | null;
  tags: string[];
  section: string | null;
  projectId: string | null;
  project: { id: string; name: string; color: string } | null;
  dueLabel: string | null;
  tone: TaskTone;
};

export type TaskSection = {
  key: string;
  title: string;
  tone?: "overdue";
  tasks: TaskItemData[];
};

const utcDay = (d: Date) => Math.floor(d.getTime() / DAY_MS);

const fmt = (d: Date, opts: Intl.DateTimeFormatOptions) =>
  d.toLocaleDateString(undefined, { ...opts, timeZone: "UTC" });

export function describeDue(
  dueDate: Date | null,
  today: Date
): { label: string | null; tone: TaskTone } {
  if (!dueDate) return { label: null, tone: "normal" };
  const diff = utcDay(dueDate) - utcDay(today);
  if (diff < -1) return { label: `${-diff} days overdue`, tone: "overdue" };
  if (diff === -1) return { label: "Yesterday", tone: "overdue" };
  if (diff === 0) return { label: "Today", tone: "today" };
  if (diff === 1) return { label: "Tomorrow", tone: "normal" };
  if (diff < 7) return { label: fmt(dueDate, { weekday: "short" }), tone: "normal" };
  return { label: fmt(dueDate, { month: "short", day: "numeric" }), tone: "normal" };
}

/** First day (UTC) of next week — weeks run Monday to Sunday, matching the calendar. */
export function endOfWeek(today: Date): Date {
  const day = today.getUTCDay();
  return new Date(today.getTime() + (day === 0 ? 1 : 8 - day) * DAY_MS);
}

export function groupByDue(tasks: TaskItemData[], today: Date): TaskSection[] {
  const weekEnd = endOfWeek(today).getTime();
  const sections: TaskSection[] = [
    { key: "overdue", title: "Overdue", tone: "overdue", tasks: [] },
    { key: "week", title: "This week", tasks: [] },
    { key: "later", title: "Later", tasks: [] },
    { key: "none", title: "No date", tasks: [] },
  ];
  for (const task of tasks) {
    const due = task.dueDate ? new Date(task.dueDate) : null;
    const i = !due
      ? 3
      : due < today
        ? 0
        : due.getTime() < weekEnd
          ? 1
          : 2;
    sections[i].tasks.push(task);
  }
  return sections.filter((s) => s.tasks.length > 0);
}

export function groupByProject(
  tasks: TaskItemData[],
  projects: { id: string; name: string }[]
): TaskSection[] {
  const sections: TaskSection[] = projects.map((p) => ({
    key: p.id,
    title: p.name,
    tasks: tasks.filter((t) => t.projectId === p.id),
  }));
  sections.push({
    key: "none",
    title: "No project",
    tasks: tasks.filter((t) => !t.projectId),
  });
  return sections.filter((s) => s.tasks.length > 0);
}

/** Stable per-project color from the app's semantic palette. */
const PALETTE = ["--accent", "--info", "--violet", "--success", "--warning", "--danger"];
export function projectColor(index: number): string {
  return `var(${PALETTE[index % PALETTE.length]})`;
}
