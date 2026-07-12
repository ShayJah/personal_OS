import { requireSession } from "@/lib/auth/dal";
import { getUserPreferences } from "@/lib/user/preferences";
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

  const [prefs, priorities, tasksDueToday, overdueCount, openTaskCount, habits] =
    await Promise.all([
      getUserPreferences(userId),
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">
          Welcome back, {session.user.name?.split(" ")[0] ?? "there"}
        </h1>
        <p className="text-sm text-foreground/60">
          {prefs.timezone} &middot; {prefs.theme} theme
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <PrioritiesCard initial={priorities.map((p) => p.content)} />

        <Card>
          <h2 className="text-sm font-medium text-foreground/60">
            Today&apos;s summary
          </h2>
          <div className="mt-3 space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-foreground/60">Open tasks</span>
              <span className="font-medium">{openTaskCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-foreground/60">Overdue</span>
              <span
                className={
                  overdueCount > 0
                    ? "font-medium text-red-500"
                    : "font-medium"
                }
              >
                {overdueCount}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-foreground/60">Habits checked in</span>
              <span className="font-medium">
                {habitsCheckedIn}/{habits.length}
              </span>
            </div>

            {tasksDueToday.length > 0 && (
              <div className="border-t border-black/10 pt-3 dark:border-white/10">
                <p className="text-foreground/60">Due today</p>
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
