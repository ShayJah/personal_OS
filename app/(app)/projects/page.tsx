import { requireSession } from "@/lib/auth/dal";
import { listProjectsWithProgress } from "@/lib/projects";
import { listBusinesses } from "@/lib/crm";
import {
  colorForKey,
  computeProjectHealth,
  formatDay,
  pickNextTask,
  STATUS_ORDER,
  type ProjectStatus,
} from "@/lib/project-health";
import { ProjectsView, type ProjectCardData } from "./projects-view";

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const session = await requireSession();
  const { status } = await searchParams;
  const filter: ProjectStatus | "all" = STATUS_ORDER.includes(status as ProjectStatus)
    ? (status as ProjectStatus)
    : "all";

  const [projects, businesses] = await Promise.all([
    listProjectsWithProgress(session.user.id),
    listBusinesses(session.user.id),
  ]);

  const now = new Date();
  const cards: ProjectCardData[] = projects.map((p) => {
    const { status, pct } = computeProjectHealth({
      total: p.taskCount,
      completed: p.completedCount,
      createdAt: p.createdAt,
      dueDate: p.dueDate,
      now,
    });
    return {
      id: p.id,
      name: p.name,
      business: p.business
        ? { id: p.business.id, name: p.business.name, color: colorForKey(p.business.id) }
        : null,
      status,
      completed: p.completedCount,
      total: p.taskCount,
      pct,
      next: pickNextTask(p.tasks)?.title ?? null,
      dueLabel: p.dueDate ? formatDay(p.dueDate) : null,
    };
  });

  const counts = Object.fromEntries(
    STATUS_ORDER.map((s) => [s, cards.filter((c) => c.status === s).length])
  ) as Record<ProjectStatus, number>;

  const visible = cards
    .filter((c) => filter === "all" || c.status === filter)
    .sort((a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status));

  return (
    <ProjectsView
      projects={visible}
      counts={counts}
      total={cards.length}
      filter={filter}
      businesses={businesses.map((b) => ({ id: b.id, name: b.name }))}
    />
  );
}
