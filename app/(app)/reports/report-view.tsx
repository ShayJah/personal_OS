"use client";

import ReactMarkdown from "react-markdown";
import { Card } from "@/components/ui/card";

export type ReportData = {
  id: string;
  type: string;
  periodStart: Date | string;
  periodEnd: Date | string;
  content: string;
};

function formatRange(start: Date | string, end: Date | string) {
  const s = new Date(start);
  const e = new Date(end);
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  return s.toDateString() === e.toDateString()
    ? s.toLocaleDateString(undefined, opts)
    : `${s.toLocaleDateString(undefined, opts)} – ${e.toLocaleDateString(undefined, opts)}`;
}

export function ReportView({ report }: { report: ReportData }) {
  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <span className="rounded bg-foreground/5 px-2 py-0.5 text-xs font-medium capitalize text-foreground/60">
          {report.type}
        </span>
        <span className="text-xs text-foreground/40">
          {formatRange(report.periodStart, report.periodEnd)}
        </span>
      </div>
      <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:font-medium prose-p:my-1.5 prose-ul:my-1.5">
        <ReactMarkdown>{report.content}</ReactMarkdown>
      </div>
    </Card>
  );
}
