import "server-only";
import { cookies } from "next/headers";
import type { UserPreferences } from "@/types/user";

const PREFS_COOKIE = "personalos_prefs";

export const DEFAULT_PREFERENCES: UserPreferences = {
  timezone: "UTC",
  theme: "system",
  onboardingComplete: false,
};

export async function getUserPreferences(): Promise<UserPreferences> {
  const raw = (await cookies()).get(PREFS_COOKIE)?.value;
  if (!raw) return DEFAULT_PREFERENCES;
  try {
    return { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export async function setUserPreferences(
  update: Partial<UserPreferences>
): Promise<UserPreferences> {
  const current = await getUserPreferences();
  const next = { ...current, ...update };
  (await cookies()).set(PREFS_COOKIE, JSON.stringify(next), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return next;
}
