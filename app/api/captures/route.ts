import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireUserId } from "@/lib/api/auth";
import { handleApiError } from "@/lib/api/response";
import { createCaptureSchema } from "@/lib/validation/capture";
import { createCapture, listCaptures } from "@/lib/captures";

export async function GET() {
  try {
    const userId = await requireUserId();
    const captures = await listCaptures(userId);
    return NextResponse.json({ captures });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await requireUserId();
    const body = createCaptureSchema.parse(await request.json());
    const capture = await createCapture(userId, body);
    return NextResponse.json({ capture }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
