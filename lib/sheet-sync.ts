import "server-only";
import { prisma } from "@/lib/db";
import { getOwnedBusiness } from "@/lib/crm";
import { CRM_STAGES } from "@/lib/crm-stages";
import {
  addTab,
  createSpreadsheet,
  fetchSheetRows,
  listTabNames,
  sheetUrl,
  writeSheetRows,
} from "@/lib/google-sheets";

/**
 * Two-way sync between a business and one Google Sheet with two tabs:
 *  - CRM:      one row per lead (columns below). Agents/people add or edit rows in the Sheet.
 *  - Business: Field/Value rows for Name, Description, Plan.
 * Sync = pull the Sheet into the app, then push the app back into the Sheet.
 * Conflict rule: if a lead (or the business) was changed in the app since the last sync, the app
 * wins for it; otherwise the Sheet wins. The push keeps any extra columns people add to the Sheet.
 */

export const BUSINESS_TAB = "Business";
const DEFAULT_CRM_TAB = "CRM";

/** The template's columns, in order. `key` is our internal name. */
const COLUMNS = [
  { key: "id", header: "ID" },
  { key: "name", header: "Name" },
  { key: "company", header: "Company" },
  { key: "role", header: "Job Title" },
  { key: "email", header: "Email" },
  { key: "linkedin", header: "LinkedIn" },
  { key: "source", header: "Source" },
  { key: "stage", header: "Stage" },
  { key: "notes", header: "Notes" },
  { key: "reachOutDate", header: "Reach Out Date" },
  { key: "lastContacted", header: "Last Contacted" },
  { key: "nextFollowUp", header: "Next Follow-up" },
  { key: "meetingDate", header: "Meeting Date" },
  { key: "response", header: "Response" },
] as const;

// Older sheets use different header text for the same concept — map every known variant onto our keys.
const HEADER_ALIASES: Record<string, string> = {
  ...Object.fromEntries(COLUMNS.map((c) => [c.header.toLowerCase(), c.key])),
  record: "name",
  "company > name": "company",
  "email addresses": "email",
  event: "source",
  "1st ro": "reachOutDate",
};

