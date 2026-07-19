import "server-only";
import { prisma } from "@/lib/db";
import type { upsertJournalSchema } from "@/lib/validation/journal";
import type { z } from "zod";

export type UpsertJournalInput = z.infer<typeof upsertJournalSchema>;

export async function getEntryForDate(userId: string, date: Date) {
  return prisma.journalEntry.findUnique({
    where: { userId_date: { userId, date } },
  });
}

export async function upsertEntry(userId: string, data: UpsertJournalInput) {
  const { date, body, mood } = data;
  return prisma.journalEntry.upsert({
    where: { userId_date: { userId, date } },
    update: { body, mood },
    create: { userId, date, body, mood },
  });
}

export async function listRecentEntries(userId: string, limit = 14) {
  return prisma.journalEntry.findMany({
    where: { userId },
    orderBy: { date: "desc" },
    take: limit,
  });
}
