"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { triggerOutreachBatchAction } from "./actions";

export function GenerateOutreachButton() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<string | null>(null);

  function handleClick() {
    setResult(null);
    startTransition(async () => {
      const outcome = await triggerOutreachBatchAction();
      if (outcome.ranForLeads === 0) {
        setResult("No open leads to draft for right now.");
        return;
      }
      const parts = [`Drafted for ${outcome.ranForLeads} lead${outcome.ranForLeads === 1 ? "" : "s"}`];
      if (outcome.emailPushedToGmail) parts.push(`${outcome.emailPushedToGmail} pushed to Gmail`);
      if (outcome.linkedinDrafted) parts.push(`${outcome.linkedinDrafted} LinkedIn drafts staged`);
      setResult(parts.join(" · "));
    });
  }

  return (
    <div className="flex flex-col items-start gap-2 sm:items-end">
      <Button type="button" onClick={handleClick} disabled={isPending} className="rounded-xl px-5">
        {isPending ? "Researching & drafting…" : "Draft outreach"}
      </Button>
      {result && (
        <p role="status" className="max-w-xs text-xs text-muted sm:text-right">
          {result}
        </p>
      )}
    </div>
  );
}
