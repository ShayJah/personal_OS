export type Theme = "light" | "dark" | "system";

export interface UserPreferences {
  timezone: string;
  theme: Theme;
  onboardingComplete: boolean;
}

export interface UserProfile {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  preferences: UserPreferences;
}

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}
