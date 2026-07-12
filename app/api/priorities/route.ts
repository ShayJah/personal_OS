import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/api/auth";
import { handleApiError } from "@/lib/api/response";
import { setPrioritiesSchema } from "@/lib/validation/priority";

function todayDateOnly() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

export async function GET(request: NextRequest) {
  try {
    const userId = await requireUserId();
    const dateParam = request.nextUrl.searchParams.get("date");
    const date = dateParam ? new Date(dateParam) : todayDateOnly();

    const priorities = await prisma.priority.findMany({
      where: { userId, date },
      orderBy: { order: "asc" },
    });
    return NextResponse.json({ priorities });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userId = await requireUserId();
    const { items } = setPrioritiesSchema.parse(await request.json());
    const date = todayDateOnly();

    const priorities = await prisma.$transaction(async (tx) => {
      await tx.priority.deleteMany({ where: { userId, date } });
      if (items.length === 0) return [];
      await tx.priority.createMany({
        data: items.map((content, index) => ({
          userId,
          date,
          content,
          order: index,
        })),
      });
      return tx.priority.findMany({
        where: { userId, date },
        orderBy: { order: "asc" },
      });
    });

    return NextResponse.json({ priorities });
  } catch (error) {
    return handleApiError(error);
  }
}
