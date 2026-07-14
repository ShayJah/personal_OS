import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

export type PDFExportFormat = "portrait" | "landscape";

/**
 * Export HTML element to PDF
 */
export async function exportElementToPdf(
  elementId: string,
  filename: string,
  format: PDFExportFormat = "portrait"
) {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Element with id "${elementId}" not found`);
  }

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
    });

    const imgWidth = format === "portrait" ? 210 : 297; // A4 dimensions in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    const pageHeight = format === "portrait" ? 297 : 210;

    const pdf = new jsPDF({
      orientation: format,
      unit: "mm",
      format: "A4",
    });

    let heightLeft = imgHeight;
    let position = 0;

    const imgData = canvas.toDataURL("image/png");

    while (heightLeft >= 0) {
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      position -= pageHeight;
      if (heightLeft > 0) {
        pdf.addPage();
      }
    }

    pdf.save(filename);
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw new Error("Failed to generate PDF");
  }
}

/**
 * Export report data as PDF with styling
 */
export function exportReportToPdf(
  reportTitle: string,
  reportContent: string,
  metadata?: {
    date?: string;
    period?: string;
    author?: string;
  }
) {
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "A4",
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  const textWidth = pageWidth - 2 * margin;

  let yPosition = margin;

  // Header
  pdf.setFontSize(24);
  pdf.text(reportTitle, margin, yPosition);
  yPosition += 15;

  // Metadata
  if (metadata) {
    pdf.setFontSize(10);
    pdf.setTextColor(128, 128, 128);
    if (metadata.period) {
      pdf.text(`Period: ${metadata.period}`, margin, yPosition);
      yPosition += 6;
    }
    if (metadata.date) {
      pdf.text(`Generated: ${metadata.date}`, margin, yPosition);
      yPosition += 6;
    }
    if (metadata.author) {
      pdf.text(`Author: ${metadata.author}`, margin, yPosition);
      yPosition += 6;
    }
    yPosition += 5;
  }

  // Content
  pdf.setFontSize(12);
  pdf.setTextColor(0, 0, 0);

  const lines = pdf.splitTextToSize(reportContent, textWidth);
  lines.forEach((line: string) => {
    if (yPosition > pageHeight - margin) {
      pdf.addPage();
      yPosition = margin;
    }
    pdf.text(line, margin, yPosition);
    yPosition += 7;
  });

  return pdf;
}
