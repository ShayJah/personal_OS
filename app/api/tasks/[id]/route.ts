import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/api/auth";
import { handleApiError, NotFoundError } from "@/lib/api/response";
import { updateTaskSchema } from "@/lib/validation/task";

type Params = { params: Promise<{ id: string }> };

async function getOwnedTask(userId: string, id: string) {
  const task = await prisma.task.findFirst({ where: { id, userId } });
  if (!task) throw new NotFoundError();
  return task;
}

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const userId = await requireUserId();
    const { id } = await params;
    const task = await getOwnedTask(userId, id);
    return NextResponse.json({ task });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const userId = await requireUserId();
    const { id } = await params;
    await getOwnedTask(userId, id);
    const body = updateTaskSchema.parse(await request.json());

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

    const task = await prisma.task.update({ where: { id }, data: body });
    return NextResponse.json({ task });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const userId = await requireUserId();
    const { id } = await params;
    await getOwnedTask(userId, id);
    await prisma.task.delete({ where: { id } });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handleApiError(error);
  }
}
