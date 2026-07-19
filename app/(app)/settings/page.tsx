import { requireSession } from "@/lib/auth/dal";
import { getUserPreferences } from "@/lib/user/preferences";
import { getShareSettings } from "@/lib/sharing";
import { isConnected as isGoogleCalendarConnected } from "@/lib/google-calendar";
import { isConnected as isHevyConnected } from "@/lib/hevy";
import { getLastSyncDate } from "@/lib/metrics";
import { Card } from "@/components/ui/card";
import { SettingsForm } from "./settings-form";
import { SharingSettingsForm } from "@/components/sharing-settings-form";
import { GoogleCalendarSettings } from "@/components/google-calendar-settings";
import { HevySettings } from "@/components/hevy-settings";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{
    google_calendar_connected?: string;
    google_calendar_error?: string;
  }>;
}) {
  const session = await requireSession();
  const { google_calendar_connected, google_calendar_error } = await searchParams;
  const [preferences, shareSettings, googleConnected, hevyConnected, hevyLastSync] = await Promise.all([
    getUserPreferences(session.user.id),
    getShareSettings(session.user.id),
    isGoogleCalendarConnected(session.user.id),
    isHevyConnected(session.user.id),
    getLastSyncDate(session.user.id, "hevy"),
  ]);

  const notice = google_calendar_connected
    ? ({ type: "connected" } as const)
    : google_calendar_error
      ? ({ type: "error", message: google_calendar_error } as const)
      : undefined;

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <p className="eyebrow">Account</p>
        <h1 className="mt-1 font-serif text-3xl">Settings</h1>
        <p className="mt-1 text-sm text-muted">
          Signed in as {session.user.email ?? session.user.name}
        </p>
      </div>
      <Card>
        <SettingsForm preferences={preferences} />
      </Card>
      <GoogleCalendarSettings connected={googleConnected} notice={notice} />
      <HevySettings
        connected={hevyConnected}
        lastSync={hevyLastSync ? hevyLastSync.toLocaleDateString() : null}
      />
      <Card>
        <SharingSettingsForm initialSettings={shareSettings || undefined} />
      </Card>
    </div>
  );
}
