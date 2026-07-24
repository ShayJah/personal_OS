import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { runMorningOutreachForAllUsers } from "@/lib/agents/morning-outreach";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runMorningOutreachForAllUsers();
  return NextResponse.json(result);
}
