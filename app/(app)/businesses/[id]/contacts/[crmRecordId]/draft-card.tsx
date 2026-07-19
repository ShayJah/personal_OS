"use client";

import { useTransition } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { setDraftStatusAction } from "./actions";

export interface DraftData {
  id: string;
  subject: string;
  body: string;
  researchNotes: string | null;
  status: string;
}

export function DraftCard({
  draft,
  businessId,
  crmRecordId,
  recipientEmail,
}: {
  draft: DraftData;
  businessId: string;
  crmRecordId: string;
  recipientEmail: string | null;
}) {
  const [isPending, startTransition] = useTransition();

  const mailtoHref = recipientEmail
    ? `mailto:${encodeURIComponent(recipientEmail)}?subject=${encodeURIComponent(
        draft.subject
      )}&body=${encodeURIComponent(draft.body)}`
    : undefined;

  return (
    <Card className="space-y-2">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium">{draft.subject}</p>
        <span className="shrink-0 rounded bg-accent-soft px-1.5 py-0.5 text-xs capitalize text-accent">
          {draft.status}
        </span>
      </div>
      <p className="whitespace-pre-wrap text-sm text-muted">{draft.body}</p>
      {draft.researchNotes && (
        <p className="border-t border-border pt-2 text-xs text-muted">
          <span className="font-medium text-foreground">Research: </span>
          {draft.researchNotes}
        </p>
      )}

      <div className="flex items-center gap-2 pt-1">
        {draft.status === "pending" && (
          <>
            <Button
              size="sm"
              disabled={isPending}
              onClick={() =>
                startTransition(() =>
                  setDraftStatusAction(businessId, crmRecordId, draft.id, "approved")
                )
              }
            >
              Approve
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
        )}
        {draft.status === "approved" && mailtoHref && (
          <a
            href={mailtoHref}
            className="inline-flex min-h-9 items-center justify-center rounded-lg border border-border-strong px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-foreground/5"
          >
            Open in email
          </a>
        )}
        {draft.status === "approved" && !recipientEmail && (
          <span className="text-xs text-muted">No email on file for this contact.</span>
        )}
      </div>
    </Card>
  );
}
