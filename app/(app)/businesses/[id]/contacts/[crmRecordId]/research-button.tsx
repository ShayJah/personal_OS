"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { triggerResearchDraftAction } from "./actions";

export function ResearchButton({
  businessId,
  crmRecordId,
}: {
  businessId: string;
  crmRecordId: string;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      disabled={isPending}
      onClick={() => startTransition(() => triggerResearchDraftAction(businessId, crmRecordId))}
    >
      {isPending ? "Researching…" : "Research & draft email"}
    </Button>
  );
}
