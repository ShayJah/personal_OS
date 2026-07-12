import { requireSession } from "@/lib/auth/dal";
import { getUserPreferences } from "@/lib/user/preferences";
import { Card } from "@/components/ui/card";

export default async function DashboardPage() {
  const session = await requireSession();
  const prefs = await getUserPreferences(session.user.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">
          Welcome back, {session.user.name?.split(" ")[0] ?? "there"}
        </h1>
        <p className="text-sm text-foreground/60">
          {prefs.timezone} &middot; {prefs.theme} theme
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <h2 className="text-sm font-medium text-foreground/60">
            Top 3 priorities
          </h2>
          <p className="mt-2 text-sm text-foreground/40">
            Coming in a later build phase.
          </p>
        </Card>
        <Card>
          <h2 className="text-sm font-medium text-foreground/60">
            Today&apos;s summary
          </h2>
          <p className="mt-2 text-sm text-foreground/40">
            Coming in a later build phase.
          </p>
        </Card>
        <Card>
          <h2 className="text-sm font-medium text-foreground/60">
            Quick actions
          </h2>
          <p className="mt-2 text-sm text-foreground/40">
            Coming in a later build phase.
          </p>
        </Card>
      </div>
    </div>
  );
}
