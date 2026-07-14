import { requireSession } from "@/lib/auth/dal";
import { getPrioritiesForDate } from "@/lib/priorities";
import { prisma } from "@/lib/db";
import { toDateOnly } from "@/lib/date";
import { Card } from "@/components/ui/card";
import { PrioritiesCard } from "./priorities-card";
import { QuickActionsCard } from "./quick-actions-card";

export default async function DashboardPage() {
  const session = await requireSession();
  const userId = session.user.id;
  const today = toDateOnly();
  const tomorrow = new Date(today);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

  const [priorities, tasksDueToday, overdueCount, openTaskCount, habits] =
    await Promise.all([
      getPrioritiesForDate(userId, today),
      prisma.task.findMany({
        where: {
          userId,
          completed: false,
          dueDate: { gte: today, lt: tomorrow },
        },
        orderBy: { createdAt: "asc" },
        take: 5,
      }),
      prisma.task.count({
        where: { userId, completed: false, dueDate: { lt: today } },
      }),
      prisma.task.count({ where: { userId, completed: false } }),
      prisma.habit.findMany({
        where: { userId },
        include: { logs: { where: { date: today } } },
      }),
    ]);

  const habitsCheckedIn = habits.filter((h) =>
    h.logs.some((log) => log.completed)
  ).length;

  const now = new Date();
  const weekday = now.toLocaleDateString(undefined, { weekday: "long" });
  const monthDay = now.toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-8">
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <p className="eyebrow">{weekday}</p>
          <h1 className="mt-1 font-serif text-4xl sm:text-5xl">{monthDay}</h1>
        </div>
        <p className="hidden text-sm text-muted sm:block">
          Welcome back, {session.user.name?.split(" ")[0] ?? "there"}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <PrioritiesCard initial={priorities.map((p) => p.content)} />

        <Card>
          <p className="eyebrow">Today&apos;s summary</p>
          <div className="mt-3 space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted">Open tasks</span>
              <span className="font-medium">{openTaskCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted">Overdue</span>
              <span
                className={
                  overdueCount > 0 ? "font-medium text-danger" : "font-medium"
                }
              >
                {overdueCount}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted">Habits checked in</span>
              <span className="font-medium">
                {habitsCheckedIn}/{habits.length}
              </span>
            </div>

            {tasksDueToday.length > 0 && (
              <div className="border-t border-border pt-3">
                <p className="text-muted">Due today</p>
                <ul className="mt-1.5 space-y-1">
                  {tasksDueToday.map((task) => (
                    <li key={task.id} className="truncate">
                      {task.title}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Card>

        <QuickActionsCard />
      </div>
    </div>
  );
}
