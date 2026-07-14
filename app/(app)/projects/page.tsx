import Link from "next/link";
import { requireSession } from "@/lib/auth/dal";
import { listProjectsWithProgress } from "@/lib/projects";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { NewProjectForm } from "./new-project-form";

export default async function ProjectsPage() {
  const session = await requireSession();
  const projects = await listProjectsWithProgress(session.user.id);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="eyebrow">Organize</p>
          <h1 className="mt-1 font-serif text-3xl">Projects</h1>
          <p className="mt-1 text-sm text-muted">
            Group related tasks together.
          </p>
        </div>
        <NewProjectForm />
      </div>

      {projects.length === 0 ? (
        <EmptyState
          title="No projects yet"
          description="Create one to start grouping related tasks."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => {
            const pct =
              project.taskCount === 0
                ? 0
                : Math.round(
                    (project.completedCount / project.taskCount) * 100
                  );
            return (
              <Link key={project.id} href={`/projects/${project.id}`}>
                <Card className="h-full transition hover:border-foreground/30">
                  <h2 className="truncate font-serif text-lg">{project.name}</h2>
                  {project.description && (
                    <p className="mt-1 line-clamp-2 text-sm text-muted">
                      {project.description}
                    </p>
                  )}
                  <div className="mt-4 space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-muted">
                      <span>
                        {project.completedCount}/{project.taskCount} tasks
                      </span>
                      <span>{pct}%</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-foreground/10">
                      <div
                        className="h-full rounded-full bg-accent"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
