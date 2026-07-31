"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/dal";
import { setUserPreferences } from "@/lib/user/preferences";
import { recoverFromOrphanedSession } from "@/lib/auth/session-guard";
import type { Theme } from "@/types/user";

export async function updatePreferences(formData: FormData) {
  const session = await requireSession();
  const timezone = String(formData.get("timezone") || "UTC");
  const theme = String(formData.get("theme") || "system") as Theme;

  try {
    await setUserPreferences(session.user.id, { timezone, theme });
  } catch (error) {
    await recoverFromOrphanedSession(error);
    return;
  }

  revalidatePath("/settings");
  revalidatePath("/dashboard");
}

export async function setThemeAction(theme: Theme) {
  const session = await requireSession();
  try {
    await setUserPreferences(session.user.id, { theme });
  } catch (error) {
    await recoverFromOrphanedSession(error);
    return;
  }

  revalidatePath("/settings");
  revalidatePath("/dashboard");
}
