import "server-only";
import { prisma } from "@/lib/db";
import { NotFoundError } from "@/lib/api/response";
import type { createTaskSchema, updateTaskSchema } from "@/lib/validation/task";
import type { z } from "zod";

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;

export type TaskFilter = "today" | "upcoming" | "completed" | "all";

function todayRange() {
  const now = new Date();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const tomorrow = new Date(today);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  return { today, tomorrow };
}

export async function listTasks(userId: string, filter: TaskFilter) {
  const { today, tomorrow } = todayRange();

  const where =
    filter === "today"
      ? { userId, completed: false, dueDate: { gte: today, lt: tomorrow } }
      : filter === "upcoming"
        ? { userId, completed: false, dueDate: { gte: tomorrow } }
        : filter === "completed"
          ? { userId, completed: true }
          : { userId, completed: false };

  return prisma.task.findMany({
    where,
    orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
    include: { project: { select: { id: true, name: true, color: true } } },
  });
}

async function assertOwnsProject(userId: string, projectId: string) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId },
  });
  if (!project) throw new NotFoundError();
}

export async function createTask(userId: string, data: CreateTaskInput) {
  if (data.projectId) await assertOwnsProject(userId, data.projectId);
  return prisma.task.create({ data: { ...data, userId } });
}

export async function getOwnedTask(userId: string, id: string) {
  const task = await prisma.task.findFirst({ where: { id, userId } });
  if (!task) throw new NotFoundError();
  return task;
}

export async function updateTask(
  userId: string,
  id: string,
  data: UpdateTaskInput
) {
  await getOwnedTask(userId, id);
  if (data.projectId) await assertOwnsProject(userId, data.projectId);
  return prisma.task.update({ where: { id }, data });
}

export async function deleteTask(userId: string, id: string) {
  await getOwnedTask(userId, id);
  await prisma.task.delete({ where: { id } });
}
