"use server";

import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/dal";
import { setUserPreferences } from "@/lib/user/preferences";
import { recoverFromOrphanedSession } from "@/lib/auth/session-guard";
import type { Theme } from "@/types/user";

export async function completeOnboarding(formData: FormData) {
  const session = await requireSession();
  const timezone = String(formData.get("timezone") || "UTC");
  const theme = String(formData.get("theme") || "system") as Theme;

  try {
    await setUserPreferences(session.user.id, {
      timezone,
      theme,
      onboardingComplete: true,
    });
  } catch (error) {
    await recoverFromOrphanedSession(error);
    return;
  }

  redirect("/dashboard");
}
