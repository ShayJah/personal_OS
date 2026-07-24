"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { triggerResearchDraftAction } from "./actions";
import type { DraftChannel } from "@/lib/crm";

export function ResearchButton({
  businessId,
  crmRecordId,
}: {
  businessId: string;
  crmRecordId: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [pendingChannel, setPendingChannel] = useState<DraftChannel | null>(null);

  function trigger(channel: DraftChannel) {
    setPendingChannel(channel);
    startTransition(async () => {
      await triggerResearchDraftAction(businessId, crmRecordId, channel);
      setPendingChannel(null);
    });
  }

  return (
    <div className="flex items-center gap-2">
      <Button type="button" disabled={isPending} onClick={() => trigger("email")}>
        {isPending && pendingChannel === "email" ? "Researching…" : "Research & draft email"}
      </Button>
      <Button
        type="button"
        variant="outline"
        disabled={isPending}
        onClick={() => trigger("linkedin")}
      >
        {isPending && pendingChannel === "linkedin" ? "Researching…" : "Research & draft LinkedIn message"}
      </Button>
    </div>
  );
}
