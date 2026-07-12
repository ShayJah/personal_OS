import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/dal";
import { getUserPreferences } from "@/lib/user/preferences";
import { OnboardingForm } from "./onboarding-form";

export default async function OnboardingPage() {
  const session = await requireSession();
  const preferences = await getUserPreferences(session.user.id);

  if (preferences.onboardingComplete) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-2xl border border-black/10 p-8 dark:border-white/10">
        <OnboardingForm name={session.user.name ?? "there"} />
      </div>
    </main>
  );
}
