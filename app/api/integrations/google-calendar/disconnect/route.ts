import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/api/auth";
import { handleApiError } from "@/lib/api/response";
import { disconnect } from "@/lib/google-calendar";

export async function POST() {
  try {
    const userId = await requireUserId();
    await disconnect(userId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
