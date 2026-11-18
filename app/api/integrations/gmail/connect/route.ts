import crypto from "crypto";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireUserId } from "@/lib/api/auth";
import { handleApiError } from "@/lib/api/response";
import { buildAuthUrl, isGmailConfigured } from "@/lib/gmail";

export async function GET(request: NextRequest) {
  try {
    await requireUserId();

    if (!isGmailConfigured()) {
      return NextResponse.json(
        { error: "Gmail is not configured on this server." },
        { status: 503 }
      );
    }

    const state = crypto.randomBytes(24).toString("hex");
    const redirectUri = `${request.nextUrl.origin}/api/integrations/gmail/callback`;
    const authUrl = buildAuthUrl(redirectUri, state);

    const response = NextResponse.redirect(authUrl);
    response.cookies.set("gmail_oauth_state", state, {
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
