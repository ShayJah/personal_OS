import { requireSession } from "@/lib/auth/dal";
import { getPrioritiesForDate } from "@/lib/priorities";
import { listHabitsWithHistory } from "@/lib/habits";
import { listEventsForRange } from "@/lib/calendar";
import { listDueFollowUps } from "@/lib/today";
import { prisma } from "@/lib/db";
import { toDateOnly } from "@/lib/date";
import { TodayView } from "./today-view";

const DAY_MS = 86_400_000;

export default async function DashboardPage() {
  const session = await requireSession();
  const userId = session.user.id;
  const today = toDateOnly();
  const tomorrow = new Date(today.getTime() + DAY_MS);

  const [priorities, tasks, dueTodayCount, overdueCount, openTaskCount, habits, notifications, events, followUps] =
    await Promise.all([
      getPrioritiesForDate(userId, today),
      prisma.task.findMany({
        where: { userId, completed: false, dueDate: { lt: tomorrow } },
        orderBy: [{ dueDate: "asc" }, { createdAt: "asc" }],
        take: 8,
        select: { id: true, title: true, dueDate: true },
      }),
      prisma.task.count({
        where: { userId, completed: false, dueDate: { gte: today, lt: tomorrow } },
      }),
      prisma.task.count({ where: { userId, completed: false, dueDate: { lt: today } } }),
      prisma.task.count({ where: { userId, completed: false } }),
      listHabitsWithHistory(userId),
      prisma.notification.findMany({
        where: { userId, readAt: null },
        orderBy: { createdAt: "desc" },
        take: 3,
      }),
      listEventsForRange(userId, today, tomorrow),
      listDueFollowUps(userId, tomorrow),
    ]);

  return (
    <TodayView
      firstName={session.user.name?.split(" ")[0]}
      now={new Date()}
      priorities={priorities.map((p) => p.content)}
      tasks={tasks.map((t) => ({
        id: t.id,
        title: t.title,
        daysOverdue: t.dueDate
          ? Math.max(0, Math.floor((today.getTime() - toDateOnly(t.dueDate).getTime()) / DAY_MS))
          : 0,
      }))}
      dueTodayCount={dueTodayCount}
      overdueCount={overdueCount}
      openTaskCount={openTaskCount}
      habits={habits.map((h) => ({ id: h.id, name: h.name, done: h.completedToday, streak: h.streak }))}
      notifications={notifications.map((n) => ({
        id: n.id,
        title: n.title,
        payload: n.payload as { priorities?: { title: string; why: string }[] } | null,
      }))}
      events={events}
      followUps={followUps}
    />
  );
}
