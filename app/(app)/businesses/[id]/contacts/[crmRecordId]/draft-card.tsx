"use client";

import { useState, useTransition } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { setDraftStatusAction } from "@/lib/actions/draft-actions";

export interface DraftData {
  id: string;
  channel: string;
  subject: string | null;
  body: string;
  researchNotes: string | null;
  status: string;
  gmailDraftId: string | null;
}

export function DraftCard({
  draft,
  businessId,
  crmRecordId,
  recipientEmail,
  contactName,
  businessName,
}: {
  draft: DraftData;
  businessId: string;
  crmRecordId: string;
  recipientEmail: string | null;
  /** Shown above the draft when rendered outside the contact's own page (e.g. the /outreach feed). */
  contactName?: string;
  businessName?: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);
  const isLinkedIn = draft.channel === "linkedin";

  // Gmail's own compose URL, not `mailto:` — mailto opens whatever the OS's
  // default mail app is (Outlook, Mail.app, etc.), which ignores that Gmail
  // is a webmail account. This opens Gmail's compose window directly.
  const gmailComposeHref = recipientEmail
    ? `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
        recipientEmail
      )}&su=${encodeURIComponent(draft.subject ?? "")}&body=${encodeURIComponent(draft.body)}`
    : undefined;
  // If this draft was already pushed to a real Gmail draft, link straight to it instead.
  const gmailHref = draft.gmailDraftId
    ? `https://mail.google.com/mail/u/0/#drafts?compose=${draft.gmailDraftId}`
    : gmailComposeHref;

  async function handleCopy() {
    await navigator.clipboard.writeText(draft.body);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Card className="space-y-2">
      {(contactName || businessName) && (
        <p className="text-xs text-muted">
          {[contactName, businessName].filter(Boolean).join(" · ")}
        </p>
      )}
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium">{isLinkedIn ? "LinkedIn message" : draft.subject}</p>
        <div className="flex shrink-0 items-center gap-1.5">
          <span className="rounded bg-accent-soft px-1.5 py-0.5 text-xs capitalize text-accent">
            {isLinkedIn ? "LinkedIn" : "Email"}
          </span>
          <span className="rounded bg-accent-soft px-1.5 py-0.5 text-xs capitalize text-accent">
            {draft.status}
          </span>
        </div>
      </div>
      <p className="whitespace-pre-wrap text-sm text-muted">{draft.body}</p>
      {draft.researchNotes && (
        <p className="border-t border-border pt-2 text-xs text-muted">
          <span className="font-medium text-foreground">Research: </span>
          {draft.researchNotes}
        </p>
      )}

      {/* Copy/Gmail links are always available — batch-generated drafts (and Gmail-pushed
          ones especially) are already ready to send. Approve/Dismiss is just bookkeeping. */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        {isLinkedIn ? (
          <>
            <Button size="sm" variant="outline" onClick={handleCopy}>
              {copied ? "Copied!" : "Copy message"}
            </Button>
            <span className="text-xs text-muted">
              LinkedIn has no free API for auto-posting — paste this into a connection note or DM.
            </span>
          </>
        ) : gmailHref ? (
          <a
            href={gmailHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-9 items-center justify-center rounded-lg border border-border-strong px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-foreground/5"
          >
            {draft.gmailDraftId ? "Open Gmail draft" : "Open in Gmail"}
          </a>
        ) : (
          <span className="text-xs text-muted">No email on file for this contact.</span>
        )}

        {draft.status === "pending" ? (
          <>
            <Button
              size="sm"
              variant="ghost"
              disabled={isPending}
              onClick={() =>
                startTransition(() =>
                  setDraftStatusAction(businessId, crmRecordId, draft.id, "approved")
                )
              }
            >
              Mark reviewed
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={isPending}
              onClick={() =>
                startTransition(() =>
                  setDraftStatusAction(businessId, crmRecordId, draft.id, "dismissed")
                )
              }
            >
              Dismiss
            </Button>
          </>
        ) : null}
      </div>
    </Card>
  );
}
