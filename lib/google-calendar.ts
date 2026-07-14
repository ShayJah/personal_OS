import "server-only";
import { prisma } from "@/lib/db";

const SCOPE = "https://www.googleapis.com/auth/calendar";
const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const EVENTS_BASE = "https://www.googleapis.com/calendar/v3/calendars";

export class GoogleCalendarNotConnectedError extends Error {
  constructor() {
    super("Google Calendar is not connected for this user.");
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

export function isGoogleCalendarConfigured(): boolean {
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
    const existing = await prisma.googleCalendarConnection.findUnique({
      where: { userId },
    });
    if (!existing) {
      throw new Error(
        "Google did not return a refresh token. Revoke access at https://myaccount.google.com/permissions and reconnect."
      );
    }
    return prisma.googleCalendarConnection.update({
      where: { userId },
      data: {
        accessToken: tokens.access_token,
        expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
        scope: tokens.scope,
      },
    });
  }

  return prisma.googleCalendarConnection.upsert({
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
  const connection = await prisma.googleCalendarConnection.findUnique({
    where: { userId },
  });
  return Boolean(connection);
}

export async function disconnect(userId: string) {
  await prisma.googleCalendarConnection.deleteMany({ where: { userId } });
}

async function getValidAccessToken(userId: string): Promise<{
  accessToken: string;
  calendarId: string;
}> {
  const connection = await prisma.googleCalendarConnection.findUnique({
    where: { userId },
  });
  if (!connection) throw new GoogleCalendarNotConnectedError();

  const expiresSoon = connection.expiresAt.getTime() - Date.now() < 60_000;
  if (!expiresSoon) {
    return { accessToken: connection.accessToken, calendarId: connection.calendarId };
  }

  const tokens = await refreshAccessToken(connection.refreshToken);
  await prisma.googleCalendarConnection.update({
    where: { userId },
    data: {
      accessToken: tokens.access_token,
      expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
    },
  });
  return { accessToken: tokens.access_token, calendarId: connection.calendarId };
}

export type GoogleEventInput = {
  title: string;
  description?: string | null;
  location?: string | null;
  startAt: Date;
  endAt: Date;
};

export type GoogleEvent = {
  id: string;
  summary?: string;
  description?: string;
  location?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  status?: string;
};

function toGoogleBody(input: GoogleEventInput) {
  return {
    summary: input.title,
    description: input.description ?? undefined,
    location: input.location ?? undefined,
    start: { dateTime: input.startAt.toISOString() },
    end: { dateTime: input.endAt.toISOString() },
  };
}

async function googleFetch(
  userId: string,
  path: string,
  init?: RequestInit
): Promise<Response> {
  const { accessToken, calendarId } = await getValidAccessToken(userId);
  const url = `${EVENTS_BASE}/${encodeURIComponent(calendarId)}${path}`;
  return fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
}

export async function listGoogleEvents(
  userId: string,
  timeMin: Date,
  timeMax: Date
): Promise<GoogleEvent[]> {
  const params = new URLSearchParams({
    timeMin: timeMin.toISOString(),
    timeMax: timeMax.toISOString(),
    singleEvents: "true",
    orderBy: "startTime",
    maxResults: "250",
  });
  const res = await googleFetch(userId, `/events?${params.toString()}`);
  if (!res.ok) throw new Error(`Failed to list Google events: ${await res.text()}`);
  const data = await res.json();
  return data.items ?? [];
}

export async function createGoogleEvent(
  userId: string,
  input: GoogleEventInput
): Promise<GoogleEvent> {
  const res = await googleFetch(userId, "/events", {
    method: "POST",
    body: JSON.stringify(toGoogleBody(input)),
  });
  if (!res.ok) throw new Error(`Failed to create Google event: ${await res.text()}`);
  return res.json();
}

export async function updateGoogleEvent(
  userId: string,
  googleEventId: string,
  input: GoogleEventInput
): Promise<GoogleEvent> {
  const res = await googleFetch(userId, `/events/${encodeURIComponent(googleEventId)}`, {
    method: "PATCH",
    body: JSON.stringify(toGoogleBody(input)),
  });
  if (!res.ok) throw new Error(`Failed to update Google event: ${await res.text()}`);
  return res.json();
}

export async function deleteGoogleEvent(
  userId: string,
  googleEventId: string
): Promise<void> {
  const res = await googleFetch(userId, `/events/${encodeURIComponent(googleEventId)}`, {
    method: "DELETE",
  });
  // Google returns 410 Gone if the event was already deleted on their side — treat as success.
  if (!res.ok && res.status !== 410 && res.status !== 404) {
    throw new Error(`Failed to delete Google event: ${await res.text()}`);
  }
}
