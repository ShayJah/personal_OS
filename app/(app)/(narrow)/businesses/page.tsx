import Link from "next/link";
import { requireSession } from "@/lib/auth/dal";
import { listBusinesses } from "@/lib/crm";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { NewBusinessForm } from "./new-business-form";

export default async function BusinessesPage() {
  const session = await requireSession();
  const businesses = await listBusinesses(session.user.id);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="eyebrow">Run</p>
          <h1 className="mt-1 font-serif text-3xl">Businesses</h1>
          <p className="mt-1 text-sm text-muted">Pipelines, contacts, and outreach drafts.</p>
        </div>
        <NewBusinessForm />
      </div>

      {businesses.length === 0 ? (
        <EmptyState
          title="No businesses yet"
          description="Create one to start tracking a pipeline."
        />
      ) : (
        <div className="space-y-2">
          {businesses.map((b) => (
            <Link key={b.id} href={`/businesses/${b.id}`}>
              <Card className="flex items-center justify-between py-3 hover:bg-foreground/5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{b.name}</p>
                  {b.description && <p className="truncate text-xs text-muted">{b.description}</p>}
                </div>
                <span className="shrink-0 text-xs text-muted">
                  {b._count.crmRecords} in pipeline
                </span>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
