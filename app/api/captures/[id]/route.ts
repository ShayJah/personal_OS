import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireUserId } from "@/lib/api/auth";
import { handleApiError } from "@/lib/api/response";
import { classifyCaptureSchema } from "@/lib/validation/capture";
import { classifyCapture, deleteCapture, getOwnedCapture } from "@/lib/captures";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const userId = await requireUserId();
    const { id } = await params;
    const capture = await getOwnedCapture(userId, id);
    return NextResponse.json({ capture });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const userId = await requireUserId();
    const { id } = await params;
    const { classified } = classifyCaptureSchema.parse(await request.json());
    const capture = await classifyCapture(userId, id, classified);
    return NextResponse.json({ capture });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const userId = await requireUserId();
    const { id } = await params;
    await deleteCapture(userId, id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handleApiError(error);
  }
}
