"use client";

import { useTransition } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { updateSharedCalendarAction } from "./actions";

export function SharedCalendarSettings({
  businessId,
  sharedCalendarId,
}: {
  businessId: string;
  sharedCalendarId: string | null;
}) {
  const [isSaving, startSaving] = useTransition();

  return (
    <Card className="space-y-2">
      <div>
        <p className="eyebrow">Shared Calendar</p>
        <p className="mt-1 text-sm text-muted">
          Interviews scheduled from a contact&apos;s page get a Google Meet link and land here,
          visible to the whole team — not just whoever clicked schedule.
        </p>
      </div>
      <form
        action={(formData) => startSaving(() => updateSharedCalendarAction(businessId, formData))}
        className="flex flex-col gap-2 sm:flex-row"
      >
        <input
          name="sharedCalendarId"
          defaultValue={sharedCalendarId ?? ""}
          placeholder="Calendar ID (e.g. abc123@group.calendar.google.com)"
          className="min-w-0 flex-1 rounded-lg border border-border-strong bg-transparent px-3 py-2 text-sm"
        />
        <Button type="submit" variant="outline" disabled={isSaving}>
          {isSaving ? "Saving…" : "Save"}
        </Button>
      </form>
    </Card>
  );
}
