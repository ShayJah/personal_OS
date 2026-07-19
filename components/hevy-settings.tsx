"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function HevySettings({
  connected,
  lastSync,
}: {
  connected: boolean;
  lastSync: string | null;
}) {
  const [isConnected, setIsConnected] = useState(connected);
  const [isSaving, setIsSaving] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    setError(null);
    setIsSaving(true);
    try {
      const res = await fetch("/api/integrations/hevy/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey }),
      });
      if (!res.ok) throw new Error("Failed to connect");
      setIsConnected(true);
      setApiKey("");
    } catch {
      setError("Couldn't connect — check your API key and try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm("Disconnect Hevy? Synced workout data stays in PersonalOS but stops updating.")) {
      return;
    }
    setIsDisconnecting(true);
    try {
      const res = await fetch("/api/integrations/hevy/disconnect", { method: "POST" });
      if (!res.ok) throw new Error("Failed to disconnect");
      setIsConnected(false);
    } catch {
      alert("Failed to disconnect Hevy");
    } finally {
      setIsDisconnecting(false);
    }
  };

  return (
    <Card className="space-y-3">
      <div>
        <p className="eyebrow">Integrations</p>
        <h2 className="mt-1 font-serif text-lg">Hevy</h2>
        <p className="mt-1 text-sm text-muted">
          Workout data syncs once a day. Find your API key in the Hevy app under Settings.
        </p>
      </div>

      {error && (
        <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>
      )}

      {isConnected ? (
        <div className="flex items-center gap-3">
          <span className="text-sm text-success">● Connected</span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleDisconnect}
            disabled={isDisconnecting}
          >
            {isDisconnecting ? "Disconnecting..." : "Disconnect"}
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Hevy API key"
            className="min-w-0 flex-1 rounded-lg border border-border-strong px-3 py-2 text-sm"
          />
          <Button type="button" size="sm" onClick={handleConnect} disabled={isSaving || !apiKey}>
            {isSaving ? "Connecting..." : "Connect"}
          </Button>
        </div>
      )}

      <p className="text-xs text-muted">
        {lastSync ? `Last synced: ${lastSync}.` : "Not synced yet."}
      </p>
    </Card>
  );
}
