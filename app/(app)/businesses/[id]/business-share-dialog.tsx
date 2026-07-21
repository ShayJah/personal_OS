"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

type DetailLevel = "overview" | "pipeline" | "full";

const DETAIL_LEVEL_OPTIONS: { value: DetailLevel; label: string; description: string }[] = [
  { value: "overview", label: "Overview", description: "Name, description, and plan doc only." },
  { value: "pipeline", label: "Pipeline snapshot", description: "Overview plus lead counts by stage." },
  { value: "full", label: "Full CRM records", description: "Overview plus every lead, contact, and stage." },
];

export function BusinessShareDialog({ businessId }: { businessId: string }) {
  const [open, setOpen] = useState(false);
  const [detailLevel, setDetailLevel] = useState<DetailLevel>("overview");
  const [allowEdit, setAllowEdit] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [shareLink, setShareLink] = useState<string | null>(null);

  const handleCreate = async () => {
    try {
      setIsCreating(true);
      const res = await fetch("/api/shares", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "business", businessId, detailLevel, allowEdit }),
      });

      if (!res.ok) throw new Error("Failed to create share link");

      const { token } = await res.json();
      setShareLink(`${window.location.origin}/share/${token}`);
    } catch (error) {
      console.error("Error creating business share link:", error);
      alert("Failed to create share link");
    } finally {
      setIsCreating(false);
    }
  };

  const reset = () => {
    setOpen(false);
    setShareLink(null);
    setDetailLevel("overview");
    setAllowEdit(false);
  };

  if (!open) {
    return (
      <Button
        onClick={() => setOpen(true)}
        variant="outline"
        size="sm"
        className="text-xs"
      >
        Share
      </Button>
    );
  }

  return (
    <div className="rounded-lg border border-foreground/10 bg-foreground/5 p-4">
      {shareLink ? (
        <div className="space-y-2">
          <p className="text-xs text-muted">Share this business plan:</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={shareLink}
              readOnly
              aria-label="Share link URL"
              className="flex-1 rounded bg-background px-3 py-1 text-xs"
            />
            <Button
              onClick={() => {
                navigator.clipboard.writeText(shareLink);
                alert("Link copied to clipboard!");
              }}
              variant="outline"
              size="sm"
            >
              Copy
            </Button>
          </div>
          <Button onClick={reset} variant="ghost" size="sm" className="text-xs">
            Close
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="space-y-2">
            <p className="text-xs font-medium">What can they see?</p>
            {DETAIL_LEVEL_OPTIONS.map((option) => (
              <label key={option.value} className="flex items-start gap-2 text-xs">
                <input
                  type="radio"
                  name="detailLevel"
                  value={option.value}
                  checked={detailLevel === option.value}
                  onChange={() => setDetailLevel(option.value)}
                  className="mt-0.5"
                />
                <span>
                  <span className="font-medium">{option.label}</span>{" "}
                  <span className="text-muted">— {option.description}</span>
                </span>
              </label>
            ))}
          </div>

          <label className="flex items-start gap-2 text-xs">
            <input
              type="checkbox"
              checked={allowEdit}
              onChange={(e) => setAllowEdit(e.target.checked)}
              className="mt-0.5"
            />
            <span>
              <span className="font-medium">Allow editing</span>{" "}
              <span className="text-muted">
                — anyone who opens the link and signs in with GitHub gets full edit
                access to this business, the same as you.
              </span>
            </span>
          </label>

          <div className="flex items-center gap-2">
            <Button
              onClick={handleCreate}
              disabled={isCreating}
              size="sm"
              className="text-xs"
            >
              {isCreating ? "Creating..." : "Create link"}
            </Button>
            <Button onClick={reset} variant="ghost" size="sm" className="text-xs">
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
