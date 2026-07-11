import { requireSession } from "@/lib/auth/dal";
import { getUserPreferences } from "@/lib/user/preferences";
import { Card } from "@/components/ui/card";
import { SettingsForm } from "./settings-form";

export default async function SettingsPage() {
  const session = await requireSession();
  const preferences = await getUserPreferences();

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Settings</h1>
        <p className="text-sm text-foreground/60">
          Signed in as {session.user.email ?? session.user.name}
        </p>
      </div>
      <Card>
        <SettingsForm preferences={preferences} />
      </Card>
    </div>
  );
}
