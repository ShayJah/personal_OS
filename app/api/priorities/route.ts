import { NextResponse } from "next/server";
import { userToday } from "@/lib/user/preferences";
import type { NextRequest } from "next/server";
import { requireUserId } from "@/lib/api/auth";
import { handleApiError } from "@/lib/api/response";
import { setPrioritiesSchema } from "@/lib/validation/priority";
import { getPrioritiesForDate, setPrioritiesForDate } from "@/lib/priorities";
import { toDateOnly } from "@/lib/date";

export async function GET(request: NextRequest) {
  try {
    const userId = await requireUserId();
    const dateParam = request.nextUrl.searchParams.get("date");
    const date = dateParam ? toDateOnly(new Date(dateParam)) : await userToday(userId);

    const priorities = await getPrioritiesForDate(userId, date);
    return NextResponse.json({ priorities });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userId = await requireUserId();
    const { items } = setPrioritiesSchema.parse(await request.json());
    const date = await userToday(userId);

    const priorities = await setPrioritiesForDate(userId, date, items);
    return NextResponse.json({ priorities });
  } catch (error) {
    return handleApiError(error);
  }
}
