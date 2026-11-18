"use client";

import Link from "next/link";
import { useTransition } from "react";
import { updateStageAction, assignOwnerAction } from "./actions";
import { CRM_STAGES, stageColorClasses } from "@/lib/crm-stages";
import { Avatar } from "@/components/ui/avatar";
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
  lastTouchAt: Date | null;
  nextAction: string | null;
  nextActionAt: Date | null;
}

function touchLabel(record: CrmRecordRowData): string | null {
  const now = Date.now();
  if (record.nextActionAt) {
    const overdue = record.nextActionAt.getTime() < now;
    const days = Math.abs(Math.round((record.nextActionAt.getTime() - now) / 86_400_000));
    const label = record.nextAction ? `${record.nextAction} ` : "Next action ";
    if (overdue) return `${label}${days === 0 ? "today" : `${days}d overdue`}`;
    return `${label}in ${days === 0 ? "<1d" : `${days}d`}`;
  }
  if (record.lastTouchAt) {
    const days = Math.round((now - record.lastTouchAt.getTime()) / 86_400_000);
    return `Last touch ${days === 0 ? "today" : `${days}d ago`}`;
  }
  return null;
}

export function CrmRecordRow({
  record,
  members,
}: {
  record: CrmRecordRowData;
  members: BusinessMember[];
}) {
  const [isPending, startTransition] = useTransition();
  const touch = touchLabel(record);
  const isOverdue = Boolean(record.nextActionAt && record.nextActionAt < new Date());

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border px-3 py-2.5">
      <Link
        href={`/businesses/${record.businessId}/contacts/${record.id}`}
        className="flex min-w-0 flex-1 items-center gap-3"
      >
        <Avatar name={record.contact.name} />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{record.contact.name}</p>
          <p className="truncate text-xs text-muted">
            {[record.contact.company, record.contact.email].filter(Boolean).join(" · ") || "—"}
          </p>
        </div>
      </Link>
      {touch && (
        <span className={cn("hidden shrink-0 text-xs sm:block", isOverdue ? "text-danger" : "text-muted")}>
          {touch}
        </span>
      )}
      <select
        value={record.assignedTo?.id ?? ""}
        disabled={isPending}
        onChange={(e) =>
          startTransition(() => assignOwnerAction(record.businessId, record.id, e.target.value))
        }
        aria-label={`Owner for ${record.contact.name}`}
        className="hidden shrink-0 rounded-lg border border-border-strong bg-transparent px-2 py-1.5 text-xs sm:block"
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
