import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireUserId } from "@/lib/api/auth";
import { handleApiError } from "@/lib/api/response";
import { createEventSchema } from "@/lib/validation/calendar-event";
import { createEvent, listEventsForRange, startOfWeek, addDays } from "@/lib/calendar";

export async function GET(request: NextRequest) {
  try {
    const userId = await requireUserId();
    const startParam = request.nextUrl.searchParams.get("start");
    const endParam = request.nextUrl.searchParams.get("end");

    const start = startParam ? new Date(startParam) : startOfWeek(new Date());
    const end = endParam ? new Date(endParam) : addDays(start, 7);

    const events = await listEventsForRange(userId, start, end);
    return NextResponse.json({ events });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await requireUserId();
    const body = createEventSchema.parse(await request.json());
    const event = await createEvent(userId, body);
    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
