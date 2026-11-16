import "server-only";
import { timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/db";

/** Planner on the wall: four months, first one here. Change when the planner is swapped. */
export const PLANNER_START = { year: 2026, month: 10 };

export function validTvKey(key: string | undefined | null) {
  const secret = process.env.TV_TOKEN;
  if (!secret || !key) return false; // unset secret must never match
  const a = Buffer.from(key);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function getTvUserId(): Promise<string | null> {
  const email = process.env.TV_USER_EMAIL;
  if (!email) return null;
  return (await prisma.user.findUnique({ where: { email }, select: { id: true } }))?.id ?? null;
}

export type Pin = { id: string; text: string; date?: string };

// Pins live in a Report row (type tv_pins) so no database migration is needed.
const PINS = { type: "tv_pins", periodStart: new Date("2000-01-01") };

export async function getPins(userId: string): Promise<Pin[]> {
  const r = await prisma.report.findUnique({
    where: { userId_type_periodStart: { userId, type: PINS.type, periodStart: PINS.periodStart } },
    select: { content: true },
  });
  try {
    const list = JSON.parse(r?.content ?? "[]");
    return Array.isArray(list)
      ? list.filter((p) => p && typeof p.id === "string" && typeof p.text === "string").slice(0, 30)
      : [];
  } catch {
    return [];
  }
}

export async function savePins(userId: string, pins: Pin[]) {
  const content = JSON.stringify(pins.slice(0, 30));
  await prisma.report.upsert({
    where: { userId_type_periodStart: { userId, type: PINS.type, periodStart: PINS.periodStart } },
    create: { userId, type: PINS.type, periodStart: PINS.periodStart, periodEnd: PINS.periodStart, content },
    update: { content },
  });
}
