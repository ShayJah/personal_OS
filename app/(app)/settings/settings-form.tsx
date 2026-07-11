"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { updatePreferences } from "./actions";
import type { UserPreferences } from "@/types/user";

const THEMES = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
] as const;

export function SettingsForm({
  preferences,
}: {
  preferences: UserPreferences;
}) {
  const [saved, setSaved] = useState(false);

  return (
    <form
      action={async (formData) => {
        setSaved(false);
        await updatePreferences(formData);
        setSaved(true);
      }}
      className="space-y-6"
    >
      <div className="space-y-2">
        <label htmlFor="timezone" className="text-sm font-medium">
          Timezone
        </label>
        <input
          id="timezone"
          name="timezone"
          defaultValue={preferences.timezone}
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
                defaultChecked={t.value === preferences.theme}
                className="sr-only"
              />
              {t.label}
            </label>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit">Save changes</Button>
        {saved && (
          <span className="text-sm text-foreground/60">Saved.</span>
        )}
      </div>
    </form>
  );
}
