import Link from "next/link";
import { requireSession } from "@/lib/auth/dal";
import { listBusinessesWithStats } from "@/lib/crm";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { NewBusinessForm } from "./new-business-form";

export default async function BusinessesPage() {
  const session = await requireSession();
  const businesses = await listBusinessesWithStats(session.user.id);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
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
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {businesses.map((b) => (
            <Link key={b.id} href={`/businesses/${b.id}`}>
              <Card className="flex h-full flex-col gap-4 hover:bg-foreground/5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{b.name}</p>
                  {b.description && (
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted">{b.description}</p>
                  )}
                </div>
                <div className="mt-auto grid grid-cols-3 gap-2 border-t border-border pt-3">
                  <div>
                    <p className="text-lg font-semibold">{b.leads}</p>
                    <p className="text-[11px] text-muted">Leads</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold">{b.won}</p>
                    <p className="text-[11px] text-muted">Won</p>
                  </div>
                  <div>
                    <p className={b.overdue > 0 ? "text-lg font-semibold text-danger" : "text-lg font-semibold"}>
                      {b.overdue}
                    </p>
                    <p className="text-[11px] text-muted">Overdue</p>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
