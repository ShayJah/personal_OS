import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/db";
import type { Theme, UserPreferences } from "@/types/user";

const DEFAULT_PREFERENCES: UserPreferences = {
  timezone: "UTC",
  theme: "system",
  onboardingComplete: false,
};

export const getUserPreferences = cache(
  async (userId: string): Promise<UserPreferences> => {
    const profile = await prisma.profile.findUnique({ where: { userId } });
    if (!profile) return DEFAULT_PREFERENCES;

    return {
      timezone: profile.timezone,
      theme: profile.theme as Theme,
      onboardingComplete: profile.onboardingDone,
    };
  }
);

export async function setUserPreferences(
  userId: string,
  update: Partial<UserPreferences>
): Promise<UserPreferences> {
  const data = {
    ...(update.timezone !== undefined && { timezone: update.timezone }),
    ...(update.theme !== undefined && { theme: update.theme }),
    ...(update.onboardingComplete !== undefined && {
      onboardingDone: update.onboardingComplete,
    }),
  };

  const profile = await prisma.profile.upsert({
    where: { userId },
    update: data,
    create: { userId, ...data },
  });

  return {
    timezone: profile.timezone,
    theme: profile.theme as Theme,
    onboardingComplete: profile.onboardingDone,
  };
}