export function parseSheetDate(value: string | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

const formatDate = (d: Date | null | undefined) => (d ? d.toISOString().slice(0, 10) : "");

// Maps the free-text "Response" column (Ghost/Decline/Maybe/Accept/blank) onto our stage enum.
export function stageFromSheetRow(response: string | undefined, reachOutDate: Date | null): string {
  const normalized = (response ?? "").trim().toLowerCase();
  if (normalized === "decline") return "lost";
  if (normalized === "accept") return "proposal";
  if (normalized === "maybe") return "qualified";
  if (normalized === "ghost") return "contacted";
  return reachOutDate ? "contacted" : "lead";
}

const isStage = (v: string | undefined): v is string => Boolean(v) && (CRM_STAGES as readonly string[]).includes(v!);

export interface SheetSyncResult {
  rowsSeen: number;
  created: number;
  updated: number;
  skipped: number;
  pushed: number;
  sheetUrl: string;
}
export type SheetImportResult = SheetSyncResult;

function indexHeaders(headerRow: string[]) {
  const index: Record<string, number> = {};
  headerRow.forEach((header, i) => {
    const key = HEADER_ALIASES[header.trim().toLowerCase()];
    if (key && index[key] === undefined) index[key] = i;
  });
  return index;
}

/** Creates the template spreadsheet for a business, links it, and fills it with current data. */
export async function createBusinessTemplateSheet(userId: string, businessId: string) {
  const business = await getOwnedBusiness(userId, businessId);
  const id = await createSpreadsheet(userId, `${business.name} — Amahoro CRM`, [DEFAULT_CRM_TAB, BUSINESS_TAB]);
  await prisma.business.update({
    where: { id: businessId },
    data: { crmSheetId: id, crmSheetTab: DEFAULT_CRM_TAB, sheetSyncedAt: null },
  });
  return syncBusinessSheet(userId, businessId);
}

export async function syncBusinessSheet(userId: string, businessId: string): Promise<SheetSyncResult> {
  const business = await getOwnedBusiness(userId, businessId);
  if (!business.crmSheetId) throw new Error("This business has no linked Google Sheet yet.");
  const sheetId = business.crmSheetId;
  const tab = business.crmSheetTab ?? DEFAULT_CRM_TAB;
  const since = business.sheetSyncedAt;
  // Edited in the app since the last sync => app wins. Never synced before => Sheet wins for matches.
  const changedInApp = (updatedAt: Date) => Boolean(since) && updatedAt > since!;

  const rows = await fetchSheetRows(userId, sheetId, tab);
  const grid: string[][] = rows.length ? rows.map((r) => [...r]) : [COLUMNS.map((c) => c.header)];
  const index = indexHeaders(grid[0]);

  // Make sure every template column exists so pushes have somewhere to write (extra columns are kept).
  for (const col of COLUMNS) {
    if (index[col.key] === undefined) {
      index[col.key] = grid[0].length;
      grid[0].push(col.header);
    }
  }
  const cell = (row: string[], key: string) => row[index[key]]?.trim() || undefined;
  const setCell = (row: string[], key: string, value: string) => {
    while (row.length <= index[key]) row.push("");
    row[index[key]] = value;
  };

  const [records, contactsByKey] = await Promise.all([
    prisma.crmRecord.findMany({ where: { businessId }, include: { contact: true } }),
    prisma.contact.findMany({ where: { userId } }),
  ]);
  const recordById = new Map(records.map((r) => [r.id, r]));
  const recordByContact = new Map(records.map((r) => [r.contactId, r]));
  const contactByEmail = new Map(contactsByKey.filter((c) => c.email).map((c) => [c.email!.toLowerCase(), c]));
  const contactByNameCompany = new Map(
    contactsByKey.map((c) => [`${c.name.toLowerCase()}|${(c.company ?? "").toLowerCase()}`, c])
  );

  let created = 0;
  let updated = 0;
  let skipped = 0;
  const seenRecordIds = new Set<string>();

  // ---- PULL: Sheet -> app
  for (const row of grid.slice(1)) {
    const name = cell(row, "name");
    if (!name) {
      skipped++;
      continue;
    }
    const email = cell(row, "email");
    const company = cell(row, "company");
    const reachOutDate = parseSheetDate(cell(row, "reachOutDate"));
    const meetingDate = parseSheetDate(cell(row, "meetingDate"));
    const nextFollowUp = parseSheetDate(cell(row, "nextFollowUp"));
    const sheetStage = cell(row, "stage")?.toLowerCase();

    let record = recordById.get(cell(row, "id") ?? "");
    let contact = record?.contact;
    if (!contact) {
      contact =
        (email && contactByEmail.get(email.toLowerCase())) ||
        contactByNameCompany.get(`${name.toLowerCase()}|${(company ?? "").toLowerCase()}`) ||
        undefined;
      record = contact ? recordByContact.get(contact.id) : undefined;
    }

    const contactData = {
      name,
      email,
      company,
      role: cell(row, "role"),
      linkedin: cell(row, "linkedin"),
      notes: cell(row, "notes"),
    };
    const recordData = {
      source: cell(row, "source"),
      lastTouchAt: parseSheetDate(cell(row, "lastContacted")) ?? reachOutDate ?? undefined,
      nextAction: meetingDate ? "Meeting" : nextFollowUp ? "Follow up" : undefined,
      nextActionAt: meetingDate ?? nextFollowUp ?? undefined,
    };

    if (record && contact) {
      seenRecordIds.add(record.id);
      if (!changedInApp(record.updatedAt)) {
        const stage = isStage(sheetStage) ? sheetStage : cell(row, "response") ? stageFromSheetRow(cell(row, "response"), reachOutDate) : record.stage;
        await prisma.contact.update({ where: { id: contact.id }, data: contactData });
        await prisma.crmRecord.update({ where: { id: record.id }, data: { ...recordData, stage } });
        updated++;
      }
      setCell(row, "id", record.id);
    } else {
      const stage = isStage(sheetStage) ? sheetStage : stageFromSheetRow(cell(row, "response"), reachOutDate);
      const newContact = contact ?? (await prisma.contact.create({ data: { userId, ...contactData } }));
      const newRecord = await prisma.crmRecord.create({
        data: { businessId, contactId: newContact.id, stage, ...recordData },
      });
      await prisma.activity.create({
        data: { crmRecordId: newRecord.id, kind: "note", body: "Imported from Google Sheet CRM." },
      });
      seenRecordIds.add(newRecord.id);
      setCell(row, "id", newRecord.id);
      created++;
    }
  }

  // Business tab: Name / Description / Plan.
  const tabs = await listTabNames(userId, sheetId);
  let businessFields = { name: business.name, description: business.description, contextDoc: business.contextDoc };
  if (tabs.includes(BUSINESS_TAB) && !changedInApp(business.updatedAt)) {
    const fields = new Map(
      (await fetchSheetRows(userId, sheetId, BUSINESS_TAB)).slice(1).map((r) => [r[0]?.trim().toLowerCase(), r[1]?.trim()])
    );
    const next = {
      name: fields.get("name") || business.name,
      description: fields.get("description") ?? business.description,
      contextDoc: fields.get("plan") ?? business.contextDoc,
    };
    if (next.name !== business.name || next.description !== business.description || next.contextDoc !== business.contextDoc) {
      await prisma.business.update({ where: { id: businessId }, data: next });
      businessFields = next;
    }
  }

  // ---- PUSH: app -> Sheet (fresh read so the pull's edits are included)
  const fresh = await prisma.crmRecord.findMany({ where: { businessId }, include: { contact: true } });
  const freshById = new Map(fresh.map((r) => [r.id, r]));
  const writeRecord = (row: string[], r: (typeof fresh)[number]) => {
    const meeting = r.nextAction === "Meeting";
    const values: Record<string, string> = {
      id: r.id,
      name: r.contact.name,
      company: r.contact.company ?? "",
      role: r.contact.role ?? "",
      email: r.contact.email ?? "",
      linkedin: r.contact.linkedin ?? "",
      source: r.source ?? "",
      stage: r.stage,
      notes: r.contact.notes ?? "",
      lastContacted: formatDate(r.lastTouchAt),
      nextFollowUp: meeting ? "" : formatDate(r.nextActionAt),
      meetingDate: meeting ? formatDate(r.nextActionAt) : "",
    };
    for (const [key, value] of Object.entries(values)) setCell(row, key, value);
  };

  const onSheet = new Set<string>();
  for (const row of grid.slice(1)) {
    const record = freshById.get(cell(row, "id") ?? "");
    if (record) {
      writeRecord(row, record);
      onSheet.add(record.id);
    }
  }
  for (const record of fresh) {
    if (onSheet.has(record.id)) continue;
    const row: string[] = [];
    writeRecord(row, record);
    grid.push(row);
  }
  const width = Math.max(...grid.map((r) => r.length));
  const padded = grid.map((r) => Array.from({ length: width }, (_, i) => r[i] ?? ""));
  await writeSheetRows(userId, sheetId, tab, padded);

  if (!tabs.includes(BUSINESS_TAB)) await addTab(userId, sheetId, BUSINESS_TAB);
  await writeSheetRows(userId, sheetId, BUSINESS_TAB, [
    ["Field", "Value"],
    ["Name", businessFields.name],
    ["Description", businessFields.description ?? ""],
    ["Plan", businessFields.contextDoc ?? ""],
  ]);

  // updatedAt is pinned to the same instant so this write doesn't itself look like an app-side edit next time.
  const now = new Date();
  await prisma.business.update({ where: { id: businessId }, data: { sheetSyncedAt: now, updatedAt: now } });

  return { rowsSeen: grid.length - 1, created, updated, skipped, pushed: fresh.length, sheetUrl: sheetUrl(sheetId) };
}
