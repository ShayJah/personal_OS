import Link from "next/link";
import { requireSession } from "@/lib/auth/dal";
import { listTasks, type TaskFilter } from "@/lib/tasks";
import { listProjectsWithProgress } from "@/lib/projects";
import { cn } from "@/lib/utils";
import { TaskList } from "./task-list";
import { NewTaskForm } from "./new-task-form";

const FILTERS: { value: TaskFilter; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "upcoming", label: "Upcoming" },
  { value: "all", label: "All open" },
  { value: "completed", label: "Completed" },
];

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const session = await requireSession();
  const { filter: filterParam } = await searchParams;
  const filter: TaskFilter = FILTERS.some((f) => f.value === filterParam)
    ? (filterParam as TaskFilter)
    : "today";

  const [tasks, projects] = await Promise.all([
    listTasks(session.user.id, filter),
    listProjectsWithProgress(session.user.id),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Plan</p>
        <h1 className="mt-1 font-serif text-3xl">Tasks</h1>
        <p className="mt-1 text-sm text-muted">
          Everything you need to get done.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav className="flex gap-1 rounded-lg border border-border-strong p-1">
          {FILTERS.map((f) => (
            <Link
              key={f.value}
              href={`/tasks?filter=${f.value}`}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm",
                filter === f.value
                  ? "bg-foreground text-background"
                  : "text-muted hover:text-foreground"
              )}
            >
              {f.label}
            </Link>
          ))}
        </nav>

        <NewTaskForm projects={projects} />
      </div>

      <TaskList
        tasks={tasks}
        projects={projects}
        emptyMessage={
          filter === "completed"
            ? "Nothing completed yet."
            : "Nothing here — add a task to get started."
        }
      />
    </div>
  );
}
