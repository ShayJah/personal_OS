import "server-only";
import { prisma } from "@/lib/db";
import { NotFoundError } from "@/lib/api/response";
import type {
  createEventSchema,
  updateEventSchema,
} from "@/lib/validation/calendar-event";
import type { z } from "zod";

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;

export function startOfWeek(date: Date): Date {
  const d = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  );
  const day = d.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  return d;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

export async function listEventsForRange(
  userId: string,
  start: Date,
  end: Date
) {
  return prisma.calendarEvent.findMany({
    where: { userId, startAt: { gte: start, lt: end } },
    orderBy: { startAt: "asc" },
    include: { task: { select: { id: true, title: true } } },
  });
}

async function assertOwnsTask(userId: string, taskId: string) {
  const task = await prisma.task.findFirst({ where: { id: taskId, userId } });
  if (!task) throw new NotFoundError();
}

export async function createEvent(userId: string, data: CreateEventInput) {
  if (data.taskId) await assertOwnsTask(userId, data.taskId);
  return prisma.calendarEvent.create({ data: { ...data, userId } });
}

export async function getOwnedEvent(userId: string, id: string) {
  const event = await prisma.calendarEvent.findFirst({
    where: { id, userId },
  });
  if (!event) throw new NotFoundError();
  return event;
}

export async function updateEvent(
  userId: string,
  id: string,
  data: UpdateEventInput
) {
  await getOwnedEvent(userId, id);
  if (data.taskId) await assertOwnsTask(userId, data.taskId);
  return prisma.calendarEvent.update({ where: { id }, data });
}

export async function deleteEvent(userId: string, id: string) {
  await getOwnedEvent(userId, id);
  await prisma.calendarEvent.delete({ where: { id } });
}
