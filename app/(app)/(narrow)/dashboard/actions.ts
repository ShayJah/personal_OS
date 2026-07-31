"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/dal";
import { prisma } from "@/lib/db";
import { setPrioritiesForDate } from "@/lib/priorities";
import { toDateOnly } from "@/lib/date";
import { setPrioritiesSchema } from "@/lib/validation/priority";
import { createTaskSchema } from "@/lib/validation/task";

export async function saveTodayPriorities(formData: FormData) {
  const session = await requireSession();
  const raw = formData.getAll("priority").map((value) => String(value));
  const items = setPrioritiesSchema.parse({
    items: raw.map((v) => v.trim()).filter(Boolean),
  }).items;

  await setPrioritiesForDate(session.user.id, toDateOnly(), items);
  revalidatePath("/dashboard");
}

export async function quickAddTask(formData: FormData) {
  const session = await requireSession();
  const { title } = createTaskSchema
    .pick({ title: true })
    .parse({ title: formData.get("title") });

  await prisma.task.create({ data: { title, userId: session.user.id } });
  revalidatePath("/dashboard");
}

export async function acceptDailyBrief(notificationId: string) {
  const session = await requireSession();
  const notification = await prisma.notification.findFirst({
    where: { id: notificationId, userId: session.user.id },
  });
  if (!notification) return;

  const payload = notification.payload as { priorities?: { title: string }[] } | null;
  const titles = (payload?.priorities ?? []).map((p) => p.title).slice(0, 3);

  if (titles.length > 0) {
    await setPrioritiesForDate(session.user.id, toDateOnly(), titles);
  }
  await prisma.notification.update({
    where: { id: notificationId },
    data: { readAt: new Date() },
  });
  revalidatePath("/dashboard");
}

export async function dismissNotification(notificationId: string) {
  const session = await requireSession();
  await prisma.notification.updateMany({
    where: { id: notificationId, userId: session.user.id },
    data: { readAt: new Date() },
  });
  revalidatePath("/dashboard");
}
