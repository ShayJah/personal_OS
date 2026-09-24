"use client";

import { useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { addLeadAction } from "./actions";

export function NewLeadForm({ businessId }: { businessId: string }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  if (!open) {
    return (
      <Button variant="ghost" onClick={() => setOpen(true)} className="w-fit">
        + Add lead
      </Button>
    );
  }

  return (
    <Card>
      <form
        ref={formRef}
        action={async (formData) => {
          setSaving(true);
          await addLeadAction(businessId, formData);
          formRef.current?.reset();
          setSaving(false);
          setOpen(false);
        }}
        className="grid grid-cols-1 gap-2 sm:grid-cols-3"
      >
        <input
          name="name"
          placeholder="Name"
          required
          maxLength={200}
          className="rounded-lg border border-border-strong px-3 py-2 text-sm"
        />
        <input
          name="email"
          type="email"
          placeholder="Email (optional)"
          className="rounded-lg border border-border-strong px-3 py-2 text-sm"
        />
        <input
          name="company"
          placeholder="Company (optional)"
          className="rounded-lg border border-border-strong px-3 py-2 text-sm"
        />
        <div className="flex items-center gap-2 sm:col-span-3">
          <Button type="submit" disabled={saving}>
            {saving ? "Adding..." : "Add lead"}
          </Button>
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}
