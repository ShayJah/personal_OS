"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/dal";
import { createEventSchema, updateEventSchema } from "@/lib/validation/calendar-event";
import { createEvent, deleteEvent, updateEvent } from "@/lib/calendar";

function readEventFields(formData: FormData) {
  const taskIdRaw = formData.get("taskId");
  return {
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    location: formData.get("location") || undefined,
    startAt: formData.get("startAt"),
    endAt: formData.get("endAt"),
    taskIdRaw: taskIdRaw ? String(taskIdRaw) : "",
  };
}

export async function createEventAction(formData: FormData) {
  const session = await requireSession();
  const { taskIdRaw, ...fields } = readEventFields(formData);

  const body = createEventSchema.parse({
    ...fields,
    taskId: taskIdRaw || undefined,
  });

  await createEvent(session.user.id, body);
  revalidatePath("/calendar");
}

export async function updateEventAction(eventId: string, formData: FormData) {
  const session = await requireSession();
  const { taskIdRaw, ...fields } = readEventFields(formData);

  const body = updateEventSchema.parse({
    ...fields,
    taskId: taskIdRaw === "" ? null : taskIdRaw,
  });

  await updateEvent(session.user.id, eventId, body);
  revalidatePath("/calendar");
}

export async function deleteEventAction(eventId: string) {
  const session = await requireSession();
  await deleteEvent(session.user.id, eventId);
  revalidatePath("/calendar");
}
