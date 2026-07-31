"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { updatePreferences } from "./actions";
import type { UserPreferences } from "@/types/user";

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
      <input type="hidden" name="theme" value={preferences.theme} />
      <div className="space-y-2">
        <label htmlFor="timezone" className="text-sm font-medium">
          Timezone
        </label>
        <input
          id="timezone"
          name="timezone"
          defaultValue={preferences.timezone}
          className="w-full px-3 py-2 text-sm"
        />
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit">Save changes</Button>
        {saved && <span className="text-sm text-muted">Saved.</span>}
      </div>
    </form>
  );
}
