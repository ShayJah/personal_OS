import { requireSession } from "@/lib/auth/dal";
import { OnboardingForm } from "./onboarding-form";

export default async function OnboardingPage() {
  const session = await requireSession();

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-2xl border border-black/10 p-8 dark:border-white/10">
        <OnboardingForm name={session.user.name ?? "there"} />
      </div>
    </main>
  );
}
