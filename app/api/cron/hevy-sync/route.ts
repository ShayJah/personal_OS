import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { syncAllHevyConnections } from "@/lib/hevy";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await syncAllHevyConnections();
  return NextResponse.json(result);
}
