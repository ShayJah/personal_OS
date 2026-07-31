import Link from "next/link";
import { requireSession } from "@/lib/auth/dal";
import { getOwnedBusiness, listCrmRecords, listBusinessMembers, getBusinessOutreachStats } from "@/lib/crm";
import { EmptyState } from "@/components/ui/empty-state";
import { NewLeadForm } from "./new-lead-form";
import { CrmRecordRow } from "./crm-record-row";
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

  return (
    <div className="space-y-6">
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

      <OutreachStatsCard stats={stats} />

      <BusinessNotes businessId={business.id} initialNote={business.contextDoc ?? ""} />

      <SheetImport
        businessId={business.id}
        crmSheetId={business.crmSheetId}
        crmSheetTab={business.crmSheetTab ?? "CRM"}
      />

      <SharedCalendarSettings businessId={business.id} sharedCalendarId={business.sharedCalendarId} />

      <NewLeadForm businessId={business.id} />

      {records.length === 0 ? (
        <EmptyState title="No leads yet" description="Add one to start the pipeline." />
      ) : (
        <div className="space-y-2">
          {records.map((record) => (
            <CrmRecordRow
              key={record.id}
              members={members}
              record={{
                id: record.id,
                businessId: business.id,
                stage: record.stage,
                contact: {
                  name: record.contact.name,
                  email: record.contact.email,
                  company: record.contact.company,
                },
                assignedTo: record.assignedTo,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
