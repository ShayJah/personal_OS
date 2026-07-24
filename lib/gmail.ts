import "server-only";
import { prisma } from "@/lib/db";

// gmail.compose only — lets us create drafts, never read the inbox or send mail directly.
const SCOPE = "https://www.googleapis.com/auth/gmail.compose";
const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const DRAFTS_URL = "https://gmail.googleapis.com/gmail/v1/users/me/drafts";

export class GmailNotConnectedError extends Error {
  constructor() {
    super("Gmail is not connected for this user.");
  }
}

function requireClientCredentials() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET are not set.");
  }
  return { clientId, clientSecret };
}

export function isGmailConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export function buildAuthUrl(redirectUri: string, state: string): string {
  const { clientId } = requireClientCredentials();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: SCOPE,
    access_type: "offline",
    prompt: "consent",
    state,
  });
  return `${AUTH_URL}?${params.toString()}`;
}

type TokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope: string;
  token_type: string;
};

export async function exchangeCodeForTokens(
  code: string,
  redirectUri: string
): Promise<TokenResponse> {
  const { clientId, clientSecret } = requireClientCredentials();
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) {
    throw new Error(`Google token exchange failed: ${await res.text()}`);
  }
  return res.json();
}

async function refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
  const { clientId, clientSecret } = requireClientCredentials();
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) {
    throw new Error(`Google token refresh failed: ${await res.text()}`);
  }
  return res.json();
}

export async function saveConnection(userId: string, tokens: TokenResponse) {
  if (!tokens.refresh_token) {
    // Google only returns a refresh_token on the first consent; if the user
    // re-connects without revoking access first, reuse the one on file.
    const existing = await prisma.gmailConnection.findUnique({ where: { userId } });
    if (!existing) {
      throw new Error(
        "Google did not return a refresh token. Revoke access at https://myaccount.google.com/permissions and reconnect."
      );
    }
    return prisma.gmailConnection.update({
      where: { userId },
      data: {
        accessToken: tokens.access_token,
        expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
        scope: tokens.scope,
      },
    });
  }

  return prisma.gmailConnection.upsert({
    where: { userId },
    create: {
      userId,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
      scope: tokens.scope,
    },
    update: {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
      scope: tokens.scope,
    },
  });
}

export async function isConnected(userId: string): Promise<boolean> {
  const connection = await prisma.gmailConnection.findUnique({ where: { userId } });
  return Boolean(connection);
}

export async function disconnect(userId: string) {
  await prisma.gmailConnection.deleteMany({ where: { userId } });
}

async function getValidAccessToken(userId: string): Promise<string> {
  const connection = await prisma.gmailConnection.findUnique({ where: { userId } });
  if (!connection) throw new GmailNotConnectedError();

  const expiresSoon = connection.expiresAt.getTime() - Date.now() < 60_000;
  if (!expiresSoon) return connection.accessToken;

  const tokens = await refreshAccessToken(connection.refreshToken);
  await prisma.gmailConnection.update({
    where: { userId },
    data: {
      accessToken: tokens.access_token,
      expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
    },
  });
  return tokens.access_token;
}

function base64UrlEncode(input: string): string {
  return Buffer.from(input, "utf-8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function toRfc2822(input: { to: string; subject: string; body: string }): string {
  const headers = [`To: ${input.to}`, `Subject: ${input.subject}`, "Content-Type: text/plain; charset=UTF-8"];
  return `${headers.join("\r\n")}\r\n\r\n${input.body}`;
}

export type GmailDraft = { id: string; message: { id: string } };

export async function createGmailDraft(
  userId: string,
  input: { to: string; subject: string; body: string }
): Promise<GmailDraft> {
  const accessToken = await getValidAccessToken(userId);
  const raw = base64UrlEncode(toRfc2822(input));

  const res = await fetch(DRAFTS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message: { raw } }),
  });
  if (!res.ok) {
    throw new Error(`Failed to create Gmail draft: ${await res.text()}`);
  }
  return res.json();
}
