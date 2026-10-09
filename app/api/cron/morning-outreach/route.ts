import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isCronRequest } from "@/lib/api/cron";
import { runMorningOutreachForAllUsers } from "@/lib/agents/morning-outreach";

export const maxDuration = 300;

export async function GET(request: NextRequest) {
  if (!isCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runMorningOutreachForAllUsers();
  return NextResponse.json(result);
}
