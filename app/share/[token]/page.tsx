"use client";

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { use } from "react";

interface ProgressData {
  shareData: {
    today: {
      tasksCompleted: number;
      tasksTotal: number;
      completionRate: number;
      priorities: string[];
    };
    week: {
      tasksCompleted: number;
      tasksTotal: number;
      completionRate: number;
      habitLogsCompleted: number;
      habitStreak: number;
    };
    habits: Array<{
      name: string;
      completedToday: boolean;
    }>;
  };
  userName: string;
  type: "progress";
}

interface ReportShareData {
  report: {
    type: string;
    content: string;
    periodStart: string;
    periodEnd: string;
  };
  userName: string;
  type: "report";
}

interface BusinessShareData {
  business: {
    name: string;
    description: string | null;
    contextDoc: string | null;
  };
  pipeline?: {
    total: number;
    stageCounts: Record<string, number>;
  };
  records?: Array<{
    id: string;
    stage: string;
    value: number | null;
    source: string | null;
    nextAction: string | null;
    nextActionAt: string | null;
    contact: { name: string; email: string | null; company: string | null };
  }>;
  businessId: string;
  detailLevel: "overview" | "pipeline" | "full";
  userName: string;
  canEdit: boolean;
  type: "business";
}

type ShareData = ProgressData | ReportShareData | BusinessShareData;

