import { requireSession } from "@/lib/auth/dal";
import { getProjectDetail } from "@/lib/projects";
import { listProjectsWithProgress } from "@/lib/projects";
import { Card } from "@/components/ui/card";
import { TaskList } from "../../tasks/task-list";
import { NewTaskForm } from "../../tasks/new-task-form";
import { ProjectHeader } from "./project-header";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireSession();
  const { id } = await params;

  const [project, projects] = await Promise.all([
    getProjectDetail(session.user.id, id),
    listProjectsWithProgress(session.user.id),
  ]);

  const completedCount = project.tasks.filter((t) => t.completed).length;
  const pct =
    project.tasks.length === 0
      ? 0
      : Math.round((completedCount / project.tasks.length) * 100);

  const tasksWithProject = project.tasks.map((task) => ({
    ...task,
    project: { id: project.id, name: project.name },
  }));

  return (
    <div className="space-y-6">
      <ProjectHeader project={project} />

      <Card>
        <div className="flex items-center justify-between text-sm text-muted">
          <span>
            {completedCount}/{project.tasks.length} tasks complete
          </span>
          <span>{pct}%</span>
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-foreground/10">
          <div
            className="h-full rounded-full bg-accent"
            style={{ width: `${pct}%` }}
          />
        </div>
      </Card>

      <NewTaskForm projects={projects} defaultProjectId={project.id} />

      <TaskList
        tasks={tasksWithProject}
        projects={projects}
        emptyMessage="No tasks in this project yet."
      />
    </div>
  );
}
