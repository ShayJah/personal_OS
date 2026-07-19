"use client";

import Link from "next/link";
import { useTransition } from "react";
import { updateStageAction } from "./actions";

const STAGES = ["lead", "contacted", "qualified", "proposal", "won", "lost"];

export interface CrmRecordRowData {
  id: string;
  businessId: string;
  stage: string;
  contact: { name: string; email: string | null; company: string | null };
}

export function CrmRecordRow({ record }: { record: CrmRecordRowData }) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border px-3 py-2.5">
      <Link href={`/businesses/${record.businessId}/contacts/${record.id}`} className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{record.contact.name}</p>
        <p className="truncate text-xs text-muted">
          {[record.contact.company, record.contact.email].filter(Boolean).join(" · ") || "—"}
        </p>
      </Link>
      <select
        value={record.stage}
        disabled={isPending}
        onChange={(e) =>
          startTransition(() => updateStageAction(record.businessId, record.id, e.target.value))
        }
        aria-label={`Stage for ${record.contact.name}`}
        className="shrink-0 rounded-lg border border-border-strong px-2 py-1.5 text-xs capitalize"
      >
        {STAGES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
    </div>
  );
}
