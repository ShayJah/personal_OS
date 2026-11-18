import "server-only";

const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";

export type TokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope: string;
  token_type: string;
};

export function requireClientCredentials() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET are not set.");
  }
  return { clientId, clientSecret };
}

export function isGoogleConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export function buildGoogleAuthUrl(scope: string, redirectUri: string, state: string): string {
  const { clientId } = requireClientCredentials();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope,
    access_type: "offline",
    prompt: "consent",
    state,
  });
  return `${AUTH_URL}?${params.toString()}`;
}

async function postToken(body: Record<string, string>, failure: string): Promise<TokenResponse> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(body),
  });
  if (!res.ok) throw new Error(`${failure}: ${await res.text()}`);
  return res.json();
}

export function exchangeCodeForTokens(code: string, redirectUri: string) {
  const { clientId, clientSecret } = requireClientCredentials();
  return postToken(
    { code, client_id: clientId, client_secret: clientSecret, redirect_uri: redirectUri, grant_type: "authorization_code" },
    "Google token exchange failed"
  );
}

export function refreshAccessToken(refreshToken: string) {
  const { clientId, clientSecret } = requireClientCredentials();
  return postToken(
    { refresh_token: refreshToken, client_id: clientId, client_secret: clientSecret, grant_type: "refresh_token" },
    "Google token refresh failed"
  );
}

/** Returns a usable access token, refreshing (and persisting via `save`) when it expires within a minute. */
export async function validAccessToken(
  connection: { accessToken: string; refreshToken: string; expiresAt: Date },
  save: (update: { accessToken: string; expiresAt: Date }) => Promise<unknown>
): Promise<string> {
  if (connection.expiresAt.getTime() - Date.now() >= 60_000) return connection.accessToken;

  const tokens = await refreshAccessToken(connection.refreshToken);
  await save({ accessToken: tokens.access_token, expiresAt: new Date(Date.now() + tokens.expires_in * 1000) });
  return tokens.access_token;
}
