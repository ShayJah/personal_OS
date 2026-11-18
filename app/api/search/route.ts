import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireUserId } from "@/lib/api/auth";
import { handleApiError } from "@/lib/api/response";
import { searchQuerySchema } from "@/lib/validation/search";
import { searchAll } from "@/lib/search";

export async function GET(request: NextRequest) {
  try {
    const userId = await requireUserId();
    const { q } = searchQuerySchema.parse({
      q: request.nextUrl.searchParams.get("q") ?? "",
    });

    const results = await searchAll(userId, q);
    return NextResponse.json({ results });
  } catch (error) {
    return handleApiError(error);
  }
}
