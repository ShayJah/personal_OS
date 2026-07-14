import crypto from "crypto";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireUserId } from "@/lib/api/auth";
import { handleApiError } from "@/lib/api/response";
import { buildAuthUrl, isGoogleCalendarConfigured } from "@/lib/google-calendar";

export async function GET(request: NextRequest) {
  try {
    await requireUserId();

    if (!isGoogleCalendarConfigured()) {
      return NextResponse.json(
        { error: "Google Calendar is not configured on this server." },
        { status: 503 }
      );
    }

    const state = crypto.randomBytes(24).toString("hex");
    const redirectUri = `${request.nextUrl.origin}/api/integrations/google-calendar/callback`;
    const authUrl = buildAuthUrl(redirectUri, state);

    const response = NextResponse.redirect(authUrl);
    response.cookies.set("gcal_oauth_state", state, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 600,
      path: "/",
    });
    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
