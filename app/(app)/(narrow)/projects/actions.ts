"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/dal";
import { createProjectSchema, updateProjectSchema } from "@/lib/validation/project";
import { createProject, deleteProject, updateProject } from "@/lib/projects";

export async function createProjectAction(formData: FormData) {
  const session = await requireSession();
  const body = createProjectSchema.parse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    color: formData.get("color") || undefined,
  });

  await createProject(session.user.id, body);
  revalidatePath("/projects");
}

export async function updateProjectAction(
  projectId: string,
  formData: FormData
) {
  const session = await requireSession();
  const body = updateProjectSchema.parse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    color: formData.get("color") || undefined,
  });

  await updateProject(session.user.id, projectId, body);
  revalidatePath("/projects");
  revalidatePath(`/projects/${projectId}`);
}

export async function deleteProjectAction(projectId: string) {
  const session = await requireSession();
  await deleteProject(session.user.id, projectId);
  revalidatePath("/projects");
  redirect("/projects");
}
