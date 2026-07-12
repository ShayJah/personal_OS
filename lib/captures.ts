import "server-only";
import { prisma } from "@/lib/db";
import { NotFoundError } from "@/lib/api/response";
import { createTask } from "@/lib/tasks";
import type {
  createCaptureSchema,
  classificationSchema,
} from "@/lib/validation/capture";
import type { z } from "zod";

export type CreateCaptureInput = z.infer<typeof createCaptureSchema>;
export type Classification = z.infer<typeof classificationSchema>;

const TASK_TITLE_MAX = 300;

export async function listCaptures(userId: string) {
  return prisma.capture.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

export async function createCapture(userId: string, data: CreateCaptureInput) {
  return prisma.capture.create({ data: { ...data, userId } });
}

export async function getOwnedCapture(userId: string, id: string) {
  const capture = await prisma.capture.findFirst({ where: { id, userId } });
  if (!capture) throw new NotFoundError();
  return capture;
}

export async function classifyCapture(
  userId: string,
  id: string,
  classified: Classification
) {
  const capture = await getOwnedCapture(userId, id);

  if (classified === "task") {
    const title =
      capture.content.length > TASK_TITLE_MAX
        ? capture.content.slice(0, TASK_TITLE_MAX - 1) + "…"
        : capture.content;
    await createTask(userId, { title });
  }

  return prisma.capture.update({ where: { id }, data: { classified } });
}

export async function deleteCapture(userId: string, id: string) {
  await getOwnedCapture(userId, id);
  await prisma.capture.delete({ where: { id } });
}
