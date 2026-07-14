import { requireSession } from "@/lib/auth/dal";
import { getUserPreferences } from "@/lib/user/preferences";
import { getShareSettings } from "@/lib/sharing";
import { Card } from "@/components/ui/card";
import { SettingsForm } from "./settings-form";
import { SharingSettingsForm } from "@/components/sharing-settings-form";

export default async function SettingsPage() {
  const session = await requireSession();
  const preferences = await getUserPreferences(session.user.id);
  const shareSettings = await getShareSettings(session.user.id);

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
      <Card>
        <SharingSettingsForm initialSettings={shareSettings || undefined} />
      </Card>
    </div>
  );
}
