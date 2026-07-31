import "server-only";
import { prisma } from "@/lib/db";

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const SHEETS_BASE = "https://sheets.googleapis.com/v4/spreadsheets";

export class GoogleSheetsNotConnectedError extends Error {
  constructor() {
    super(
      "No Google connection found. Sign in with Google (or reconnect Google Calendar in Settings) to grant Sheets read access."
    );
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

type TokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope: string;
  token_type: string;
};

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

// Sign-in requests calendar + spreadsheets.readonly together, so the same
// token stored by the Calendar connection also authorizes Sheets reads —
// no separate connection/table needed. Users who signed in before the
// scope was added just need to sign in again once to pick it up.
async function getValidAccessToken(userId: string): Promise<string> {
  const connection = await prisma.googleCalendarConnection.findUnique({ where: { userId } });
  if (!connection) throw new GoogleSheetsNotConnectedError();

  const expiresSoon = connection.expiresAt.getTime() - Date.now() < 60_000;
  if (!expiresSoon) return connection.accessToken;

  const tokens = await refreshAccessToken(connection.refreshToken);
  await prisma.googleCalendarConnection.update({
    where: { userId },
    data: {
      accessToken: tokens.access_token,
      expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
    },
  });
  return tokens.access_token;
}

export async function isSheetsAccessAvailable(userId: string): Promise<boolean> {
  const connection = await prisma.googleCalendarConnection.findUnique({ where: { userId } });
  if (!connection) return false;
  return connection.scope.includes("spreadsheets.readonly");
}

/** Extracts the spreadsheet ID out of a full Google Sheets URL, or passes through if already just an ID. */
export function parseSpreadsheetId(urlOrId: string): string {
  const match = urlOrId.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : urlOrId.trim();
}

/** Fetches a tab's cell values as rows of strings — row[0] is expected to be the header row. */
export async function fetchSheetRows(
  userId: string,
  spreadsheetId: string,
  tabName: string
): Promise<string[][]> {
  const accessToken = await getValidAccessToken(userId);
  const range = encodeURIComponent(tabName);
  const res = await fetch(`${SHEETS_BASE}/${spreadsheetId}/values/${range}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new Error(`Failed to read Google Sheet: ${await res.text()}`);
  }
  const data = await res.json();
  return data.values ?? [];
}
