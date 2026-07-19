import "server-only";
import { prisma } from "@/lib/db";

export interface StoredSet {
  weightKg: number;
  reps: number;
}

export interface StoredExercise {
  name: string;
  sets: StoredSet[];
}

export interface WorkoutSummary {
  id: string;
  title: string | null;
  startAt: Date;
  endAt: Date;
  volumeKg: number;
  exercises: StoredExercise[];
}

function parseExercises(raw: unknown): StoredExercise[] {
  if (!Array.isArray(raw)) return [];
  return raw as StoredExercise[];
}

export async function listWorkouts(userId: string, limit = 20): Promise<WorkoutSummary[]> {
  const workouts = await prisma.workout.findMany({
    where: { userId },
    orderBy: { startAt: "desc" },
    take: limit,
  });

  return workouts.map((w) => ({
    id: w.id,
    title: w.title,
    startAt: w.startAt,
    endAt: w.endAt,
    volumeKg: Number(w.volumeKg),
    exercises: parseExercises(w.exercises),
  }));
}

export async function listExerciseNames(userId: string): Promise<string[]> {
  const workouts = await listWorkouts(userId, 50);
  const names = new Set<string>();
  for (const workout of workouts) {
    for (const exercise of workout.exercises) {
      names.add(exercise.name);
    }
  }
  return Array.from(names).sort();
}

export interface ExerciseHistoryEntry {
  date: Date;
  bestSet: StoredSet | null;
  totalVolumeKg: number;
}

export async function getExerciseHistory(
  userId: string,
  exerciseName: string
): Promise<ExerciseHistoryEntry[]> {
  const workouts = await listWorkouts(userId, 50);

  const entries: ExerciseHistoryEntry[] = [];
  for (const workout of workouts) {
    const exercise = workout.exercises.find((e) => e.name === exerciseName);
    if (!exercise) continue;

    const bestSet = exercise.sets.reduce<StoredSet | null>((best, set) => {
      if (!best) return set;
      return set.weightKg * set.reps > best.weightKg * best.reps ? set : best;
    }, null);

    const totalVolumeKg = exercise.sets.reduce((sum, set) => sum + set.weightKg * set.reps, 0);

    entries.push({ date: workout.startAt, bestSet, totalVolumeKg });
  }

  return entries.sort((a, b) => a.date.getTime() - b.date.getTime());
}
