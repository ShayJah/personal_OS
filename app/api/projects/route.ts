import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireUserId } from "@/lib/api/auth";
import { handleApiError } from "@/lib/api/response";
import { createProjectSchema } from "@/lib/validation/project";
import { createProject, listProjectsWithProgress } from "@/lib/projects";

export async function GET() {
  try {
    const userId = await requireUserId();
    const projects = await listProjectsWithProgress(userId);
    return NextResponse.json({ projects });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await requireUserId();
    const body = createProjectSchema.parse(await request.json());
    const project = await createProject(userId, body);
    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
