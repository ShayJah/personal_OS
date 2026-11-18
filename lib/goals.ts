import "server-only";
import { prisma } from "@/lib/db";
import { NotFoundError } from "@/lib/api/response";
import type { createGoalSchema, updateGoalSchema } from "@/lib/validation/goal";
import type { z } from "zod";

export type CreateGoalInput = z.infer<typeof createGoalSchema>;
export type UpdateGoalInput = z.infer<typeof updateGoalSchema>;

export async function listGoals(userId: string) {
  return prisma.goal.findMany({
    where: { userId },
    orderBy: [{ horizon: "asc" }, { createdAt: "desc" }],
  });
}

export async function listActiveGoals(userId: string) {
  return prisma.goal.findMany({
    where: { userId, status: "active" },
    orderBy: [{ horizon: "asc" }, { createdAt: "desc" }],
  });
}

export async function createGoal(userId: string, data: CreateGoalInput) {
  return prisma.goal.create({ data: { ...data, userId } });
}

export async function getOwnedGoal(userId: string, id: string) {
  const goal = await prisma.goal.findFirst({ where: { id, userId } });
  if (!goal) throw new NotFoundError();
  return goal;
}

export async function updateGoal(userId: string, id: string, data: UpdateGoalInput) {
  await getOwnedGoal(userId, id);
  return prisma.goal.update({ where: { id }, data });
}

export async function deleteGoal(userId: string, id: string) {
  await getOwnedGoal(userId, id);
  await prisma.goal.delete({ where: { id } });
}
