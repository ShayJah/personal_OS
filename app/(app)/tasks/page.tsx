import { requireSession } from "@/lib/auth/dal";
import { listTasks, type TaskFilter } from "@/lib/tasks";
import { listProjectsWithProgress } from "@/lib/projects";
import { toDateOnly } from "@/lib/date";
import {
  describeDue,
  endOfWeek,
  groupByDue,
  groupByProject,
  projectColor,
  type TaskItemData,
  type TaskSection,
} from "@/lib/task-groups";
import { TasksView } from "./tasks-view";

const DAY_MS = 86_400_000;
const FILTERS: TaskFilter[] = ["all", "today", "upcoming", "completed"];

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; group?: string; project?: string }>;
}) {
  const session = await requireSession();
  const userId = session.user.id;
  const params = await searchParams;

  const filter: TaskFilter = FILTERS.includes(params.filter as TaskFilter)
    ? (params.filter as TaskFilter)
    : "all";
  const group = params.group === "project" ? "project" : "due";

  const today = toDateOnly();
  const tomorrow = new Date(today.getTime() + DAY_MS);
  const weekEnd = endOfWeek(today);

  const [projects, openRaw, completedRaw] = await Promise.all([
    listProjectsWithProgress(userId),
    listTasks(userId, "all"),
    filter === "completed" ? listTasks(userId, "completed") : Promise.resolve([]),
  ]);

  const projectId = projects.some((p) => p.id === params.project) ? params.project! : "";
  const colorById = new Map(projects.map((p, i) => [p.id, projectColor(i)]));

  const toItem = (t: (typeof openRaw)[number]): TaskItemData => {
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
      project: t.project
        ? { id: t.project.id, name: t.project.name, color: colorById.get(t.project.id) ?? projectColor(0) }
        : null,
      dueLabel: label,
      tone,
    };
  };

  const open = openRaw.map(toItem);
  const dueTs = (t: TaskItemData) => (t.dueDate ? new Date(t.dueDate).getTime() : null);

  const overdue = open.filter((t) => dueTs(t) !== null && dueTs(t)! < today.getTime());
  const dueToday = open.filter((t) => dueTs(t) !== null && dueTs(t)! >= today.getTime() && dueTs(t)! < tomorrow.getTime());
  const upcoming = open.filter((t) => dueTs(t) !== null && dueTs(t)! >= tomorrow.getTime());
  const dueThisWeek = open.filter((t) => dueTs(t) !== null && dueTs(t)! >= today.getTime() && dueTs(t)! < weekEnd.getTime());

  const visible =
    filter === "completed"
      ? completedRaw.map(toItem)
      : filter === "today"
        ? dueToday
        : filter === "upcoming"
          ? upcoming
          : open;
  const scoped = projectId ? visible.filter((t) => t.projectId === projectId) : visible;

  let sections: TaskSection[];
  if (filter === "completed") {
    sections = scoped.length ? [{ key: "done", title: "Completed", tasks: scoped }] : [];
  } else if (group === "project") {
    sections = groupByProject(scoped, projects);
  } else if (filter === "today") {
    sections = scoped.length ? [{ key: "today", title: "Today", tasks: scoped }] : [];
  } else {
    sections = groupByDue(scoped, today);
  }

  const byProject = [
    ...projects.map((p) => ({
      id: p.id,
      name: p.name,
      color: colorById.get(p.id)!,
      count: open.filter((t) => t.projectId === p.id).length,
    })),
    {
      id: "",
      name: "No project",
      color: "var(--muted-soft)",
      count: open.filter((t) => !t.projectId).length,
    },
  ]
    .filter((p) => p.count > 0)
    .sort((a, b) => b.count - a.count);

  return (
    <TasksView
      filter={filter}
      group={group}
      projectId={projectId}
      projectOptions={projects.map((p) => ({ id: p.id, name: p.name }))}
      open={open}
      overdue={overdue}
      dueToday={dueToday}
      upcomingCount={upcoming.length}
      dueThisWeekCount={dueThisWeek.length}
      sections={sections}
      byProject={byProject}
    />
  );
}
