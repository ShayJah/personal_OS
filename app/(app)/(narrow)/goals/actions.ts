"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/dal";
import { createGoalSchema, updateGoalSchema } from "@/lib/validation/goal";
import { createGoal, deleteGoal, updateGoal } from "@/lib/goals";

function readGoalFields(formData: FormData) {
  const targetRaw = formData.get("targetValue");
  const currentRaw = formData.get("currentValue");
  const whyRaw = formData.get("why");
  const metricRaw = formData.get("metric");

  return {
    horizon: formData.get("horizon") || "year",
    title: formData.get("title"),
    why: whyRaw ? String(whyRaw) : undefined,
    area: formData.get("area") || "personal",
    targetValue: targetRaw ? Number(targetRaw) : undefined,
    // An auto-tracked goal counts its own progress, so a typed value would only go stale.
    currentValue: currentRaw && !metricRaw ? Number(currentRaw) : undefined,
    metric: metricRaw ? String(metricRaw) : null,
  };
}

function revalidateGoalPaths() {
  revalidatePath("/goals");
  revalidatePath("/dashboard");
  revalidatePath("/outreach");
}

export async function createGoalAction(formData: FormData) {
  const session = await requireSession();
  const fields = readGoalFields(formData);
  const body = createGoalSchema.parse({ ...fields, metric: fields.metric ?? undefined });
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
