"use client";

import { useState, useTransition } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { scheduleInterviewAction } from "./actions";

export function ScheduleInterview({
  businessId,
  crmRecordId,
}: {
  businessId: string;
  crmRecordId: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ meetLink: string | null } | { error: string } | null>(null);

  function handleSubmit(formData: FormData) {
    setResult(null);
    startTransition(async () => {
      setResult(await scheduleInterviewAction(businessId, crmRecordId, formData));
    });
  }

  return (
    <Card className="space-y-2">
      <p className="eyebrow">Schedule interview</p>
      <p className="text-xs text-muted">
        Creates a Google Meet on the shared calendar, invites the contact, moves this lead to
        Interviewed, and posts the link to Slack.
      </p>
      <form action={handleSubmit} className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          type="datetime-local"
          name="startAt"
          required
          className="rounded-lg border border-border-strong bg-transparent px-3 py-2 text-sm"
        />
        <select
          name="durationMinutes"
          defaultValue="30"
          className="rounded-lg border border-border-strong bg-transparent px-2 py-2 text-sm"
        >
          <option value="15">15 min</option>
          <option value="30">30 min</option>
          <option value="45">45 min</option>
          <option value="60">60 min</option>
        </select>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Scheduling…" : "Schedule & notify"}
        </Button>
      </form>

      {result && "error" in result && (
        <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{result.error}</p>
      )}
      {result && "meetLink" in result && (
        <p className="rounded-lg bg-success-soft px-3 py-2 text-sm text-success">
          Scheduled!{" "}
          {result.meetLink ? (
            <a href={result.meetLink} target="_blank" rel="noopener noreferrer" className="underline">
              Open Meet link
            </a>
          ) : (
            "Posted to Slack."
          )}
        </p>
      )}
    </Card>
  );
}
