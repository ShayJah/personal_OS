"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/dal";
import { createHabitSchema, updateHabitSchema } from "@/lib/validation/habit";
import {
  createHabit,
  deleteHabit,
  setHabitLogToday,
  updateHabit,
} from "@/lib/habits";

function revalidateHabitPaths() {
  revalidatePath("/habits");
  revalidatePath("/dashboard");
}

export async function createHabitAction(formData: FormData) {
  const session = await requireSession();
  const body = createHabitSchema.parse({
    name: formData.get("name"),
    frequency: formData.get("frequency") || "daily",
  });

  await createHabit(session.user.id, body);
  revalidateHabitPaths();
}

export async function updateHabitAction(habitId: string, formData: FormData) {
  const session = await requireSession();
  const body = updateHabitSchema.parse({
    name: formData.get("name"),
    frequency: formData.get("frequency") || "daily",
  });

  await updateHabit(session.user.id, habitId, body);
  revalidateHabitPaths();
}

export async function deleteHabitAction(habitId: string) {
  const session = await requireSession();
  await deleteHabit(session.user.id, habitId);
  revalidateHabitPaths();
}

export async function toggleHabitTodayAction(
  habitId: string,
  completed: boolean
) {
  const session = await requireSession();
  await setHabitLogToday(session.user.id, habitId, completed);
  revalidateHabitPaths();
}
