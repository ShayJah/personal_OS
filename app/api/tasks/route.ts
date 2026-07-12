import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/api/auth";
import { handleApiError } from "@/lib/api/response";
import { createTaskSchema } from "@/lib/validation/task";

export async function GET(request: NextRequest) {
  try {
    const userId = await requireUserId();
    const projectId = request.nextUrl.searchParams.get("projectId");
    const completedParam = request.nextUrl.searchParams.get("completed");

    const tasks = await prisma.task.findMany({
      where: {
        userId,
        ...(projectId && { projectId }),
        ...(completedParam !== null && {
          completed: completedParam === "true",
        }),
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ tasks });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await requireUserId();
    const body = createTaskSchema.parse(await request.json());

    if (body.projectId) {
      const owned = await prisma.project.findFirst({
        where: { id: body.projectId, userId },
      });
      if (!owned) {
        return NextResponse.json(
          { error: "Invalid projectId" },
          { status: 400 }
        );
      }
    }

    const task = await prisma.task.create({ data: { ...body, userId } });
    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
