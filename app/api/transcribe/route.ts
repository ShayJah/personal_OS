import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireUserId } from "@/lib/api/auth";
import { handleApiError } from "@/lib/api/response";
import { transcribeAudio } from "@/lib/transcription";

export async function POST(request: NextRequest) {
  try {
    await requireUserId();

    const form = await request.formData();
    const audio = form.get("audio");
    if (!(audio instanceof Blob)) {
      return NextResponse.json({ error: "Missing audio file" }, { status: 400 });
    }

    const text = await transcribeAudio(audio, "capture.webm");
    return NextResponse.json({ text });
  } catch (error) {
    return handleApiError(error);
  }
}
