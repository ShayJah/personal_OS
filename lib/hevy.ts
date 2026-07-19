import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { toDateOnly } from "@/lib/date";

// NOTE: Hevy's exact response field names are implemented best-effort against
// their commonly-documented v1 shape — verify against a real API key on first
// sync and adjust field names below if they differ.

const WORKOUTS_URL = "https://api.hevyapp.com/v1/workouts";

export class HevyNotConnectedError extends Error {
  constructor() {
    super("Hevy is not connected for this user.");
  }
}

export async function isConnected(userId: string): Promise<boolean> {
  const connection = await prisma.hevyConnection.findUnique({ where: { userId } });
  return Boolean(connection);
}

export async function saveApiKey(userId: string, apiKey: string) {
  return prisma.hevyConnection.upsert({
    where: { userId },
    create: { userId, apiKey },
    update: { apiKey },
  });
}

export async function disconnect(userId: string) {
  await prisma.hevyConnection.deleteMany({ where: { userId } });
}

async function hevyFetch(userId: string, path: string): Promise<Response> {
  const connection = await prisma.hevyConnection.findUnique({ where: { userId } });
  if (!connection) throw new HevyNotConnectedError();

  return fetch(`${WORKOUTS_URL}${path}`, {
    headers: { "api-key": connection.apiKey, Accept: "application/json" },
  });
}

interface HevySet {
  weight_kg?: number | null;
  reps?: number | null;
}

interface HevyExercise {
  title?: string;
  sets?: HevySet[];
}

interface HevyWorkout {
  id: string;
  title?: string;
  start_time: string;
  end_time: string;
  exercises?: HevyExercise[];
}

interface HevyWorkoutsResponse {
  page: number;
  page_count: number;
  workouts: HevyWorkout[];
}

async function fetchRecentWorkouts(userId: string): Promise<HevyWorkout[]> {
  const res = await hevyFetch(userId, "?page=1&pageSize=10");
  if (!res.ok) throw new Error(`Hevy API error: ${res.status} ${await res.text()}`);
  const data = (await res.json()) as HevyWorkoutsResponse;
  return data.workouts ?? [];
}

function workoutVolumeKg(workout: HevyWorkout): number {
  return (workout.exercises ?? []).reduce((total, exercise) => {
    const exerciseVolume = (exercise.sets ?? []).reduce(
      (sum, set) => sum + (set.weight_kg ?? 0) * (set.reps ?? 0),
      0
    );
    return total + exerciseVolume;
  }, 0);
}

function toStoredExercises(workout: HevyWorkout) {
  return (workout.exercises ?? []).map((exercise) => ({
    name: exercise.title ?? "Unknown exercise",
    sets: (exercise.sets ?? []).map((set) => ({
      weightKg: set.weight_kg ?? 0,
      reps: set.reps ?? 0,
    })),
  }));
}

async function persistWorkouts(userId: string, workouts: HevyWorkout[]): Promise<void> {
  for (const workout of workouts) {
    const startAt = new Date(workout.start_time);
    const endAt = new Date(workout.end_time);
    const volumeKg = workoutVolumeKg(workout);
    const exercises = toStoredExercises(workout) as unknown as Prisma.InputJsonValue;

    await prisma.workout.upsert({
      where: { hevyWorkoutId: workout.id },
      update: { title: workout.title, startAt, endAt, volumeKg, exercises },
      create: {
        userId,
        hevyWorkoutId: workout.id,
        title: workout.title,
        startAt,
        endAt,
        volumeKg,
        exercises,
      },
    });
  }
}

export async function syncHevyMetrics(userId: string): Promise<number> {
  const workouts = await fetchRecentWorkouts(userId);
  await persistWorkouts(userId, workouts);

  const byDate = new Map<string, { minutes: number; volumeKg: number }>();
  for (const workout of workouts) {
    const start = new Date(workout.start_time);
    const end = new Date(workout.end_time);
    const dateKey = toDateOnly(start).toISOString();
    const minutes = Math.max(0, (end.getTime() - start.getTime()) / 60000);
    const volumeKg = workoutVolumeKg(workout);

    const existing = byDate.get(dateKey) ?? { minutes: 0, volumeKg: 0 };
    byDate.set(dateKey, {
      minutes: existing.minutes + minutes,
      volumeKg: existing.volumeKg + volumeKg,
    });
  }

  let written = 0;
  for (const [dateKey, agg] of byDate.entries()) {
    const date = new Date(dateKey);
    await prisma.metric.upsert({
      where: { userId_kind_date_source: { userId, kind: "workout_min", date, source: "hevy" } },
      update: { value: agg.minutes },
      create: { userId, kind: "workout_min", date, source: "hevy", value: agg.minutes, unit: "min" },
    });
    await prisma.metric.upsert({
      where: { userId_kind_date_source: { userId, kind: "workout_volume_kg", date, source: "hevy" } },
      update: { value: agg.volumeKg },
      create: { userId, kind: "workout_volume_kg", date, source: "hevy", value: agg.volumeKg, unit: "kg" },
    });
    written += 2;
  }

  return written;
}

export async function syncAllHevyConnections(): Promise<{ total: number; succeeded: number; failed: number }> {
  const connections = await prisma.hevyConnection.findMany({ select: { userId: true } });
  const results = await Promise.allSettled(connections.map((c) => syncHevyMetrics(c.userId)));
  return {
    total: connections.length,
    succeeded: results.filter((r) => r.status === "fulfilled").length,
    failed: results.filter((r) => r.status === "rejected").length,
  };
}
