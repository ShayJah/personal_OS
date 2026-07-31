"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/dal";
import { createCaptureSchema, classificationSchema } from "@/lib/validation/capture";
import { classifyCapture, createCapture, deleteCapture } from "@/lib/captures";

function revalidateCapturePaths(createdTask: boolean) {
  revalidatePath("/capture");
  if (createdTask) {
    revalidatePath("/tasks");
    revalidatePath("/dashboard");
  }
}

export async function createCaptureAction(formData: FormData) {
  const session = await requireSession();
  const body = createCaptureSchema.parse({
    content: formData.get("content"),
    type: formData.get("type") || "text",
  });

  await createCapture(session.user.id, body);
  revalidatePath("/capture");
}

export async function classifyCaptureAction(
  captureId: string,
  classification: string
) {
  const session = await requireSession();
  const classified = classificationSchema.parse(classification);

  await classifyCapture(session.user.id, captureId, classified);
  revalidateCapturePaths(classified === "task");
}

export async function deleteCaptureAction(captureId: string) {
  const session = await requireSession();
  await deleteCapture(session.user.id, captureId);
  revalidatePath("/capture");
}
