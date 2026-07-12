import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/api/auth";
import { handleApiError, NotFoundError } from "@/lib/api/response";
import { updateProjectSchema } from "@/lib/validation/project";

type Params = { params: Promise<{ id: string }> };

async function getOwnedProject(userId: string, id: string) {
  const project = await prisma.project.findFirst({ where: { id, userId } });
  if (!project) throw new NotFoundError();
  return project;
}

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const userId = await requireUserId();
    const { id } = await params;
    const project = await getOwnedProject(userId, id);
    return NextResponse.json({ project });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const userId = await requireUserId();
    const { id } = await params;
    await getOwnedProject(userId, id);
    const body = updateProjectSchema.parse(await request.json());
    const project = await prisma.project.update({ where: { id }, data: body });
    return NextResponse.json({ project });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const userId = await requireUserId();
    const { id } = await params;
    await getOwnedProject(userId, id);
    await prisma.project.delete({ where: { id } });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handleApiError(error);
  }
}
