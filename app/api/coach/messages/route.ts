import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireUserId } from "@/lib/api/auth";
import { handleApiError } from "@/lib/api/response";
import { sendCoachMessageSchema } from "@/lib/validation/coach";
import { listThreadMessages, sendCoachMessage } from "@/lib/coach";

export async function GET() {
  try {
    const userId = await requireUserId();
    const messages = await listThreadMessages(userId);
    return NextResponse.json({ messages });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await requireUserId();
    const { content } = sendCoachMessageSchema.parse(await request.json());
    const message = await sendCoachMessage(userId, content);
    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
