import "server-only";
import { prisma } from "@/lib/db";
import { listTasks } from "@/lib/tasks";
import { listProjectsWithProgress } from "@/lib/projects";
import { getPrioritiesForDate } from "@/lib/priorities";
import { toDateOnly } from "@/lib/date";

export async function buildUserContext(userId: string): Promise<string> {
  const today = toDateOnly();

  const [openTasks, projects, priorities, habits] = await Promise.all([
    listTasks(userId, "all"),
    listProjectsWithProgress(userId),
    getPrioritiesForDate(userId, today),
    prisma.habit.findMany({
      where: { userId },
      include: { logs: { where: { date: today } } },
    }),
  ]);

  const lines: string[] = [];

  lines.push(
    priorities.length > 0
      ? `Today's top priorities: ${priorities.map((p) => p.content).join("; ")}`
      : "No priorities set for today."
  );

  lines.push(
    openTasks.length > 0
      ? `Open tasks (${openTasks.length} total, showing up to 15): ${openTasks
          .slice(0, 15)
          .map((t) => t.title + (t.dueDate ? ` (due ${t.dueDate.toDateString()})` : ""))
          .join("; ")}`
      : "No open tasks."
  );

  lines.push(
    projects.length > 0
      ? `Projects: ${projects
          .map((p) => `${p.name} (${p.completedCount}/${p.taskCount} tasks done)`)
          .join("; ")}`
      : "No projects."
  );

  lines.push(
    habits.length > 0
      ? `Habits: ${habits
          .map((h) => `${h.name} (${h.logs.some((l) => l.completed) ? "done today" : "not done today"})`)
          .join("; ")}`
      : "No habits tracked."
  );

  return lines.join("\n");
}
