import { requireSession } from "@/lib/auth/dal";
import { isAiEnabled } from "@/lib/ai";
import { listReports } from "@/lib/reports";
import { Card } from "@/components/ui/card";
import { GenerateButtons } from "./generate-buttons";
import { ReportView } from "./report-view";

export default async function ReportsPage() {
  const session = await requireSession();

  if (!isAiEnabled()) {
    return (
      <Card className="py-10 text-center">
        <h1 className="text-lg font-semibold">Reports</h1>
        <p className="mx-auto mt-2 max-w-sm text-sm text-foreground/60">
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
          <h1 className="text-xl font-semibold">Reports</h1>
          <p className="text-sm text-foreground/60">
            Daily and weekly accountability summaries.
          </p>
        </div>
        <GenerateButtons />
      </div>

      {reports.length === 0 ? (
        <Card className="py-10 text-center text-sm text-foreground/40">
          No reports yet — generate one above.
        </Card>
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
