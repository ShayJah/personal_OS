import Link from "next/link";
import { requireSession } from "@/lib/auth/dal";
import { getCrmRecordDetail } from "@/lib/crm";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ActivityForm } from "./activity-form";
import { ResearchButton } from "./research-button";
import { DraftCard } from "./draft-card";

export default async function CrmRecordDetailPage({
  params,
}: {
  params: Promise<{ id: string; crmRecordId: string }>;
}) {
  const session = await requireSession();
  const { id: businessId, crmRecordId } = await params;

  const record = await getCrmRecordDetail(session.user.id, crmRecordId);

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/businesses/${businessId}`} className="text-sm text-muted hover:text-foreground">
          ← {record.business.name}
        </Link>
        <h1 className="mt-3 font-serif text-3xl">{record.contact.name}</h1>
        <p className="mt-1 text-sm text-muted">
          {[record.contact.role, record.contact.company, record.contact.email]
            .filter(Boolean)
            .join(" · ") || "No details on file yet."}
        </p>
      </div>

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
          <div className="space-y-2">
            {record.activities.map((activity) => (
              <Card key={activity.id} className="py-2.5">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs capitalize text-muted">{activity.kind}</span>
                  <span className="text-xs text-muted">
                    {activity.occurredAt.toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
                <p className="mt-1 text-sm">{activity.body}</p>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
