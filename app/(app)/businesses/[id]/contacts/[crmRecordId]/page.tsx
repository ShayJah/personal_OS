import Link from "next/link";
import { requireSession } from "@/lib/auth/dal";
import { getCrmRecordDetail } from "@/lib/crm";
import { stageColorClasses } from "@/lib/crm-stages";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { ActivityForm } from "./activity-form";
import { ResearchButton } from "./research-button";
import { DraftCard } from "./draft-card";
import { ScheduleInterview } from "./schedule-interview";

const ACTIVITY_DOT_CLASSES: Record<string, string> = {
  note: "bg-muted-soft",
  call: "bg-info",
  meeting: "bg-violet",
  reply: "bg-success",
  stage: "bg-accent",
};

function formatDate(date: Date | null) {
  return date
    ? date.toLocaleDateString(undefined, { month: "short", day: "numeric" })
    : "—";
}

export default async function CrmRecordDetailPage({
  params,
}: {
  params: Promise<{ id: string; crmRecordId: string }>;
}) {
  const session = await requireSession();
  const { id: businessId, crmRecordId } = await params;

  const record = await getCrmRecordDetail(session.user.id, crmRecordId);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <div>
        <Link href={`/businesses/${businessId}`} className="text-sm text-muted hover:text-foreground">
          ← {record.business.name}
        </Link>
        <h1 className="mt-3 font-serif text-3xl">{record.contact.name}</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="space-y-6">
          <div>
            <p className="eyebrow mb-2">Outreach</p>
            <ResearchButton businessId={businessId} crmRecordId={crmRecordId} />
          </div>

          {record.drafts.length > 0 && (
            <div className="space-y-2">
              {record.drafts.map((draft) => (
                <DraftCard
                  key={draft.id}
                  draft={draft}
                  businessId={businessId}
                  crmRecordId={crmRecordId}
                  recipientEmail={record.contact.email}
                />
              ))}
            </div>
          )}

          <div className="space-y-3">
            <p className="eyebrow">Activity</p>
            <ActivityForm businessId={businessId} crmRecordId={crmRecordId} />

            {record.activities.length === 0 ? (
              <EmptyState title="No activity yet" description="Add a note, call, or meeting above." />
            ) : (
              <div className="divide-y divide-border">
                {record.activities.map((activity) => (
                  <div key={activity.id} className="flex gap-3 py-3 first:pt-0">
                    <span
                      className={cn(
                        "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                        ACTIVITY_DOT_CLASSES[activity.kind] ?? "bg-muted-soft"
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs capitalize text-muted">
                          {activity.kind}
                          {activity.user && ` · ${activity.user.name ?? activity.user.email}`}
                        </span>
                        <span className="shrink-0 text-xs text-muted-soft">
                          {formatDate(activity.occurredAt)}
                        </span>
                      </div>
                      <p className="mt-1 text-sm">{activity.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <Card className="space-y-3">
            <div className="flex items-center gap-3">
              <Avatar name={record.contact.name} />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{record.contact.name}</p>
                <p className="truncate text-xs text-muted">
                  {[record.contact.role, record.contact.company].filter(Boolean).join(" · ") || "—"}
                </p>
              </div>
            </div>

            <dl className="space-y-2 border-t border-border pt-3 text-xs">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted">Stage</dt>
                <dd>
                  <span
                    className={cn(
                      "rounded-full border px-2 py-0.5 font-medium capitalize",
                      stageColorClasses(record.stage)
                    )}
                  >
                    {record.stage}
                  </span>
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted">Owner</dt>
                <dd className="truncate">
                  {record.assignedTo ? record.assignedTo.name ?? record.assignedTo.email : "Unassigned"}
                </dd>
              </div>
              {record.contact.email && (
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted">Email</dt>
                  <dd className="truncate">
                    <a href={`mailto:${record.contact.email}`} className="underline hover:text-foreground">
                      {record.contact.email}
                    </a>
                  </dd>
                </div>
              )}
              {record.contact.phone && (
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted">Phone</dt>
                  <dd className="truncate">{record.contact.phone}</dd>
                </div>
              )}
              {record.contact.linkedin && (
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted">LinkedIn</dt>
                  <dd className="truncate">
                    <a
                      href={record.contact.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:text-foreground"
                    >
                      Profile
                    </a>
                  </dd>
                </div>
              )}
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted">Last touch</dt>
                <dd>{formatDate(record.lastTouchAt)}</dd>
              </div>
              {record.nextActionAt && (
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted">{record.nextAction ?? "Next action"}</dt>
                  <dd>{formatDate(record.nextActionAt)}</dd>
                </div>
              )}
            </dl>
          </Card>

          <ScheduleInterview businessId={businessId} crmRecordId={crmRecordId} />
        </div>
      </div>
    </div>
  );
}
