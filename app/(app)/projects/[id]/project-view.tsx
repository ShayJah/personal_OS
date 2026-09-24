import Link from "next/link";
import { cn } from "@/lib/utils";
import { STATUS_META, type Pace, type ProjectStatus, paceLabel } from "@/lib/project-health";
import type { TaskItemData } from "@/lib/task-groups";
import { TaskItem } from "@/app/(app)/tasks/task-item";
import { QuickAdd } from "@/app/(app)/tasks/quick-add";
import { StatusPill } from "../projects-view";
import type { BusinessOption } from "../new-project-form";
import { ProjectHeader } from "./project-header";

export type ProjectSection = {
  key: string;
  title: string;
  done: number;
  total: number;
  tasks: TaskItemData[];
};

export type ProjectViewProps = {
  project: {
    id: string;
    name: string;
    description: string | null;
    dueDateInput: string | null;
    dueLabel: string | null;
    startedLabel: string;
    business: { id: string; name: string; color: string } | null;
  };
  status: ProjectStatus;
  pct: number;
  pace: Pace | null;
  completed: number;
  total: number;
  sections: ProjectSection[];
  sectionNames: string[];
  businesses: BusinessOption[];
};

export function ProjectView({
  project,
  status,
  pct,
  pace,
  completed,
  total,
  sections,
  sectionNames,
  businesses,
}: ProjectViewProps) {
  const meta = STATUS_META[status];
  const taskProjects = [{ id: project.id, name: project.name }];

  return (
    <div className="mx-auto w-full max-w-6xl pb-16 md:pb-0">
      <nav aria-label="Breadcrumb" className="flex items-center gap-3 text-sm">
        <Link
          href="/projects"
          className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-border-strong bg-surface px-3.5 transition hover:bg-foreground/5"
        >
          <span aria-hidden="true">←</span> Back
        </Link>
        <span className="hidden items-center gap-2 text-muted sm:flex">
          <Link href="/projects" className="hover:text-foreground">
            Projects
          </Link>
          <span aria-hidden="true">›</span>
          <span className="max-w-xs truncate text-foreground">{project.name}</span>
        </span>
      </nav>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <StatusPill status={status} />
        {project.business && (
          <Link
            href={`/businesses/${project.business.id}`}
            className="inline-flex items-center gap-1.5 rounded-full border border-border-strong bg-surface px-2.5 py-1 text-xs hover:bg-foreground/5"
          >
            <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full" style={{ background: project.business.color }} />
            {project.business.name}
          </Link>
        )}
      </div>

      <ProjectHeader
        project={{
          id: project.id,
          name: project.name,
          description: project.description,
          businessId: project.business?.id ?? null,
          dueDate: project.dueDateInput,
        }}
        businesses={businesses}
      />

      <section
        aria-label="Progress"
        className="mt-6 grid gap-5 rounded-3xl border border-border bg-surface p-5 shadow-[0_1px_2px_rgba(33,24,16,0.04)] sm:p-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-10"
      >
        <div>
          <div className="flex items-baseline justify-between text-sm">
            <span>Progress</span>
            <span className={cn("font-mono", meta.text)}>{pct}%</span>
          </div>
          <div
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
            className="mt-2 h-2 overflow-hidden rounded-full bg-surface-sunken"
          >
            <div className={cn("h-full rounded-full", meta.bar)} style={{ width: `${pct}%` }} />
          </div>
        </div>

        <dl className="flex flex-wrap gap-x-8 gap-y-4">
          <div>
            <dt className="text-xs text-muted">Tasks</dt>
            <dd className="mt-0.5 font-mono text-xl">
              {completed} / {total}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Due</dt>
            <dd className="mt-0.5 font-mono text-xl">{project.dueLabel ?? "—"}</dd>
          </div>
          {pace && (
            <div>
              <dt className="text-xs text-muted">Pace</dt>
              <dd
                className={cn(
                  "mt-0.5 font-mono text-xl",
                  pace.kind === "ahead" && "text-success",
                  pace.kind === "behind" && "text-danger"
                )}
              >
                {paceLabel(pace)}
              </dd>
            </div>
          )}
        </dl>
      </section>

      <div className="mt-6 grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-8">
        <div className="min-w-0 space-y-6">
          <QuickAdd projects={taskProjects} defaultProjectId={project.id} hideProject sections={sectionNames} />

          {sections.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border-strong px-6 py-12 text-center text-sm text-muted">
              No tasks yet. Add the first one above.
            </p>
          ) : (
            sections.map((section) => (
              <section key={section.key} aria-label={section.title}>
                <div className="flex items-baseline gap-2 border-b border-border-strong pb-2">
                  <h2 className="!font-sans text-sm font-semibold">{section.title}</h2>
                  <span className="font-mono text-xs text-muted">
                    {section.done}/{section.total}
                  </span>
                </div>
                <ul>
                  {section.tasks.map((task) => (
                    <TaskItem key={task.id} task={task} projects={taskProjects} hideProject sections={sectionNames} />
                  ))}
                </ul>
              </section>
            ))
          )}
        </div>

        <aside className="rounded-3xl border border-border bg-surface p-5 shadow-[0_1px_2px_rgba(33,24,16,0.04)] lg:sticky lg:top-8">
          <p className="eyebrow">Details</p>
          <dl className="mt-3 divide-y divide-border-strong text-sm">
            <div className="flex items-center justify-between gap-4 py-3">
              <dt className="text-muted">Business</dt>
              <dd>
                {project.business ? (
                  <Link href={`/businesses/${project.business.id}`} className="hover:underline">
                    {project.business.name}
                  </Link>
                ) : (
                  <span className="text-muted-soft">None</span>
                )}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4 py-3">
              <dt className="text-muted">Started</dt>
              <dd>{project.startedLabel}</dd>
            </div>
            <div className="flex items-center justify-between gap-4 py-3">
              <dt className="text-muted">Due</dt>
              <dd>{project.dueLabel ?? <span className="text-muted-soft">No date</span>}</dd>
            </div>
            <div className="flex items-center justify-between gap-4 py-3">
              <dt className="text-muted">Status</dt>
              <dd className={meta.text}>{meta.label}</dd>
            </div>
          </dl>
        </aside>
      </div>
    </div>
  );
}
