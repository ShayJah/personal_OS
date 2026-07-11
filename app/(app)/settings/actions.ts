"use server";

import { revalidatePath } from "next/cache";
import { setUserPreferences } from "@/lib/user/preferences";
import type { Theme } from "@/types/user";

export async function updatePreferences(formData: FormData) {
  const timezone = String(formData.get("timezone") || "UTC");
  const theme = String(formData.get("theme") || "system") as Theme;

  await setUserPreferences({ timezone, theme });
  revalidatePath("/settings");
  revalidatePath("/dashboard");
}
