import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireUserId } from "@/lib/api/auth";
import { handleApiError } from "@/lib/api/response";
import { generateReportSchema } from "@/lib/validation/report";
import { generateReport, listReports } from "@/lib/reports";

export async function GET() {
  try {
    const userId = await requireUserId();
    const reports = await listReports(userId);
    return NextResponse.json({ reports });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await requireUserId();
    const { type, referenceDate } = generateReportSchema.parse(
      await request.json()
    );
    const report = await generateReport(userId, type, referenceDate);
    return NextResponse.json({ report }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
