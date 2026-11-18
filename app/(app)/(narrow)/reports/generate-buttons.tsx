"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { generateReportAction } from "./actions";
import type { ReportType } from "@/lib/reports";

export function GenerateButtons() {
  const [isPending, startTransition] = useTransition();
  const [pendingType, setPendingType] = useState<ReportType | null>(null);

  function generate(type: ReportType) {
    setPendingType(type);
    startTransition(async () => {
      await generateReportAction(type);
      setPendingType(null);
    });
  }

  return (
    <div className="flex gap-2">
      <Button disabled={isPending} onClick={() => generate("daily")}>
        {isPending && pendingType === "daily"
          ? "Generating..."
          : "Generate today's report"}
      </Button>
      <Button
        variant="ghost"
        disabled={isPending}
        onClick={() => generate("weekly")}
      >
        {isPending && pendingType === "weekly"
          ? "Generating..."
          : "Generate this week's report"}
      </Button>
    </div>
  );
}
