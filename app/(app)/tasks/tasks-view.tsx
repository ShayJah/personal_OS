import Link from "next/link";
import type { TaskFilter } from "@/lib/tasks";
import type { TaskItemData, TaskSection } from "@/lib/task-groups";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";
import { TaskItem } from "./task-item";
import { TaskToolbar } from "./task-toolbar";
import { QuickAdd, FocusQuickAddButton } from "./quick-add";
import { MoveToTodayButton, RescheduleAllButton } from "./task-actions";

export type TasksViewProps = {
  filter: TaskFilter;
  group: "due" | "project";
  projectId: string;
  projectOptions: { id: string; name: string }[];
  open: TaskItemData[];
  overdue: TaskItemData[];
  dueToday: TaskItemData[];
  upcomingCount: number;
  dueThisWeekCount: number;
  sections: TaskSection[];
  byProject: { id: string; name: string; color: string; count: number }[];
};

export function TasksView({
  filter,
  group,
  projectId,
  projectOptions,
  open,
  overdue,
  dueToday,
  upcomingCount,
  dueThisWeekCount,
  sections,
  byProject,
}: TasksViewProps) {
  const maxCount = Math.max(1, ...byProject.map((p) => p.count));

  return (
    <div className="mx-auto w-full max-w-6xl pb-16 md:pb-0">
      <header className="mb-5 flex items-end justify-between gap-3 sm:mb-6">
        <div>
          <p className="eyebrow">Plan</p>
          <h1 className="mt-1 font-serif text-4xl sm:text-5xl">Tasks</h1>
          <p className="mt-2 text-sm text-muted">
            {open.length} open
            {overdue.length > 0 && (
              <>
                {" · "}
                <span className="text-danger">{overdue.length} overdue</span>
              </>
            )}
            {" · "}
            {dueThisWeekCount} due this week
          </p>
        </div>
        <FocusQuickAddButton className="hidden min-h-11 items-center rounded-xl bg-foreground px-5 text-sm font-medium text-background shadow-[0_1px_0_rgba(0,0,0,0.05)] transition hover:bg-foreground/85 active:scale-[0.98] sm:inline-flex" />
      </header>

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-6">
        <div className="min-w-0 space-y-5">
          <TaskToolbar
            tabs={[
              { value: "all", label: "All open", count: open.length },
              { value: "today", label: "Today", count: dueToday.length },
              { value: "upcoming", label: "Upcoming", count: upcomingCount },
              { value: "completed", label: "Completed" },
            ]}
            filter={filter}
            group={group}
            projectId={projectId}
            projects={projectOptions}
          />

          <QuickAdd projects={projectOptions} defaultProjectId={projectId || undefined} />

          {sections.length === 0 ? (
            <EmptyState
              title={filter === "completed" ? "Nothing completed yet." : "Nothing here."}
              description={filter === "completed" ? undefined : "Type above and press Enter to add a task."}
            />
          ) : (
            <div className="space-y-6">
              {sections.map((section) => (
                <section key={section.key} aria-label={section.title}>
                  <div className="flex items-center justify-between border-b border-border-strong pb-2">
                    <h2
                      className={cn(
                        "!font-sans text-sm font-semibold",
                        section.tone === "overdue" && "text-danger"
                      )}
                    >
                      {section.title}{" "}
                      <span className="ml-1 font-mono text-xs font-normal text-muted">
                        {section.tasks.length}
                      </span>
                    </h2>
                    {section.tone === "overdue" && (
                      <RescheduleAllButton count={section.tasks.length} />
                    )}
                  </div>
                  <ul>
                    {section.tasks.map((task) => (
                      <TaskItem key={task.id} task={task} projects={projectOptions} />
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-8 lg:space-y-5">
          <section className="rounded-3xl border border-border bg-surface p-5 shadow-[0_1px_2px_rgba(33,24,16,0.04)]">
            <p className="eyebrow">Today</p>
            {dueToday.length > 0 ? (
              <ul className="mt-2">
                {dueToday.map((task) => (
                  <TaskItem key={task.id} task={task} projects={projectOptions} compact />
                ))}
              </ul>
            ) : (
              <>
                <p className="mt-3 font-serif text-2xl">Nothing is due today.</p>
                {overdue.length > 0 ? (
                  <>
                    <p className="mt-2 text-sm text-muted">
                      Pull a few overdue tasks in so the day has a plan.
                    </p>
                    <ul className="mt-3 divide-y divide-border-strong border-t border-border-strong">
                      {overdue.slice(0, 3).map((task) => (
                        <li key={task.id} className="flex items-center justify-between gap-3 py-3">
                          <span className="min-w-0">
                            <span className="block truncate text-sm">{task.title}</span>
                            <span className="block text-xs text-danger">{task.dueLabel}</span>
                          </span>
                          <MoveToTodayButton taskId={task.id} />
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <p className="mt-2 text-sm text-muted">Add a task above to plan the day.</p>
                )}
              </>
            )}
          </section>

          {byProject.length > 0 && (
            <section className="rounded-3xl border border-border bg-surface p-5 shadow-[0_1px_2px_rgba(33,24,16,0.04)]">
              <p className="eyebrow">Open by project</p>
              <ul className="mt-3 space-y-1">
                {byProject.map((p) => (
                  <li key={p.id || "none"}>
                    <Link
                      href={p.id ? `/tasks?project=${p.id}` : "/tasks"}
                      className="block min-h-11 rounded-lg py-1.5 hover:bg-surface-sunken/40"
                    >
                      <span className="flex items-baseline justify-between text-sm">
                        <span className="truncate">{p.name}</span>
                        <span className="font-mono text-xs text-muted">{p.count}</span>
                      </span>
                      <span className="mt-1.5 block h-1.5 rounded-full bg-surface-sunken">
                        <span
                          className="block h-full rounded-full"
                          style={{ width: `${(p.count / maxCount) * 100}%`, background: p.color }}
                        />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
