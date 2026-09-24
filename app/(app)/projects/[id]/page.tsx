import { requireSession } from "@/lib/auth/dal";
import { getProjectDetail } from "@/lib/projects";
import { listBusinesses } from "@/lib/crm";
import { toDateOnly } from "@/lib/date";
import { describeDue, type TaskItemData } from "@/lib/task-groups";
import { colorForKey, computeProjectHealth, formatDay } from "@/lib/project-health";
import { ProjectView, type ProjectSection } from "./project-view";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireSession();
  const { id } = await params;

  const [project, businesses] = await Promise.all([
    getProjectDetail(session.user.id, id),
    listBusinesses(session.user.id),
  ]);

  const today = toDateOnly();
  const completed = project.tasks.filter((t) => t.completed).length;
  const { status, pct, pace } = computeProjectHealth({
    total: project.tasks.length,
    completed,
    createdAt: project.createdAt,
    dueDate: project.dueDate,
  });

  const items: TaskItemData[] = project.tasks.map((t) => {
    const { label, tone } = describeDue(t.dueDate, today);
    return {
      id: t.id,
      title: t.title,
      description: t.description,
      completed: t.completed,
      dueDate: t.dueDate?.toISOString() ?? null,
      priority: t.priority,
      tags: t.tags,
      section: t.section,
      projectId: t.projectId,
      project: null,
      dueLabel: label,
      tone,
    };
  });

  // Sections keep the order their first task was created; unsectioned tasks
  // go last (or stand alone as "Tasks" when nothing is sectioned).
  const named = new Map<string, TaskItemData[]>();
  const loose: TaskItemData[] = [];
  for (const task of items) {
    if (!task.section) loose.push(task);
    else named.set(task.section, [...(named.get(task.section) ?? []), task]);
  }
  const firstCreated = (name: string) =>
    Math.min(...project.tasks.filter((t) => t.section === name).map((t) => t.createdAt.getTime()));
  const sectionNames = [...named.keys()].sort((a, b) => firstCreated(a) - firstCreated(b));

  const toSection = (key: string, title: string, tasks: TaskItemData[]): ProjectSection => ({
    key,
    title,
    tasks,
    total: tasks.length,
    done: tasks.filter((t) => t.completed).length,
  });
  const sections: ProjectSection[] = [
    ...sectionNames.map((name) => toSection(name, name, named.get(name)!)),
    ...(loose.length ? [toSection("__loose", sectionNames.length ? "Other" : "Tasks", loose)] : []),
  ];

  return (
    <ProjectView
      project={{
        id: project.id,
        name: project.name,
        description: project.description,
        dueDateInput: project.dueDate?.toISOString().slice(0, 10) ?? null,
        dueLabel: project.dueDate ? formatDay(project.dueDate) : null,
        startedLabel: formatDay(project.createdAt),
        business: project.business
          ? { id: project.business.id, name: project.business.name, color: colorForKey(project.business.id) }
          : null,
      }}
      status={status}
      pct={pct}
      pace={pace}
      completed={completed}
      total={project.tasks.length}
      sections={sections}
      sectionNames={sectionNames}
      businesses={businesses.map((b) => ({ id: b.id, name: b.name }))}
    />
  );
}
