import { NextResponse } from "next/server";

// Step 1 of the Decap CMS GitHub login: send the popup to GitHub.
export function GET(request: Request) {
  const { origin } = new URL(request.url);
  const state = crypto.randomUUID();
  const url = new URL("https://github.com/login/oauth/authorize");
  url.searchParams.set("client_id", process.env.GITHUB_CLIENT_ID ?? "");
  url.searchParams.set("redirect_uri", `${origin}/api/decap/callback`);
  url.searchParams.set("scope", "repo");
  url.searchParams.set("state", state);

  const res = NextResponse.redirect(url);
  res.cookies.set("decap_state", state, {
    httpOnly: true,
    secure: origin.startsWith("https"),
    sameSite: "lax",
    maxAge: 600,
    path: "/api/decap",
  });
  return res;
}
