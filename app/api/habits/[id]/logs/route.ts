import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/api/auth";
import { handleApiError, NotFoundError } from "@/lib/api/response";
import { logHabitSchema } from "@/lib/validation/habit";
import { toDateOnly } from "@/lib/date";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const userId = await requireUserId();
    const { id } = await params;

    const habit = await prisma.habit.findFirst({ where: { id, userId } });
    if (!habit) throw new NotFoundError();

    const body = logHabitSchema.parse(await request.json());
    const date = toDateOnly(body.date);

    const log = await prisma.habitLog.upsert({
      where: { habitId_date: { habitId: id, date } },
      update: { completed: body.completed },
      create: { habitId: id, userId, date, completed: body.completed },
    });

    return NextResponse.json({ log }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
