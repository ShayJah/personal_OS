import "server-only";
import { prisma } from "@/lib/db";
import { NotFoundError } from "@/lib/api/response";
import {
  isConnected,
  listGoogleEvents,
  createGoogleEvent,
  updateGoogleEvent,
  deleteGoogleEvent,
  type GoogleEvent,
} from "@/lib/google-calendar";
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

/**
 * Pulls events from Google Calendar for the given range and mirrors them
 * into local CalendarEvent rows (upsert by googleEventId), removing local
 * synced rows whose Google event no longer exists in that range. No-ops if
 * the user hasn't connected Google Calendar.
 */
export async function syncFromGoogle(
  userId: string,
  start: Date,
  end: Date
): Promise<void> {
  if (!(await isConnected(userId))) return;

  let googleEvents: GoogleEvent[];
  try {
    googleEvents = await listGoogleEvents(userId, start, end);
  } catch (err) {
    console.error("Google Calendar pull failed:", err);
    return;
  }

  const activeGoogleIds = new Set<string>();

  for (const ev of googleEvents) {
    if (ev.status === "cancelled" || !ev.summary) continue;
    const startAt = ev.start.dateTime
      ? new Date(ev.start.dateTime)
      : ev.start.date
        ? new Date(ev.start.date)
        : null;
    const endAt = ev.end.dateTime
      ? new Date(ev.end.dateTime)
      : ev.end.date
        ? new Date(ev.end.date)
        : null;
    if (!startAt || !endAt) continue;

    activeGoogleIds.add(ev.id);

    await prisma.calendarEvent.upsert({
      where: { googleEventId: ev.id },
      create: {
        userId,
        title: ev.summary,
        description: ev.description ?? null,
        location: ev.location ?? null,
        startAt,
        endAt,
        googleEventId: ev.id,
        syncedAt: new Date(),
      },
      update: {
        title: ev.summary,
        description: ev.description ?? null,
        location: ev.location ?? null,
        startAt,
        endAt,
        syncedAt: new Date(),
      },
    });
  }

  const previouslySynced = await prisma.calendarEvent.findMany({
    where: { userId, startAt: { gte: start, lt: end }, googleEventId: { not: null } },
    select: { id: true, googleEventId: true },
  });
  const staleIds = previouslySynced
    .filter((e) => e.googleEventId && !activeGoogleIds.has(e.googleEventId))
    .map((e) => e.id);
  if (staleIds.length > 0) {
    await prisma.calendarEvent.deleteMany({ where: { id: { in: staleIds } } });
  }
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
  const event = await prisma.calendarEvent.create({ data: { ...data, userId } });

  if (await isConnected(userId)) {
    try {
      const googleEvent = await createGoogleEvent(userId, {
        title: event.title,
        description: event.description,
        location: event.location,
        startAt: event.startAt,
        endAt: event.endAt,
      });
      await prisma.calendarEvent.update({
        where: { id: event.id },
        data: { googleEventId: googleEvent.id, syncedAt: new Date() },
      });
    } catch (err) {
      console.error("Failed to push new event to Google Calendar:", err);
    }
  }

  return event;
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
  const existing = await getOwnedEvent(userId, id);
  if (data.taskId) await assertOwnsTask(userId, data.taskId);
  const event = await prisma.calendarEvent.update({ where: { id }, data });

  if (await isConnected(userId)) {
    try {
      if (existing.googleEventId) {
        await updateGoogleEvent(userId, existing.googleEventId, {
          title: event.title,
          description: event.description,
          location: event.location,
          startAt: event.startAt,
          endAt: event.endAt,
        });
        await prisma.calendarEvent.update({
          where: { id: event.id },
          data: { syncedAt: new Date() },
        });
      } else {
        const googleEvent = await createGoogleEvent(userId, {
          title: event.title,
          description: event.description,
          location: event.location,
          startAt: event.startAt,
          endAt: event.endAt,
        });
        await prisma.calendarEvent.update({
          where: { id: event.id },
          data: { googleEventId: googleEvent.id, syncedAt: new Date() },
        });
      }
    } catch (err) {
      console.error("Failed to push event update to Google Calendar:", err);
    }
  }

  return event;
}

export async function deleteEvent(userId: string, id: string) {
  const event = await getOwnedEvent(userId, id);
  await prisma.calendarEvent.delete({ where: { id } });

  if (event.googleEventId && (await isConnected(userId))) {
    try {
      await deleteGoogleEvent(userId, event.googleEventId);
    } catch (err) {
      console.error("Failed to delete event from Google Calendar:", err);
    }
  }
}
