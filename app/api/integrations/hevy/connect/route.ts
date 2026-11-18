import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { requireUserId } from "@/lib/api/auth";
import { handleApiError } from "@/lib/api/response";
import { saveApiKey } from "@/lib/hevy";

const connectSchema = z.object({
  apiKey: z.string().trim().min(1).max(200),
});

export async function POST(request: NextRequest) {
  try {
    const userId = await requireUserId();
    const { apiKey } = connectSchema.parse(await request.json());
    await saveApiKey(userId, apiKey);
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
