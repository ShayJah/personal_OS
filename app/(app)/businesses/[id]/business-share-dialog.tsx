"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type DetailLevel = "overview" | "pipeline" | "full";

const DETAIL_LEVEL_OPTIONS: { value: DetailLevel; label: string; description: string }[] = [
  { value: "overview", label: "Overview", description: "Name, description, and plan doc only." },
  { value: "pipeline", label: "Pipeline snapshot", description: "Overview plus lead counts by stage." },
  { value: "full", label: "Full CRM records", description: "Overview plus every lead, contact, and stage." },
];

export function BusinessShareDialog({
  businessId,
  label = "Share",
  className,
}: {
  businessId: string;
  label?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [detailLevel, setDetailLevel] = useState<DetailLevel>("overview");
  const [allowEdit, setAllowEdit] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && reset();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

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

  function reset() {
    setOpen(false);
    setShareLink(null);
    setCopied(false);
    setDetailLevel("overview");
    setAllowEdit(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        className={
          className ??
          "inline-flex min-h-11 items-center rounded-xl border border-border-strong bg-surface px-4 text-sm transition hover:bg-foreground/5 active:scale-[0.98]"
        }
      >
        {label}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
          <button type="button" aria-label="Close" onClick={reset} className="absolute inset-0 bg-foreground/30" />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Share business"
            className="relative w-full max-w-md rounded-t-3xl border border-border bg-surface p-5 shadow-xl sm:rounded-3xl sm:p-6"
            style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))" }}
          >
            <p className="eyebrow">Share</p>
            <h2 className="mt-1 font-serif text-2xl">Share this business</h2>

            {shareLink ? (
              <div className="mt-4 space-y-3">
                <p className="text-sm text-muted">Anyone with this link can open the shared view.</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={shareLink}
                    readOnly
                    aria-label="Share link URL"
                    onFocus={(e) => e.currentTarget.select()}
                    className="min-h-11 min-w-0 flex-1 px-3 font-mono text-xs"
                  />
                  <Button
                    onClick={() => {
                      navigator.clipboard.writeText(shareLink);
                      setCopied(true);
                    }}
                  >
                    {copied ? "Copied" : "Copy"}
                  </Button>
                </div>
                <Button onClick={reset} variant="ghost" size="sm">
                  Done
                </Button>
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                <fieldset className="space-y-2">
                  <legend className="text-sm font-medium">What can they see?</legend>
                  {DETAIL_LEVEL_OPTIONS.map((option) => (
                    <label
                      key={option.value}
                      className="flex min-h-11 cursor-pointer items-start gap-3 rounded-xl border border-border-strong px-3 py-2.5 text-sm has-[:checked]:border-foreground has-[:checked]:bg-surface-sunken/50"
                    >
                      <input
                        type="radio"
                        name="detailLevel"
                        value={option.value}
                        checked={detailLevel === option.value}
                        onChange={() => setDetailLevel(option.value)}
                        className="mt-1"
                      />
                      <span>
                        <span className="font-medium">{option.label}</span>
                        <span className="block text-xs text-muted">{option.description}</span>
                      </span>
                    </label>
                  ))}
                </fieldset>

                <label className="flex cursor-pointer items-start gap-3 text-sm">
                  <input
                    type="checkbox"
                    checked={allowEdit}
                    onChange={(e) => setAllowEdit(e.target.checked)}
                    className="mt-0.5"
                  />
                  <span>
                    <span className="font-medium">Allow editing</span>
                    <span className="block text-xs text-muted">
                      Anyone who opens the link and signs in gets full edit access to this business, the same as you.
                    </span>
                  </span>
                </label>

                <div className="flex items-center justify-end gap-2">
                  <Button onClick={reset} variant="ghost">
                    Cancel
                  </Button>
                  <Button onClick={handleCreate} disabled={isCreating}>
                    {isCreating ? "Creating…" : "Create link"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
