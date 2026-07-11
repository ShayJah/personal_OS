"use client";

import { useEffect, useState } from "react";
import { completeOnboarding } from "./actions";

const THEMES = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
] as const;

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
      <div className="space-y-1 text-center">
        <h1 className="text-xl font-semibold">Welcome, {name}</h1>
        <p className="text-sm text-foreground/60">
          A couple of quick preferences before we get started.
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
          className="w-full rounded-lg border border-black/10 bg-transparent px-3 py-2 text-sm dark:border-white/10"
        />
      </div>

      <div className="space-y-2">
        <span className="text-sm font-medium">Theme</span>
        <div className="grid grid-cols-3 gap-2">
          {THEMES.map((t) => (
            <label
              key={t.value}
              className="flex cursor-pointer items-center justify-center rounded-lg border border-black/10 px-3 py-2 text-sm has-[:checked]:border-foreground dark:border-white/10"
            >
              <input
                type="radio"
                name="theme"
                value={t.value}
                defaultChecked={t.value === "system"}
                className="sr-only"
              />
              {t.label}
            </label>
          ))}
        </div>
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
