"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/dal";
import { createTaskSchema, updateTaskSchema } from "@/lib/validation/task";
import { createTask, deleteTask, updateTask } from "@/lib/tasks";

function readTaskFields(formData: FormData) {
  const dueDateRaw = formData.get("dueDate");
  const priorityRaw = formData.get("priority");
  const projectIdRaw = formData.get("projectId");
  const tagsRaw = formData.get("tags");

  return {
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    dueDate: dueDateRaw ? String(dueDateRaw) : undefined,
    priority: priorityRaw ? Number(priorityRaw) : undefined,
    projectIdRaw: projectIdRaw ? String(projectIdRaw) : "",
    tags: tagsRaw
      ? String(tagsRaw)
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
      : undefined,
  };
}

function revalidateTaskPaths(projectId?: string | null) {
  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  if (projectId) revalidatePath(`/projects/${projectId}`);
}

export async function createTaskAction(formData: FormData) {
  const session = await requireSession();
  const { projectIdRaw, ...fields } = readTaskFields(formData);

  const body = createTaskSchema.parse({
    ...fields,
    projectId: projectIdRaw || undefined,
  });

  const task = await createTask(session.user.id, body);
  revalidateTaskPaths(task.projectId);
}

export async function updateTaskAction(taskId: string, formData: FormData) {
  const session = await requireSession();
  const { projectIdRaw, ...fields } = readTaskFields(formData);

  const body = updateTaskSchema.parse({
    ...fields,
    projectId: projectIdRaw === "" ? null : projectIdRaw,
  });

  const task = await updateTask(session.user.id, taskId, body);
  revalidateTaskPaths(task.projectId);
}

export async function toggleTaskAction(taskId: string, completed: boolean) {
  const session = await requireSession();
  const task = await updateTask(session.user.id, taskId, { completed });
  revalidateTaskPaths(task.projectId);
}

export async function deleteTaskAction(taskId: string, projectId?: string | null) {
  const session = await requireSession();
  await deleteTask(session.user.id, taskId);
  revalidateTaskPaths(projectId);
}
