import Link from "next/link";
import { requireSession } from "@/lib/auth/dal";
import { getOwnedBusiness, listCrmRecords } from "@/lib/crm";
import { EmptyState } from "@/components/ui/empty-state";
import { NewLeadForm } from "./new-lead-form";
import { CrmRecordRow } from "./crm-record-row";

export default async function BusinessDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireSession();
  const { id } = await params;

  const [business, records] = await Promise.all([
    getOwnedBusiness(session.user.id, id),
    listCrmRecords(session.user.id, id),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/businesses" className="text-sm text-muted hover:text-foreground">
          ← Businesses
        </Link>
        <h1 className="mt-3 font-serif text-3xl">{business.name}</h1>
        {business.description && <p className="mt-1 text-sm text-muted">{business.description}</p>}
      </div>

      <NewLeadForm businessId={business.id} />

      {records.length === 0 ? (
        <EmptyState title="No leads yet" description="Add one to start the pipeline." />
      ) : (
        <div className="space-y-2">
          {records.map((record) => (
            <CrmRecordRow
              key={record.id}
              record={{
                id: record.id,
                businessId: business.id,
                stage: record.stage,
                contact: {
                  name: record.contact.name,
                  email: record.contact.email,
                  company: record.contact.company,
                },
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
