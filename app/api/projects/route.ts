import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/api/auth";
import { handleApiError } from "@/lib/api/response";
import { createProjectSchema } from "@/lib/validation/project";

export async function GET() {
  try {
    const userId = await requireUserId();
    const projects = await prisma.project.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ projects });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await requireUserId();
    const body = createProjectSchema.parse(await request.json());
    const project = await prisma.project.create({
      data: { ...body, userId },
    });
    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
