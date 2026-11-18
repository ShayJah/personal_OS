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
    include: {
      business: { select: { id: true, name: true } },
      tasks: { select: { title: true, completed: true, dueDate: true, createdAt: true } },
    },
  });

  return projects.map(({ tasks, ...project }) => ({
    ...project,
    tasks,
    taskCount: tasks.length,
    completedCount: tasks.filter((t) => t.completed).length,
  }));
}

async function assertOwnsBusiness(userId: string, businessId: string) {
  const business = await prisma.business.findFirst({ where: { id: businessId, userId } });
  if (!business) throw new NotFoundError();
}

export async function createProject(userId: string, data: CreateProjectInput) {
  if (data.businessId) await assertOwnsBusiness(userId, data.businessId);
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
    include: {
      business: { select: { id: true, name: true } },
      tasks: { orderBy: [{ completed: "asc" }, { dueDate: "asc" }, { createdAt: "asc" }] },
    },
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
  if (data.businessId) await assertOwnsBusiness(userId, data.businessId);
  return prisma.project.update({ where: { id }, data });
}

export async function deleteProject(userId: string, id: string) {
  await getOwnedProject(userId, id);
  await prisma.project.delete({ where: { id } });
}
