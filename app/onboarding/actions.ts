"use server";

import { redirect } from "next/navigation";
import { setUserPreferences } from "@/lib/user/preferences";
import type { Theme } from "@/types/user";

export async function completeOnboarding(formData: FormData) {
  const timezone = String(formData.get("timezone") || "UTC");
  const theme = String(formData.get("theme") || "system") as Theme;

  await setUserPreferences({ timezone, theme, onboardingComplete: true });
  redirect("/dashboard");
}
