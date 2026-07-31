"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/dal";
import { generateReport } from "@/lib/reports";
import type { ReportType } from "@/lib/reports";

export async function generateReportAction(type: ReportType) {
  const session = await requireSession();
  await generateReport(session.user.id, type);
  revalidatePath("/reports");
}
