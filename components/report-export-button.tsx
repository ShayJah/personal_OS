"use client";

import { useState } from "react";
import { exportReportToPdf } from "@/lib/pdf-export";
import { Button } from "@/components/ui/button";

interface ReportExportProps {
  reportId: string;
  reportTitle: string;
  reportContent: string;
  reportType: string;
  periodStart: Date | string;
  periodEnd: Date | string;
}

export function ReportExportButton({
  reportId,
  reportTitle,
  reportContent,
  reportType,
  periodStart,
  periodEnd,
}: ReportExportProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExportPdf = () => {
    try {
      setIsExporting(true);

      const formatDate = (date: Date | string) => {
        const d = new Date(date);
        return d.toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        });
      };

      const period =
        formatDate(periodStart) === formatDate(periodEnd)
          ? formatDate(periodStart)
          : `${formatDate(periodStart)} – ${formatDate(periodEnd)}`;

      const pdf = exportReportToPdf(reportTitle, reportContent, {
        period,
        date: new Date().toLocaleDateString(),
        author: "PersonalOS",
      });

      pdf.save(`${reportType}-report-${reportId}.pdf`);
    } catch (error) {
      console.error("Failed to export PDF:", error);
      alert("Failed to export report as PDF");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      onClick={handleExportPdf}
      disabled={isExporting}
      variant="outline"
      size="sm"
      className="text-xs"
    >
      {isExporting ? "Exporting..." : "Export PDF"}
    </Button>
  );
}
