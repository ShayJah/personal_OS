import "server-only";
import { prisma } from "@/lib/db";
import {
  buildGoogleAuthUrl,
  exchangeCodeForTokens,
  isGoogleConfigured,
  validAccessToken,
  type TokenResponse,
} from "@/lib/google-oauth";

// gmail.compose only — lets us create drafts, never read the inbox or send mail directly.
const SCOPE = "https://www.googleapis.com/auth/gmail.compose";
const DRAFTS_URL = "https://gmail.googleapis.com/gmail/v1/users/me/drafts";

export class GmailNotConnectedError extends Error {
  constructor() {
    super("Gmail is not connected for this user.");
  }
}

export const isGmailConfigured = isGoogleConfigured;

export const buildAuthUrl = (redirectUri: string, state: string) => buildGoogleAuthUrl(SCOPE, redirectUri, state);
export { exchangeCodeForTokens };

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
  return validAccessToken(connection, (data) => prisma.gmailConnection.update({ where: { userId }, data }));
}

function base64UrlEncode(input: string): string {
  return Buffer.from(input, "utf-8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

// Header values come from the AI and imported sheets: a line break would inject extra headers (e.g. Bcc).
const singleLine = (value: string) => value.replace(/[\r\n]+/g, " ").trim();

// Non-ASCII subjects must be RFC 2047 encoded or they arrive garbled.
const encodeSubject = (subject: string) =>
  /^[\x20-\x7e]*$/.test(subject) ? subject : `=?UTF-8?B?${Buffer.from(subject, "utf-8").toString("base64")}?=`;

export function toRfc2822(input: { to: string; subject: string; body: string }): string {
  const headers = [
    `To: ${singleLine(input.to)}`,
    `Subject: ${encodeSubject(singleLine(input.subject))}`,
    "Content-Type: text/plain; charset=UTF-8",
  ];
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
