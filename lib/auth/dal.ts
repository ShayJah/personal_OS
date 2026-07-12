import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { getUserPreferences } from "@/lib/user/preferences";

export const requireSession = cache(async () => {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  return session;
});

export const requireOnboardedSession = cache(async () => {
  const session = await requireSession();
  const preferences = await getUserPreferences(session.user.id);
  if (!preferences.onboardingComplete) {
    redirect("/onboarding");
  }
  return { session, preferences };
});
