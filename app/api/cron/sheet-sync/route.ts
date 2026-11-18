import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isCronRequest, settleInBatches } from "@/lib/api/cron";
import { prisma } from "@/lib/db";
import { syncBusinessSheet } from "@/lib/sheet-sync";

export const maxDuration = 300;

export async function GET(request: NextRequest) {
  if (!isCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const businesses = await prisma.business.findMany({
    where: { crmSheetId: { not: null } },
    select: { id: true, userId: true },
  });
  // Runs as each business's owner, using their Google token.
  return NextResponse.json(await settleInBatches(businesses, (b) => syncBusinessSheet(b.userId, b.id), 3));
}
