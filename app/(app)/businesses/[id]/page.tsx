import Link from "next/link";
import { requireSession } from "@/lib/auth/dal";
import { getOwnedBusiness, listCrmRecords, listBusinessMembers, getBusinessOutreachStats } from "@/lib/crm";
import { CRM_STAGES, stageColorClasses } from "@/lib/crm-stages";
import { EmptyState } from "@/components/ui/empty-state";
import { StatTile } from "@/components/ui/stat-tile";
import { NewLeadForm } from "./new-lead-form";
import { CrmRecordRow, type CrmRecordRowData } from "./crm-record-row";
import { BusinessShareDialog } from "./business-share-dialog";
import { BusinessNotes } from "./business-notes";
import { SheetImport } from "./sheet-import";
import { SharedCalendarSettings } from "./shared-calendar";
import { OutreachStatsCard } from "./outreach-stats";

export default async function BusinessDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireSession();
  const { id } = await params;

  const [business, records, members, stats] = await Promise.all([
    getOwnedBusiness(session.user.id, id),
    listCrmRecords(session.user.id, id),
    listBusinessMembers(session.user.id, id),
    getBusinessOutreachStats(session.user.id, id),
  ]);

  const now = new Date();
  const overdue = records.filter(
    (r) => r.nextActionAt && r.nextActionAt < now && r.stage !== "won" && r.stage !== "lost"
  );

  const recordsByStage = new Map<string, typeof records>();
  for (const record of records) {
    const bucket = recordsByStage.get(record.stage) ?? [];
    bucket.push(record);
    recordsByStage.set(record.stage, bucket);
  }
  const stageOrder = [...CRM_STAGES.filter((s) => s !== "won" && s !== "lost"), "won", "lost"];

  function toRowData(record: (typeof records)[number]): CrmRecordRowData {
    return {
      id: record.id,
      businessId: business.id,
      stage: record.stage,
      contact: {
        name: record.contact.name,
        email: record.contact.email,
        company: record.contact.company,
      },
      assignedTo: record.assignedTo,
      lastTouchAt: record.lastTouchAt,
      nextAction: record.nextAction,
      nextActionAt: record.nextActionAt,
    };
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <div>
        <Link href="/businesses" className="text-sm text-muted hover:text-foreground">
          ← Businesses
        </Link>
        <div className="mt-3 flex items-start justify-between gap-4">
          <h1 className="font-serif text-3xl">{business.name}</h1>
          <BusinessShareDialog businessId={business.id} />
        </div>
        {business.description && <p className="mt-1 text-sm text-muted">{business.description}</p>}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatTile value={stats.totalLeads} label="Leads" />
            <StatTile value={stats.won} label="Won" />
            <StatTile value={stats.totalActivities} label="Touches logged" />
            <StatTile value={overdue.length} label="Overdue" />
          </div>

          {overdue.length > 0 && (
            <div className="space-y-2 rounded-2xl border border-danger/30 bg-danger-soft/40 p-4">
              <p className="eyebrow text-danger">Overdue</p>
              <ul className="space-y-1.5 text-sm">
                {overdue.map((r) => {
                  const days = Math.round((now.getTime() - r.nextActionAt!.getTime()) / 86_400_000);
                  return (
                    <li key={r.id}>
                      <Link
                        href={`/businesses/${business.id}/contacts/${r.id}`}
                        className="underline decoration-danger/30 underline-offset-2 hover:decoration-danger"
                      >
                        {r.contact.name}
                      </Link>
                      <span className="text-muted"> — {r.nextAction ?? "follow up"}, </span>
                      <span className="text-danger">{days === 0 ? "today" : `${days} days overdue`}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          <NewLeadForm businessId={business.id} />

          {records.length === 0 ? (
            <EmptyState title="No leads yet" description="Add one to start the pipeline." />
          ) : (
            <div className="space-y-5">
              {stageOrder.map((stage) => {
                const bucket = recordsByStage.get(stage);
                if (!bucket || bucket.length === 0) return null;
                return (
                  <div key={stage} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${stageColorClasses(stage).split(" ")[0]}`} />
                      <p className="eyebrow">{stage}</p>
                      <span className="text-xs text-muted-soft">{bucket.length}</span>
                    </div>
                    <div className="space-y-2">
                      {bucket.map((record) => (
                        <CrmRecordRow key={record.id} members={members} record={toRowData(record)} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <OutreachStatsCard stats={stats} />
          <BusinessNotes businessId={business.id} initialNote={business.contextDoc ?? ""} />
          <SheetImport
            businessId={business.id}
            crmSheetId={business.crmSheetId}
            crmSheetTab={business.crmSheetTab ?? "CRM"}
          />
          <SharedCalendarSettings businessId={business.id} sharedCalendarId={business.sharedCalendarId} />
        </div>
      </div>
    </div>
  );
}
