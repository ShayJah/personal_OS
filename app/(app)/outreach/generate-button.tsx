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
    <div className="space-y-2">
      <Button type="button" onClick={handleClick} disabled={isPending}>
        {isPending ? "Researching & drafting…" : "Generate more outreach"}
      </Button>
      {result && <p className="text-sm text-muted">{result}</p>}
    </div>
  );
}
