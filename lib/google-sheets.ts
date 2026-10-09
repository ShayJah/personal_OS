import "server-only";
import { prisma } from "@/lib/db";
import { validAccessToken } from "@/lib/google-oauth";

const SHEETS_BASE = "https://sheets.googleapis.com/v4/spreadsheets";
const SHEETS_SCOPE = "https://www.googleapis.com/auth/spreadsheets";

export class GoogleSheetsNotConnectedError extends Error {
  constructor() {
    super(
      "No Google connection with Sheets access found. Sign out and sign in with Google again to grant Sheets read/write access."
    );
  }
}

// Sign-in requests calendar + spreadsheets together, so the token stored by the
// Calendar connection also authorizes Sheets — no separate connection needed.
async function getValidAccessToken(userId: string): Promise<string> {
  const connection = await prisma.googleCalendarConnection.findUnique({ where: { userId } });
  if (!connection) throw new GoogleSheetsNotConnectedError();
  return validAccessToken(connection, (data) =>
    prisma.googleCalendarConnection.update({ where: { userId }, data })
  );
}

/** Write access needs the full spreadsheets scope; users who signed in earlier only have read-only. */
export async function isSheetsAccessAvailable(userId: string): Promise<boolean> {
  const connection = await prisma.googleCalendarConnection.findUnique({ where: { userId } });
  return Boolean(connection?.scope.split(" ").includes(SHEETS_SCOPE));
}

/** Extracts the spreadsheet ID out of a full Google Sheets URL, or passes through if already just an ID. */
export function parseSpreadsheetId(urlOrId: string): string {
  const match = urlOrId.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  const id = match ? match[1] : urlOrId.trim();
  if (!/^[a-zA-Z0-9-_]+$/.test(id)) throw new Error("That doesn't look like a Google Sheet link or ID.");
  return id;
}

export const sheetUrl = (spreadsheetId: string) => `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;

async function sheetsFetch(userId: string, path: string, init?: RequestInit, failure = "Google Sheets request failed") {
  const accessToken = await getValidAccessToken(userId);
  const res = await fetch(`${SHEETS_BASE}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json", ...init?.headers },
  });
  if (!res.ok) throw new Error(`${failure}: ${await res.text()}`);
  return res.json();
}

/** Fetches a tab's cell values as rows of strings — row[0] is expected to be the header row. */
export async function fetchSheetRows(userId: string, spreadsheetId: string, tabName: string): Promise<string[][]> {
  const data = await sheetsFetch(
    userId,
    `/${spreadsheetId}/values/${encodeURIComponent(tabName)}`,
    undefined,
    "Failed to read Google Sheet"
  );
  return data.values ?? [];
}

/** Replaces a tab's contents with `rows` (clears first so shrinking data leaves no stale cells). */
export async function writeSheetRows(userId: string, spreadsheetId: string, tabName: string, rows: string[][]) {
  const range = encodeURIComponent(tabName);
  await sheetsFetch(userId, `/${spreadsheetId}/values/${range}:clear`, { method: "POST", body: "{}" }, "Failed to clear Sheet");
  await sheetsFetch(
    userId,
    `/${spreadsheetId}/values/${range}?valueInputOption=RAW`,
    { method: "PUT", body: JSON.stringify({ values: rows }) },
    "Failed to write Google Sheet"
  );
}

/** Creates a new spreadsheet in the user's Drive with the given tabs; returns its ID. */
export async function createSpreadsheet(userId: string, title: string, tabNames: string[]): Promise<string> {
  const data = await sheetsFetch(
    userId,
    "",
    {
      method: "POST",
      body: JSON.stringify({
        properties: { title },
        sheets: tabNames.map((name) => ({ properties: { title: name, gridProperties: { frozenRowCount: 1 } } })),
      }),
    },
    "Failed to create Google Sheet"
  );
  return data.spreadsheetId;
}

/** Tab names that exist in the spreadsheet — used to add a missing "Business" tab to a pre-existing sheet. */
export async function listTabNames(userId: string, spreadsheetId: string): Promise<string[]> {
  const data = await sheetsFetch(userId, `/${spreadsheetId}?fields=sheets.properties.title`, undefined, "Failed to read Sheet info");
  return (data.sheets ?? []).map((s: { properties: { title: string } }) => s.properties.title);
}

export async function addTab(userId: string, spreadsheetId: string, name: string) {
  await sheetsFetch(
    userId,
    `/${spreadsheetId}:batchUpdate`,
    { method: "POST", body: JSON.stringify({ requests: [{ addSheet: { properties: { title: name } } }] }) },
    "Failed to add tab"
  );
}
