import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireUserId } from "@/lib/api/auth";
import { exchangeCodeForTokens, saveConnection } from "@/lib/google-calendar";

export async function GET(request: NextRequest) {
  const settingsUrl = new URL("/settings", request.nextUrl.origin);

  try {
    const userId = await requireUserId();

    const error = request.nextUrl.searchParams.get("error");
    if (error) {
      settingsUrl.searchParams.set("google_calendar_error", error);
      return NextResponse.redirect(settingsUrl);
    }

    const code = request.nextUrl.searchParams.get("code");
    const state = request.nextUrl.searchParams.get("state");
    const expectedState = request.cookies.get("gcal_oauth_state")?.value;

    if (!code || !state || !expectedState || state !== expectedState) {
      settingsUrl.searchParams.set("google_calendar_error", "invalid_state");
      return NextResponse.redirect(settingsUrl);
    }

    const redirectUri = `${request.nextUrl.origin}/api/integrations/google-calendar/callback`;
    const tokens = await exchangeCodeForTokens(code, redirectUri);
    await saveConnection(userId, tokens);

    settingsUrl.searchParams.set("google_calendar_connected", "1");
    const response = NextResponse.redirect(settingsUrl);
    response.cookies.delete("gcal_oauth_state");
    return response;
  } catch (error) {
    console.error("Google Calendar connect failed:", error);
    settingsUrl.searchParams.set("google_calendar_error", "connect_failed");
    return NextResponse.redirect(settingsUrl);
  }
}
