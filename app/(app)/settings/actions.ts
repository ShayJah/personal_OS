"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/dal";
import { setUserPreferences } from "@/lib/user/preferences";
import type { Theme } from "@/types/user";

export async function updatePreferences(formData: FormData) {
  const session = await requireSession();
  const timezone = String(formData.get("timezone") || "UTC");
  const theme = String(formData.get("theme") || "system") as Theme;

  await setUserPreferences(session.user.id, { timezone, theme });
  revalidatePath("/settings");
  revalidatePath("/dashboard");
}
