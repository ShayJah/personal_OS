import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireUserId } from "@/lib/api/auth";
import { handleApiError } from "@/lib/api/response";
import { createTaskSchema } from "@/lib/validation/task";
import { createTask, listTasks, type TaskFilter } from "@/lib/tasks";

const VALID_FILTERS: TaskFilter[] = ["today", "upcoming", "completed", "all"];

export async function GET(request: NextRequest) {
  try {
    const userId = await requireUserId();
    const filterParam = request.nextUrl.searchParams.get("filter");
    const filter = VALID_FILTERS.includes(filterParam as TaskFilter)
      ? (filterParam as TaskFilter)
      : "all";

    const tasks = await listTasks(userId, filter);
    return NextResponse.json({ tasks });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await requireUserId();
    const body = createTaskSchema.parse(await request.json());
    const task = await createTask(userId, body);
    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
