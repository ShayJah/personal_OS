"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { decideAction } from "./actions";

type Decision = "approved" | "rejected";

export function ApprovalButtons({ number }: { number: number }) {
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState<Decision | null>(null);
  const [error, setError] = useState<string | null>(null);

  function submit(decision: Decision) {
    setError(null);
    startTransition(async () => {
      const result = await decideAction(number, decision);
      if (!result.ok) setError(result.error);
      setConfirming(null);
    });
  }

  if (confirming) {
    return (
      <div className="space-y-2">
        <p className="text-sm">
          {confirming === "approved" ? "Approve" : "Reject"} task #{number}?
        </p>
        <div className="flex gap-2">
          <Button disabled={pending} onClick={() => submit(confirming)}>
            {pending ? "Saving..." : "Confirm"}
          </Button>
          <Button
            variant="outline"
            disabled={pending}
            onClick={() => setConfirming(null)}
          >
            Cancel
          </Button>
        </div>
        {error && <p className="text-sm text-red-700">{error}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Button onClick={() => setConfirming("approved")}>Approve</Button>
        <Button variant="outline" onClick={() => setConfirming("rejected")}>
          Reject
        </Button>
      </div>
      {error && <p className="text-sm text-red-700">{error}</p>}
    </div>
  );
}
