import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/api/auth";
import { handleApiError, NotFoundError } from "@/lib/api/response";
import { updateHabitSchema } from "@/lib/validation/habit";

type Params = { params: Promise<{ id: string }> };

async function getOwnedHabit(userId: string, id: string) {
  const habit = await prisma.habit.findFirst({ where: { id, userId } });
  if (!habit) throw new NotFoundError();
  return habit;
}

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const userId = await requireUserId();
    const { id } = await params;
    await getOwnedHabit(userId, id);
    const habit = await prisma.habit.findUnique({
      where: { id },
      include: { logs: { orderBy: { date: "desc" }, take: 90 } },
    });
    return NextResponse.json({ habit });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const userId = await requireUserId();
    const { id } = await params;
    await getOwnedHabit(userId, id);
    const body = updateHabitSchema.parse(await request.json());
    const habit = await prisma.habit.update({ where: { id }, data: body });
    return NextResponse.json({ habit });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const userId = await requireUserId();
    const { id } = await params;
    await getOwnedHabit(userId, id);
    await prisma.habit.delete({ where: { id } });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handleApiError(error);
  }
}
