import "server-only";
import { prisma } from "@/lib/db";
import { NotFoundError } from "@/lib/api/response";
import type {
  createProjectSchema,
  updateProjectSchema,
} from "@/lib/validation/project";
import type { z } from "zod";

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

export async function listProjectsWithProgress(userId: string) {
  const projects = await prisma.project.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { tasks: { select: { completed: true } } },
  });

  return projects.map(({ tasks, ...project }) => ({
    ...project,
    taskCount: tasks.length,
    completedCount: tasks.filter((t) => t.completed).length,
  }));
}

export async function createProject(userId: string, data: CreateProjectInput) {
  return prisma.project.create({ data: { ...data, userId } });
}

export async function getOwnedProject(userId: string, id: string) {
  const project = await prisma.project.findFirst({ where: { id, userId } });
  if (!project) throw new NotFoundError();
  return project;
}

export async function getProjectDetail(userId: string, id: string) {
  const project = await prisma.project.findFirst({
    where: { id, userId },
    include: { tasks: { orderBy: [{ completed: "asc" }, { createdAt: "desc" }] } },
  });
  if (!project) throw new NotFoundError();
  return project;
}

export async function updateProject(
  userId: string,
  id: string,
  data: UpdateProjectInput
) {
  await getOwnedProject(userId, id);
  return prisma.project.update({ where: { id }, data });
}

export async function deleteProject(userId: string, id: string) {
  await getOwnedProject(userId, id);
  await prisma.project.delete({ where: { id } });
}
