"use client";

import Link from "next/link";
import { useTransition } from "react";
import { updateStageAction, assignOwnerAction } from "./actions";
import { CRM_STAGES, stageColorClasses } from "@/lib/crm-stages";
import { cn } from "@/lib/utils";

export interface BusinessMember {
  id: string;
  name: string | null;
  email: string;
}

export interface CrmRecordRowData {
  id: string;
  businessId: string;
  stage: string;
  contact: { name: string; email: string | null; company: string | null };
  assignedTo: BusinessMember | null;
}

export function CrmRecordRow({
  record,
  members,
}: {
  record: CrmRecordRowData;
  members: BusinessMember[];
}) {
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
        value={record.assignedTo?.id ?? ""}
        disabled={isPending}
        onChange={(e) =>
          startTransition(() => assignOwnerAction(record.businessId, record.id, e.target.value))
        }
        aria-label={`Owner for ${record.contact.name}`}
        className="shrink-0 rounded-lg border border-border-strong bg-transparent px-2 py-1.5 text-xs"
      >
        <option value="">Unassigned</option>
        {members.map((m) => (
          <option key={m.id} value={m.id}>
            {m.name ?? m.email}
          </option>
        ))}
      </select>
      <select
        value={record.stage}
        disabled={isPending}
        onChange={(e) =>
          startTransition(() => updateStageAction(record.businessId, record.id, e.target.value))
        }
        aria-label={`Stage for ${record.contact.name}`}
        className={cn(
          "shrink-0 rounded-lg border px-2 py-1.5 text-xs font-medium capitalize transition",
          stageColorClasses(record.stage)
        )}
      >
        {CRM_STAGES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
    </div>
  );
}
