import "server-only";
import { prisma } from "@/lib/db";
import { toDateOnly } from "@/lib/date";
import type { logMetricSchema } from "@/lib/validation/metric";
import type { z } from "zod";

export type LogMetricInput = z.infer<typeof logMetricSchema>;

export async function logMetric(userId: string, data: LogMetricInput) {
  const { kind, value, unit, date } = data;
  return prisma.metric.upsert({
    where: { userId_kind_date_source: { userId, kind, date, source: "manual" } },
    update: { value, unit },
    create: { userId, kind, value, unit, date, source: "manual" },
  });
}

export async function getLastSyncDate(userId: string, source: string) {
  const metric = await prisma.metric.findFirst({
    where: { userId, source },
    orderBy: { date: "desc" },
    select: { date: true },
  });
  return metric?.date ?? null;
}

export async function getRecentByKind(userId: string, kind: string, days = 14) {
  const today = toDateOnly();
  const since = new Date(today);
  since.setUTCDate(since.getUTCDate() - (days - 1));

  return prisma.metric.findMany({
    where: { userId, kind, date: { gte: since } },
    orderBy: { date: "desc" },
  });
}

function sumByKind(metrics: { kind: string; value: unknown }[], kind: string): number {
  return metrics
    .filter((m) => m.kind === kind)
    .reduce((sum, m) => sum + Number(m.value), 0);
}

function avgByKind(metrics: { kind: string; value: unknown; date: Date }[], kind: string): number | null {
  const matches = metrics.filter((m) => m.kind === kind);
  if (matches.length === 0) return null;
  const total = matches.reduce((sum, m) => sum + Number(m.value), 0);
  return total / matches.length;
}

export async function getWeekSummary(userId: string) {
  const today = toDateOnly();
  const since = new Date(today);
  since.setUTCDate(since.getUTCDate() - 6);

  const metrics = await prisma.metric.findMany({
    where: { userId, date: { gte: since } },
    orderBy: { date: "desc" },
  });

  const workoutDates = new Set(
    metrics.filter((m) => m.kind === "workout_min" && Number(m.value) > 0).map((m) => m.date.toISOString())
  );

  const weightMetrics = metrics.filter((m) => m.kind === "weight").sort((a, b) => b.date.getTime() - a.date.getTime());

  return {
    workoutCount: workoutDates.size,
    workoutMinutes: sumByKind(metrics, "workout_min"),
    workoutVolumeKg: sumByKind(metrics, "workout_volume_kg"),
    avgCalories: avgByKind(metrics, "calories"),
    avgProtein: avgByKind(metrics, "protein"),
    recentWeights: weightMetrics.slice(0, 7).map((m) => ({ date: m.date, value: Number(m.value) })),
  };
}
