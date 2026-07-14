"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface ShareSettings {
  shareProgressPage: boolean;
  shareReports: boolean;
  shareTasks: boolean;
  shareHabits: boolean;
  shareHighlights: boolean;
}

export function SharingSettingsForm({
  initialSettings,
}: {
  initialSettings?: ShareSettings;
}) {
  const [settings, setSettings] = useState<ShareSettings>(
    initialSettings || {
      shareProgressPage: false,
      shareReports: false,
      shareTasks: false,
      shareHabits: false,
      shareHighlights: false,
    }
  );
  const [saved, setSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = (key: keyof ShareSettings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
    setSaved(false);
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/shares", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "updateSettings", settings }),
      });

      if (!res.ok) throw new Error("Failed to save settings");

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error("Error saving sharing settings:", error);
      alert("Failed to save sharing settings");
    } finally {
      setIsLoading(false);
    }
  };

  const shareOptions = [
    {
      key: "shareProgressPage" as const,
      label: "Progress Page",
      description: "Allow others to view your progress summary page",
    },
    {
      key: "shareReports" as const,
      label: "Reports",
      description: "Allow others to view your accountability reports",
    },
    {
      key: "shareTasks" as const,
      label: "Tasks & Projects",
      description: "Allow others to see your active tasks and projects",
    },
    {
      key: "shareHabits" as const,
      label: "Habits",
      description: "Allow others to view your habit tracking",
    },
    {
      key: "shareHighlights" as const,
      label: "Weekly Highlights",
      description: "Allow others to see your weekly achievements",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Sharing & Privacy</h2>
        <p className="mt-1 text-sm text-muted">
          Control what others can see when you share your progress
        </p>
      </div>

      <div className="space-y-3">
        {shareOptions.map(({ key, label, description }) => (
          <Card key={key} className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <label htmlFor={`share-${key}`} className="cursor-pointer font-medium text-sm">
                  {label}
                </label>
                <p className="mt-1 text-xs text-muted">
                  {description}
                </p>
              </div>
              <input
                id={`share-${key}`}
                type="checkbox"
                checked={settings[key]}
                onChange={() => handleToggle(key)}
                className="mt-1 h-4 w-4 cursor-pointer rounded border-foreground"
              />
            </div>
          </Card>
        ))}
      </div>

      <div className="border-t pt-6">
        <div className="space-y-3">
          <p className="text-xs text-muted">
            💡 Tip: Use share links to securely share specific reports or your
            progress with friends, family, or your coach. Each link can be
            revoked independently.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button
          onClick={handleSave}
          disabled={isLoading}
          className="bg-foreground text-background hover:bg-foreground/90"
        >
          {isLoading ? "Saving..." : "Save settings"}
        </Button>
        {saved && (
          <span className="text-sm text-muted">✓ Saved</span>
        )}
      </div>
    </div>
  );
}
