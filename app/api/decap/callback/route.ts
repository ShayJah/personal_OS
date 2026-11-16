import { cookies } from "next/headers";

// Step 2: swap the GitHub code for a token and hand it to the Decap popup opener.
function page(status: "success" | "error", payload: object) {
  const msg = `authorization:github:${status}:${JSON.stringify(payload)}`;
  const html = `<!doctype html><script>
(function () {
  var msg = ${JSON.stringify(msg)};
  window.addEventListener("message", function (e) {
    // Only the CMS on this site may receive the token, never another site that opened this popup.
    if (e.origin !== location.origin) return;
    window.opener.postMessage(msg, e.origin);
    window.close();
  });
  window.opener.postMessage("authorizing:github", "*");
})();
</script>`;
  return new Response(html, { headers: { "Content-Type": "text/html" } });
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const code = params.get("code");
  const state = params.get("state");
  const saved = (await cookies()).get("decap_state")?.value;

  if (!code || !state || state !== saved) {
    return page("error", { message: "Invalid OAuth state" });
  }

  const res = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
    }),
  });
  const data = await res.json();
  if (!data.access_token) {
    return page("error", { message: data.error_description ?? "Token exchange failed" });
  }

  // Allow-list: only the listed GitHub logins may get a token. Unset list = nobody (fail closed).
  const allowed = (process.env.DECAP_ALLOWED_GITHUB_LOGINS ?? "")
    .split(",")
    .map((l) => l.trim().toLowerCase())
    .filter(Boolean);
  const me = await fetch("https://api.github.com/user", {
    headers: { Authorization: `Bearer ${data.access_token}`, Accept: "application/vnd.github+json" },
  });
  const login = me.ok ? ((await me.json()).login as string | undefined)?.toLowerCase() : undefined;
  if (!login || !allowed.includes(login)) {
    return page("error", { message: "This GitHub account is not allowed to use the CMS" });
  }
  return page("success", { token: data.access_token, provider: "github" });
}
