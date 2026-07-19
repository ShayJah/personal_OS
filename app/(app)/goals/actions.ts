"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/dal";
import { createGoalSchema, updateGoalSchema } from "@/lib/validation/goal";
import { createGoal, deleteGoal, updateGoal } from "@/lib/goals";

function readGoalFields(formData: FormData) {
  const targetRaw = formData.get("targetValue");
  const currentRaw = formData.get("currentValue");
  const whyRaw = formData.get("why");

  return {
    horizon: formData.get("horizon") || "year",
    title: formData.get("title"),
    why: whyRaw ? String(whyRaw) : undefined,
    area: formData.get("area") || "personal",
    targetValue: targetRaw ? Number(targetRaw) : undefined,
    currentValue: currentRaw ? Number(currentRaw) : undefined,
  };
}

function revalidateGoalPaths() {
  revalidatePath("/goals");
  revalidatePath("/dashboard");
}

export async function createGoalAction(formData: FormData) {
  const session = await requireSession();
  const body = createGoalSchema.parse(readGoalFields(formData));
  await createGoal(session.user.id, body);
  revalidateGoalPaths();
}

export async function updateGoalAction(goalId: string, formData: FormData) {
  const session = await requireSession();
  const statusRaw = formData.get("status");
  const body = updateGoalSchema.parse({
    ...readGoalFields(formData),
    status: statusRaw ? String(statusRaw) : undefined,
  });
  await updateGoal(session.user.id, goalId, body);
  revalidateGoalPaths();
}

export async function deleteGoalAction(goalId: string) {
  const session = await requireSession();
  await deleteGoal(session.user.id, goalId);
  revalidateGoalPaths();
}
