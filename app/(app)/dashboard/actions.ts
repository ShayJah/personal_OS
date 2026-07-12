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
