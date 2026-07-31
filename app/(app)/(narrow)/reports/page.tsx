import { requireSession } from "@/lib/auth/dal";
import { isAiEnabled } from "@/lib/ai";
import { listReports } from "@/lib/reports";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { GenerateButtons } from "./generate-buttons";
import { ReportView } from "./report-view";

export default async function ReportsPage() {
  const session = await requireSession();

  if (!isAiEnabled()) {
    return (
      <Card className="py-10 text-center">
        <h1 className="font-serif text-2xl">Reports</h1>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
          Add an <code className="rounded bg-foreground/10 px-1">ANTHROPIC_API_KEY</code> to{" "}
          <code className="rounded bg-foreground/10 px-1">.env.local</code> to
          enable report generation.
        </p>
      </Card>
    );
  }

  const reports = await listReports(session.user.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="eyebrow">Review</p>
          <h1 className="mt-1 font-serif text-3xl">Reports</h1>
          <p className="mt-1 text-sm text-muted">
            Daily and weekly accountability summaries.
          </p>
        </div>
        <GenerateButtons />
      </div>

      {reports.length === 0 ? (
        <EmptyState
          title="No reports yet"
          description="Generate a daily or weekly report above."
        />
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <ReportView key={report.id} report={report} />
          ))}
        </div>
      )}
    </div>
  );
}
