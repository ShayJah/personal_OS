"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { SharedLink } from "@prisma/client";

interface ShareLink {
  id: string;
  token: string;
  type: string;
  target: string | null;
  expiresAt: Date | null;
  createdAt: Date;
}

export function ShareLinksManager({
  initialLinks,
  userId,
}: {
  initialLinks: ShareLink[];
  userId: string;
}) {
  const [links, setLinks] = useState<ShareLink[]>(initialLinks);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateShare = async () => {
    try {
      setIsCreating(true);
      const res = await fetch("/api/shares", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "progress" }),
      });

      if (!res.ok) throw new Error("Failed to create share link");

      const newLink = await res.json();
      setLinks([newLink, ...links]);
    } catch (error) {
      console.error("Error creating share link:", error);
      alert("Failed to create share link");
    } finally {
      setIsCreating(false);
    }
  };

  const handleRevoke = async (token: string) => {
    if (!confirm("Are you sure you want to revoke this share link?")) return;

    try {
      const res = await fetch(`/api/shares?token=${token}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to revoke link");

      setLinks(links.filter((l) => l.token !== token));
    } catch (error) {
      console.error("Error revoking link:", error);
      alert("Failed to revoke link");
    }
  };

  const getShareUrl = (token: string) => {
    return `${typeof window !== "undefined" ? window.location.origin : ""}/share/${token}`;
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "Never";
    return new Date(date).toLocaleDateString();
  };

  const isExpired = (expiresAt: Date | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  return (
    <div className="space-y-6">
      {/* Create New Share */}
      <div className="space-y-3">
        <h3 className="font-medium">Create New Share Link</h3>
        <p className="text-xs text-foreground/60">
          Creates a link to your live progress page. To share a specific
          report, use the Share button on that report instead.
        </p>
        <Button
          onClick={handleCreateShare}
          disabled={isCreating}
          className="bg-foreground text-background hover:bg-foreground/90"
        >
          {isCreating ? "Creating..." : "Create Progress Page Link"}
        </Button>
      </div>

      <div className="border-t pt-6">
        {/* Existing Links */}
        <h3 className="mb-3 font-medium">Active Share Links</h3>

        {links.length === 0 ? (
          <p className="text-sm text-foreground/60">
            No share links yet. Create one above to start sharing.
          </p>
        ) : (
          <div className="space-y-3">
            {links.map((link) => (
              <div
                key={link.id}
                className="rounded-lg border border-foreground/10 bg-foreground/5 p-4"
              >
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium capitalize">
                        {link.type}
                      </span>
                      {isExpired(link.expiresAt) && (
                        <span className="rounded bg-red-500/20 px-2 py-0.5 text-xs text-red-600 dark:text-red-400">
                          Expired
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-foreground/50">
                      Created: {formatDate(link.createdAt)}
                      {link.expiresAt && ` • Expires: ${formatDate(link.expiresAt)}`}
                    </p>
                  </div>
                  <Button
                    onClick={() => handleRevoke(link.token)}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                  >
                    Revoke
                  </Button>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={getShareUrl(link.token)}
                    readOnly
                    className="flex-1 rounded bg-background px-3 py-2 text-xs font-mono"
                  />
                  <Button
                    onClick={() => {
                      navigator.clipboard.writeText(getShareUrl(link.token));
                      alert("Link copied!");
                    }}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                  >
                    Copy
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
