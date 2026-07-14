"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/dal";
import { sendCoachMessageSchema } from "@/lib/validation/coach";
import { sendCoachMessage } from "@/lib/coach";

export async function sendCoachMessageAction(formData: FormData) {
  const session = await requireSession();
  const { content } = sendCoachMessageSchema.parse({
    content: formData.get("content"),
  });

  await sendCoachMessage(session.user.id, content);
  revalidatePath("/coach");
}
