"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const ERROR_MESSAGES: Record<string, string> = {
  access_denied: "You declined access, so nothing was connected.",
  invalid_state: "That connection attempt expired or was invalid. Try again.",
  connect_failed: "Couldn't complete the connection. Try again.",
};

export function GmailSettings({
  connected,
  notice,
}: {
  connected: boolean;
  notice?: { type: "connected" | "error"; message?: string };
}) {
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(connected);

  const handleDisconnect = async () => {
    if (!confirm("Disconnect Gmail? The morning outreach agent will fall back to in-app drafts only.")) {
      return;
    }
    try {
      setIsDisconnecting(true);
      const res = await fetch("/api/integrations/gmail/disconnect", { method: "POST" });
      if (!res.ok) throw new Error("Failed to disconnect");
      setIsConnected(false);
    } catch {
      alert("Failed to disconnect Gmail");
    } finally {
      setIsDisconnecting(false);
    }
  };

  return (
    <Card className="space-y-3">
      <div>
        <p className="eyebrow">Integrations</p>
        <h2 className="mt-1 font-serif text-lg">Gmail</h2>
        <p className="mt-1 text-sm text-muted">
          Grants draft-only access (never reads or sends mail). Once connected, the morning
          outreach agent creates real drafts in your Gmail Drafts folder — nothing sends
          automatically, you still review and hit send yourself.
        </p>
      </div>

      {notice?.type === "connected" && (
        <p className="rounded-lg bg-success-soft px-3 py-2 text-sm text-success">
          Connected! Outreach drafts will now land in Gmail.
        </p>
      )}
      {notice?.type === "error" && (
        <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
          {ERROR_MESSAGES[notice.message ?? ""] ?? "Something went wrong connecting Gmail."}
        </p>
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
        <a
          href="/api/integrations/gmail/connect"
          className="inline-flex items-center justify-center rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition hover:opacity-90"
        >
          Connect Gmail
        </a>
      )}
    </Card>
  );
}
