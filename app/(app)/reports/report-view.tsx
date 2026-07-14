"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ReportExportButton } from "@/components/report-export-button";

export type ReportData = {
  id: string;
  type: string;
  periodStart: Date | string;
  periodEnd: Date | string;
  content: string;
};

function formatRange(start: Date | string, end: Date | string) {
  const s = new Date(start);
  const e = new Date(end);
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  return s.toDateString() === e.toDateString()
    ? s.toLocaleDateString(undefined, opts)
    : `${s.toLocaleDateString(undefined, opts)} – ${e.toLocaleDateString(undefined, opts)}`;
}

export function ReportView({ report }: { report: ReportData }) {
  const [isSharingOpen, setIsSharingOpen] = useState(false);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [isCreatingShare, setIsCreatingShare] = useState(false);

  const handleCreateShareLink = async () => {
    try {
      setIsCreatingShare(true);
      const res = await fetch("/api/shares", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "report",
          target: report.id,
        }),
      });

      if (!res.ok) throw new Error("Failed to create share link");

      const { token } = await res.json();
      const link = `${window.location.origin}/share/${token}`;
      setShareLink(link);
    } catch (error) {
      console.error("Error creating share link:", error);
      alert("Failed to create share link");
    } finally {
      setIsCreatingShare(false);
    }
  };

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="rounded bg-foreground/5 px-2 py-0.5 text-xs font-medium capitalize text-foreground/60">
            {report.type}
          </span>
          <span className="text-xs text-foreground/40">
            {formatRange(report.periodStart, report.periodEnd)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <ReportExportButton
            reportId={report.id}
            reportTitle={`${report.type.charAt(0).toUpperCase() + report.type.slice(1)} Report`}
            reportContent={report.content}
            reportType={report.type}
            periodStart={report.periodStart}
            periodEnd={report.periodEnd}
          />
          <Button
            onClick={() => setIsSharingOpen(!isSharingOpen)}
            variant="outline"
            size="sm"
            className="text-xs"
          >
            Share
          </Button>
        </div>
      </div>

      {isSharingOpen && (
        <div className="mb-4 rounded-lg border border-foreground/10 bg-foreground/5 p-4">
          {shareLink ? (
            <div className="space-y-2">
              <p className="text-xs text-foreground/60">Share this report:</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={shareLink}
                  readOnly
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
            </div>
          ) : (
            <Button
              onClick={handleCreateShareLink}
              disabled={isCreatingShare}
              size="sm"
              className="text-xs"
            >
              {isCreatingShare ? "Creating..." : "Create Share Link"}
            </Button>
          )}
        </div>
      )}

      <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:font-medium prose-p:my-1.5 prose-ul:my-1.5">
        <ReactMarkdown>{report.content}</ReactMarkdown>
      </div>
    </Card>
  );
}
