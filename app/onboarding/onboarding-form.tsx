"use client";

import { useEffect, useState } from "react";
import { completeOnboarding } from "./actions";

export function OnboardingForm({ name }: { name: string }) {
  const [timezone, setTimezone] = useState("UTC");

  useEffect(() => {
    // Reads the browser's timezone, which is only available client-side and
    // would cause a server/client mismatch if computed during render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
  }, []);

  return (
    <form action={completeOnboarding} className="space-y-6">
      <input type="hidden" name="theme" value="system" />
      <div className="space-y-1 text-center">
        <h1 className="font-serif text-2xl">Welcome, {name}</h1>
        <p className="text-sm text-muted">
          One quick preference before we get started.
        </p>
      </div>

      <div className="space-y-2">
        <label htmlFor="timezone" className="text-sm font-medium">
          Timezone
        </label>
        <input
          id="timezone"
          name="timezone"
          value={timezone}
          onChange={(e) => setTimezone(e.target.value)}
          className="w-full px-3 py-2 text-sm"
        />
      </div>

      <button
        type="submit"
        className="w-full rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-background transition hover:opacity-90"
      >
        Continue to dashboard
      </button>
    </form>
  );
}
