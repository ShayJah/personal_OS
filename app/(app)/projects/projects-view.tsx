import Link from "next/link";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";
import { STATUS_META, STATUS_ORDER, type ProjectStatus } from "@/lib/project-health";
import { NewProjectForm, type BusinessOption } from "./new-project-form";

export type ProjectCardData = {
  id: string;
  name: string;
  business: { id: string; name: string; color: string } | null;
  status: ProjectStatus;
  completed: number;
  total: number;
  pct: number;
  next: string | null;
  dueLabel: string | null;
};

export type ProjectsViewProps = {
  projects: ProjectCardData[];
  /** Counts across all projects, ignoring the active filter. */
  counts: Record<ProjectStatus, number>;
  total: number;
  filter: ProjectStatus | "all";
  businesses: BusinessOption[];
};

function StatusPill({ status }: { status: ProjectStatus }) {
  const meta = STATUS_META[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs", meta.soft, meta.text)}>
      <span aria-hidden="true" className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
      {meta.label}
    </span>
  );
}

export { StatusPill };

export function ProjectsView({ projects, counts, total, filter, businesses }: ProjectsViewProps) {
  const attention = counts.at_risk + counts.behind;

  const pills: { value: ProjectStatus | "all"; label: string; count: number }[] = [
    { value: "all", label: "All", count: total },
    ...STATUS_ORDER.filter((s) => counts[s] > 0).map((s) => ({
      value: s,
      label: STATUS_META[s].label,
      count: counts[s],
    })),
  ];

  return (
    <div className="mx-auto w-full max-w-6xl pb-16 md:pb-0">
      <header className="mb-5 flex items-end justify-between gap-3 sm:mb-6">
        <div>
          <p className="eyebrow">Build</p>
          <h1 className="mt-1 font-serif text-4xl sm:text-5xl">Projects</h1>
          <p className="mt-2 text-sm text-muted">
            {total} {total === 1 ? "project" : "projects"}
            {total > 0 && (
              <>
                {" · "}
                {counts.on_track} on track
                {attention > 0 && (
                  <>
                    {" · "}
                    <span className="text-danger">{attention} need attention</span>
                  </>
                )}
              </>
            )}
          </p>
        </div>
        <NewProjectForm businesses={businesses} />
      </header>

      {total > 0 && (
        <nav aria-label="Project status" className="mb-5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex w-max gap-2">
            {pills.map((pill) => {
              const active = filter === pill.value;
              return (
                <Link
                  key={pill.value}
                  href={pill.value === "all" ? "/projects" : `/projects?status=${pill.value}`}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex min-h-10 items-center gap-2 whitespace-nowrap rounded-full border px-4 text-sm transition",
                    active
                      ? "border-foreground bg-foreground text-background"
                      : "border-border-strong bg-surface text-foreground hover:bg-foreground/5"
                  )}
                >
                  {pill.value !== "all" && (
                    <span aria-hidden="true" className={cn("h-1.5 w-1.5 rounded-full", STATUS_META[pill.value].dot)} />
                  )}
                  {pill.label}
                  <span className={cn("font-mono text-xs", active ? "opacity-70" : "text-muted")}>{pill.count}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}

      {projects.length === 0 ? (
        <EmptyState
          title={total === 0 ? "No projects yet" : "No projects with this status"}
          description={total === 0 ? "Create one to start grouping related tasks." : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => {
            const meta = STATUS_META[project.status];
            return (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="group flex min-w-0 flex-col rounded-3xl border border-border bg-surface p-5 shadow-[0_1px_2px_rgba(33,24,16,0.04)] transition hover:border-border-strong hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <StatusPill status={project.status} />
                  <span aria-hidden="true" className="text-muted transition group-hover:translate-x-0.5 group-hover:text-foreground">
                    →
                  </span>
                </div>

                <h2 className="mt-3 font-serif text-2xl leading-tight">{project.name}</h2>

                {project.business && (
                  <span className="mt-2 inline-flex w-fit max-w-full items-center gap-1.5 rounded-full bg-surface-sunken px-2.5 py-0.5 text-xs text-foreground/80">
                    <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: project.business.color }} />
                    <span className="truncate">{project.business.name}</span>
                  </span>
                )}

                <div className="mt-auto pt-5">
                  <div className="flex items-baseline justify-between text-xs text-muted">
                    <span>
                      {project.completed} of {project.total} tasks
                    </span>
                    <span className={cn("font-mono", meta.text)}>{project.pct}%</span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-sunken">
                    <div className={cn("h-full rounded-full", meta.bar)} style={{ width: `${project.pct}%` }} />
                  </div>
                  <div className="mt-3 flex items-baseline justify-between gap-3 text-xs text-muted">
                    <span className="min-w-0 truncate">
                      Next:{" "}
                      <span className="text-foreground">
                        {project.next ?? (project.status === "done" ? "All done" : "Add a task")}
                      </span>
                    </span>
                    {project.dueLabel && <span className="shrink-0">Due {project.dueLabel}</span>}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