function BusinessDisplay({ data, token }: { data: BusinessShareData; token: string }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background/80">
      <div className="mx-auto max-w-2xl space-y-6 px-4 py-12">
        <div className="text-center">
          <h1 className="text-3xl font-bold">{data.business.name}</h1>
          <p className="mt-2 text-sm text-muted">
            Shared by {data.userName}
          </p>
        </div>

        {data.canEdit ? (
          <Card className="p-4 text-center">
            <p className="text-sm">
              You have edit access to this business.
            </p>
            <Link
              href={`/businesses/${data.businessId}`}
              className="mt-2 inline-block rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90"
            >
              Open in PersonalOS
            </Link>
          </Card>
        ) : (
          <Card className="p-4 text-center">
            <p className="text-sm text-muted">
              Sign in with GitHub to get edit access to this business.
            </p>
            <Link
              href={`/login?from=${encodeURIComponent(`/share/${token}`)}`}
              className="mt-2 inline-block rounded-lg border border-border-strong px-4 py-2 text-sm font-medium hover:bg-foreground/5"
            >
              Sign in with GitHub
            </Link>
          </Card>
        )}

        {data.business.description && (
          <Card className="p-6">
            <p className="text-sm text-muted">{data.business.description}</p>
          </Card>
        )}

        {data.business.contextDoc && (
          <Card className="p-6">
            <h2 className="mb-2 text-lg font-semibold">Plan</h2>
            <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:font-medium prose-p:my-1.5 prose-ul:my-1.5">
              <ReactMarkdown>{data.business.contextDoc}</ReactMarkdown>
            </div>
          </Card>
        )}

        {data.pipeline && (
          <Card className="space-y-3 p-6">
            <h2 className="text-lg font-semibold">Pipeline</h2>
            <p className="text-sm text-muted">{data.pipeline.total} leads total</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {Object.entries(data.pipeline.stageCounts).map(([stage, count]) => (
                <div key={stage} className="rounded-lg bg-foreground/5 p-4">
                  <p className="text-2xl font-bold">{count}</p>
                  <p className="text-xs capitalize text-muted">{stage}</p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {data.records && (
          <Card className="space-y-3 p-6">
            <h2 className="text-lg font-semibold">Leads</h2>
            <div className="space-y-2">
              {data.records.map((record) => (
                <div
                  key={record.id}
                  className="rounded-lg bg-foreground/5 px-3 py-2 text-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{record.contact.name}</span>
                    <span className="rounded bg-foreground/10 px-2 py-0.5 text-xs capitalize text-muted">
                      {record.stage}
                    </span>
                  </div>
                  {(record.contact.company || record.contact.email) && (
                    <p className="text-xs text-muted">
                      {[record.contact.company, record.contact.email]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  )}
                  {record.nextAction && (
                    <p className="mt-1 text-xs text-muted-soft">
                      Next: {record.nextAction}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}

        <div className="text-center text-xs text-muted-soft">
          <p>
            Shared via <span className="font-semibold">PersonalOS</span>
          </p>
        </div>
      </div>
    </div>
  );
}

function formatRange(start: string, end: string) {
  const s = new Date(start).toLocaleDateString();
  const e = new Date(end).toLocaleDateString();
  return s === e ? s : `${s} – ${e}`;
}

function ReportDisplay({ data }: { data: ReportShareData }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background/80">
      <div className="mx-auto max-w-2xl space-y-6 px-4 py-12">
        <div className="text-center">
          <h1 className="text-3xl font-bold">{data.userName}'s Report</h1>
          <p className="mt-2 text-sm text-muted">
            {formatRange(data.report.periodStart, data.report.periodEnd)}
          </p>
        </div>

        <Card className="p-6">
          <span className="rounded bg-foreground/5 px-2 py-0.5 text-xs font-medium capitalize text-muted">
            {data.report.type}
          </span>
          <div className="prose prose-sm dark:prose-invert mt-4 max-w-none prose-headings:font-medium prose-p:my-1.5 prose-ul:my-1.5">
            <ReactMarkdown>{data.report.content}</ReactMarkdown>
          </div>
        </Card>

        <div className="text-center text-xs text-muted-soft">
          <p>
            Shared via <span className="font-semibold">PersonalOS</span>
          </p>
        </div>
      </div>
    </div>
  );
}

function ProgressDisplay({ data }: { data: ProgressData }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background/80">
      <div className="mx-auto max-w-2xl space-y-6 px-4 py-12">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold">{data.userName}'s Progress</h1>
          <p className="mt-2 text-sm text-muted">
            Shared progress summary
          </p>
        </div>

        {/* Today's Summary */}
        <Card className="space-y-4 p-6">
          <div>
            <h2 className="text-lg font-semibold">Today</h2>
            <p className="text-sm text-muted">
              {new Date().toLocaleDateString()}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-lg bg-foreground/5 p-4">
              <p className="text-2xl font-bold">
                {data.shareData.today.completionRate}%
              </p>
              <p className="text-xs text-muted">Completion Rate</p>
            </div>
            <div className="rounded-lg bg-foreground/5 p-4">
              <p className="text-2xl font-bold">
                {data.shareData.today.tasksCompleted}
              </p>
              <p className="text-xs text-muted">
                Tasks Completed ({data.shareData.today.tasksTotal})
              </p>
            </div>
            <div className="rounded-lg bg-foreground/5 p-4">
              <p className="text-2xl font-bold">
                {data.shareData.habits.filter((h) => h.completedToday).length}
              </p>
              <p className="text-xs text-muted">
                Habits ({data.shareData.habits.length})
              </p>
            </div>
          </div>

          {data.shareData.today.priorities.length > 0 && (
            <div className="border-t pt-4">
              <p className="mb-2 text-sm font-medium">Top Priorities</p>
              <ul className="space-y-1">
                {data.shareData.today.priorities.map((priority, i) => (
                  <li key={i} className="flex gap-2 text-sm text-muted">
                    <span className="text-muted-soft">{i + 1}.</span>
                    <span>{priority}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>

        {/* Weekly Summary */}
        <Card className="space-y-4 p-6">
          <div>
            <h2 className="text-lg font-semibold">This Week</h2>
            <p className="text-sm text-muted">Weekly overview</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg bg-foreground/5 p-4">
              <p className="text-2xl font-bold">
                {data.shareData.week.completionRate}%
              </p>
              <p className="text-xs text-muted">Completion Rate</p>
            </div>
            <div className="rounded-lg bg-foreground/5 p-4">
              <p className="text-2xl font-bold">
                {data.shareData.week.tasksCompleted}
              </p>
              <p className="text-xs text-muted">
                Tasks Done ({data.shareData.week.tasksTotal})
              </p>
            </div>
            <div className="rounded-lg bg-foreground/5 p-4">
              <p className="text-2xl font-bold">
                {data.shareData.week.habitStreak}
              </p>
              <p className="text-xs text-muted">Habits Active</p>
            </div>
            <div className="rounded-lg bg-foreground/5 p-4">
              <p className="text-2xl font-bold">
                {data.shareData.week.habitLogsCompleted}
              </p>
              <p className="text-xs text-muted">Habit Logs</p>
            </div>
          </div>
        </Card>

        {/* Habits */}
        {data.shareData.habits.length > 0 && (
          <Card className="space-y-4 p-6">
            <h2 className="text-lg font-semibold">Habits</h2>
            <div className="space-y-2">
              {data.shareData.habits.map((habit) => (
                <div
                  key={habit.name}
                  className="flex items-center justify-between rounded-lg bg-foreground/5 px-3 py-2"
                >
                  <span className="text-sm font-medium">{habit.name}</span>
                  <span
                    className={`text-xs font-semibold ${
                      habit.completedToday
                        ? "text-success"
                        : "text-muted-soft"
                    }`}
                  >
                    {habit.completedToday ? "✓" : "○"}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center text-xs text-muted-soft">
          <p>
            Shared via{" "}
            <span className="font-semibold">PersonalOS</span>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function PublicSharePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const [data, setData] = useState<ShareData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchShare = async () => {
      try {
        const res = await fetch(`/api/shares/${token}`);
        const body = await res.json();
        if (!res.ok) {
          setError(body.error || "Share link not found or expired");
          return;
        }
        setData(body);
      } catch (err) {
        setError("Failed to load shared content");
      } finally {
        setLoading(false);
      }
    };

    fetchShare();
  }, [token]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="p-8 text-center">
          <p className="text-muted">Loading shared progress...</p>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="p-8 text-center">
          <p className="text-sm text-danger">{error}</p>
        </Card>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="p-8 text-center">
          <p className="text-muted">No data available</p>
        </Card>
      </div>
    );
  }

  if (data.type === "report") {
    return <ReportDisplay data={data} />;
  }

  if (data.type === "business") {
    return <BusinessDisplay data={data} token={token} />;
  }

  return <ProgressDisplay data={data} />;
}
