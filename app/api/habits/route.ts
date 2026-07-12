import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/api/auth";
import { handleApiError } from "@/lib/api/response";
import { createHabitSchema } from "@/lib/validation/habit";

export async function GET() {
  try {
    const userId = await requireUserId();
    const habits = await prisma.habit.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
      include: { logs: { orderBy: { date: "desc" }, take: 30 } },
    });
    return NextResponse.json({ habits });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await requireUserId();
    const body = createHabitSchema.parse(await request.json());
    const habit = await prisma.habit.create({ data: { ...body, userId } });
    return NextResponse.json({ habit }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
