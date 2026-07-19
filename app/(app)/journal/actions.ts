"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/dal";
import { upsertJournalSchema } from "@/lib/validation/journal";
import { upsertEntry } from "@/lib/journal";

export async function saveJournalEntryAction(formData: FormData) {
  const session = await requireSession();
  const moodRaw = formData.get("mood");

  const body = upsertJournalSchema.parse({
    date: formData.get("date"),
    body: formData.get("body"),
    mood: moodRaw ? Number(moodRaw) : undefined,
  });

  await upsertEntry(session.user.id, body);
  revalidatePath("/journal");
}
