"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { addActivityAction } from "./actions";

export function ActivityForm({
  businessId,
  crmRecordId,
}: {
  businessId: string;
  crmRecordId: string;
}) {
  const [saving, setSaving] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        setSaving(true);
        await addActivityAction(businessId, crmRecordId, formData);
        formRef.current?.reset();
        setSaving(false);
      }}
      className="flex flex-col gap-2 sm:flex-row"
    >
      <select
        name="kind"
        aria-label="Activity type"
        defaultValue="note"
        className="rounded-lg border border-border-strong px-2 py-2 text-sm sm:w-32"
      >
        <option value="note">Note</option>
        <option value="call">Call</option>
        <option value="meeting">Meeting</option>
      </select>
      <input
        name="body"
        placeholder="What happened?"
        required
        maxLength={2000}
        className="flex-1 rounded-lg border border-border-strong px-3 py-2 text-sm"
      />
      <Button type="submit" disabled={saving} size="sm">
        {saving ? "Adding..." : "Add"}
      </Button>
    </form>
  );
}
