import "server-only";
import { prisma } from "@/lib/db";
import { NotFoundError } from "@/lib/api/response";
import { toDateOnly } from "@/lib/date";
import type {
  createHabitSchema,
  updateHabitSchema,
} from "@/lib/validation/habit";
import type { z } from "zod";

export type CreateHabitInput = z.infer<typeof createHabitSchema>;
export type UpdateHabitInput = z.infer<typeof updateHabitSchema>;

const HISTORY_DAYS = 14;

export function computeStreak(
  completedDates: Set<string>,
  today: Date = toDateOnly()
): number {
  let streak = 0;
  const cursor = new Date(today);

  if (!completedDates.has(cursor.toISOString().slice(0, 10))) {
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  while (completedDates.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  return streak;
}

export async function listHabitsWithHistory(userId: string) {
  const today = toDateOnly();
  const since = new Date(today);
  since.setUTCDate(since.getUTCDate() - (HISTORY_DAYS - 1));

  const habits = await prisma.habit.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
    include: { logs: { where: { date: { gte: since } } } },
  });

  return habits.map((habit) => {
    const completedDates = new Set(
      habit.logs
        .filter((l) => l.completed)
        .map((l) => l.date.toISOString().slice(0, 10))
    );

    const history = Array.from({ length: HISTORY_DAYS }, (_, i) => {
      const d = new Date(since);
      d.setUTCDate(d.getUTCDate() + i);
      const key = d.toISOString().slice(0, 10);
      return { date: key, completed: completedDates.has(key) };
    });

    return {
      id: habit.id,
      name: habit.name,
      frequency: habit.frequency,
      completedToday: completedDates.has(today.toISOString().slice(0, 10)),
      streak: computeStreak(completedDates, today),
      history,
    };
  });
}

export async function createHabit(userId: string, data: CreateHabitInput) {
  return prisma.habit.create({ data: { ...data, userId } });
}

export async function getOwnedHabit(userId: string, id: string) {
  const habit = await prisma.habit.findFirst({ where: { id, userId } });
  if (!habit) throw new NotFoundError();
  return habit;
}

export async function updateHabit(
  userId: string,
  id: string,
  data: UpdateHabitInput
) {
  await getOwnedHabit(userId, id);
  return prisma.habit.update({ where: { id }, data });
}

export async function deleteHabit(userId: string, id: string) {
  await getOwnedHabit(userId, id);
  await prisma.habit.delete({ where: { id } });
}

export async function setHabitLogToday(
  userId: string,
  habitId: string,
  completed: boolean
) {
  await getOwnedHabit(userId, habitId);
  const date = toDateOnly();

  return prisma.habitLog.upsert({
    where: { habitId_date: { habitId, date } },
    update: { completed },
    create: { habitId, userId, date, completed },
  });
}
