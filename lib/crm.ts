import "server-only";
import { prisma } from "@/lib/db";
import { NotFoundError } from "@/lib/api/response";
import type {
  createBusinessSchema,
  addLeadSchema,
  addActivitySchema,
  draftChannelSchema,
} from "@/lib/validation/crm";
import type { z } from "zod";
import { createGmailDraft, isConnected as isGmailConnected } from "@/lib/gmail";
import { fetchSheetRows, parseSpreadsheetId } from "@/lib/google-sheets";

export type CreateBusinessInput = z.infer<typeof createBusinessSchema>;
export type AddLeadInput = z.infer<typeof addLeadSchema>;
export type AddActivityInput = z.infer<typeof addActivitySchema>;
export type DraftChannel = z.infer<typeof draftChannelSchema>;

export async function listRecentDrafts(userId: string, limit: number) {
  return prisma.emailDraft.findMany({
    where: { crmRecord: { business: businessAccessWhere(userId) } },
    include: { crmRecord: { include: { contact: true, business: true } } },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function listBusinesses(userId: string) {
  return prisma.business.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { crmRecords: true } } },
  });
}

export async function createBusiness(userId: string, data: CreateBusinessInput) {
  return prisma.business.create({ data: { ...data, userId } });
}

function businessAccessWhere(userId: string) {
  return { OR: [{ userId }, { collaborators: { some: { userId } } }] };
}

export async function getOwnedBusiness(userId: string, id: string) {
  const business = await prisma.business.findFirst({
    where: { id, ...businessAccessWhere(userId) },
  });
  if (!business) throw new NotFoundError();
  return business;
}

export async function grantBusinessCollaborator(businessId: string, userId: string) {
  const business = await prisma.business.findUnique({ where: { id: businessId } });
  if (!business || business.userId === userId) return;

  await prisma.businessCollaborator.upsert({
    where: { businessId_userId: { businessId, userId } },
    create: { businessId, userId },
    update: {},
  });
}

export async function listCrmRecords(userId: string, businessId: string) {
  await getOwnedBusiness(userId, businessId);
  return prisma.crmRecord.findMany({
    where: { businessId },
    include: { contact: true },
    orderBy: { updatedAt: "desc" },
  });
}

export async function updateBusinessContextDoc(userId: string, businessId: string, contextDoc: string) {
  await getOwnedBusiness(userId, businessId);
  return prisma.business.update({
    where: { id: businessId },
    data: { contextDoc: contextDoc || null },
  });
}

export async function updateBusinessSheetLink(
  userId: string,
  businessId: string,
  data: { crmSheetUrl: string; crmSheetTab: string }
) {
  await getOwnedBusiness(userId, businessId);
  return prisma.business.update({
    where: { id: businessId },
    data: {
      crmSheetId: parseSpreadsheetId(data.crmSheetUrl),
      crmSheetTab: data.crmSheetTab,
    },
  });
}

const SHEET_HEADER_ALIASES: Record<string, string> = {
  name: "name",
  company: "company",
  "job title": "role",
  email: "email",
  linkedin: "linkedin",
  source: "source",
  notes: "notes",
  "reach out date": "reachOutDate",
  "last contacted": "lastContacted",
  "next follow-up": "nextFollowUp",
  "meeting date": "meetingDate",
  response: "response",
};

function parseSheetDate(value: string | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

// Maps the sheet's free-text "Response" column (Ghost/Decline/Maybe/Accept/blank)
// onto our stage enum. A judgment call, not a 1:1 mapping — re-run the import
// after manually correcting a stage in-app and it'll get overwritten again,
// since the sheet is the source of truth by design.
function stageFromSheetRow(response: string | undefined, reachOutDate: Date | null): string {
  const normalized = (response ?? "").trim().toLowerCase();
  if (normalized === "decline") return "lost";
  if (normalized === "accept") return "proposal";
  if (normalized === "maybe") return "qualified";
  if (normalized === "ghost") return "contacted";
  return reachOutDate ? "contacted" : "lead";
}

export interface SheetImportResult {
  rowsSeen: number;
  created: number;
  updated: number;
  skipped: number;
}

/**
 * Pulls leads from the business's linked Google Sheet CRM tab into our own
 * Contact/CrmRecord tables. One-way, pull-only — the Sheet stays the source
 * of truth (it has its own daily-sort automation the team relies on), we
 * never write back to it. Safe to re-run any time; matches existing leads
 * by email (or name+company if no email) and updates them in place.
 */
export async function importLeadsFromSheet(userId: string, businessId: string): Promise<SheetImportResult> {
  const business = await getOwnedBusiness(userId, businessId);
  if (!business.crmSheetId) {
    throw new Error("This business has no linked Google Sheet yet.");
  }

  const rows = await fetchSheetRows(userId, business.crmSheetId, business.crmSheetTab ?? "CRM");
  if (rows.length === 0) return { rowsSeen: 0, created: 0, updated: 0, skipped: 0 };

  const headerIndex: Record<string, number> = {};
  rows[0].forEach((header, i) => {
    const key = SHEET_HEADER_ALIASES[header.trim().toLowerCase()];
    if (key) headerIndex[key] = i;
  });

  const get = (row: string[], key: string) => {
    const i = headerIndex[key];
    return i === undefined ? undefined : row[i]?.trim();
  };

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const row of rows.slice(1)) {
    const name = get(row, "name");
    if (!name) {
      skipped++;
      continue;
    }

    const email = get(row, "email") || undefined;
    const company = get(row, "company") || undefined;
    const reachOutDate = parseSheetDate(get(row, "reachOutDate"));
    const lastContacted = parseSheetDate(get(row, "lastContacted"));
    const nextFollowUp = parseSheetDate(get(row, "nextFollowUp"));
    const meetingDate = parseSheetDate(get(row, "meetingDate"));
    const stage = stageFromSheetRow(get(row, "response"), reachOutDate);

    const existingContact = await prisma.contact.findFirst({
      where: email
        ? { userId, email }
        : { userId, name: { equals: name, mode: "insensitive" }, company: company ?? null },
    });

    const contact = existingContact
      ? await prisma.contact.update({
          where: { id: existingContact.id },
          data: {
            name,
            email,
            company,
            role: get(row, "role") || undefined,
            linkedin: get(row, "linkedin") || undefined,
            notes: get(row, "notes") || undefined,
          },
        })
      : await prisma.contact.create({
          data: {
            userId,
            name,
            email,
            company,
            role: get(row, "role") || undefined,
            linkedin: get(row, "linkedin") || undefined,
            notes: get(row, "notes") || undefined,
          },
        });

    const existingRecord = await prisma.crmRecord.findFirst({
      where: { businessId, contactId: contact.id },
    });

    const recordData = {
      stage,
      source: get(row, "source") || undefined,
      lastTouchAt: lastContacted ?? reachOutDate ?? undefined,
      nextAction: meetingDate ? "Meeting" : nextFollowUp ? "Follow up" : undefined,
      nextActionAt: meetingDate ?? nextFollowUp ?? undefined,
    };

    if (existingRecord) {
      await prisma.crmRecord.update({ where: { id: existingRecord.id }, data: recordData });
      updated++;
    } else {
      const created_ = await prisma.crmRecord.create({
        data: { businessId, contactId: contact.id, ...recordData },
      });
      await prisma.activity.create({
        data: {
          crmRecordId: created_.id,
          kind: "note",
          body: "Imported from Google Sheet CRM.",
        },
      });
      created++;
    }
  }

  return { rowsSeen: rows.length - 1, created, updated, skipped };
}

/**
 * The user's highest-priority leads across every business they own or
 * collaborate on, ranked by what's most overdue/soonest due, then least
 * recently touched. Used to pick who the morning outreach agent drafts for.
 */
export async function listTopLeads(userId: string, limit: number) {
  return prisma.crmRecord.findMany({
    where: { business: businessAccessWhere(userId), stage: { notIn: ["won", "lost"] } },
    include: { contact: true, business: true },
    orderBy: [{ nextActionAt: { sort: "asc", nulls: "last" } }, { lastTouchAt: { sort: "asc", nulls: "first" } }],
    take: limit,
  });
}

export async function addLead(userId: string, businessId: string, data: AddLeadInput) {
  await getOwnedBusiness(userId, businessId);

  return prisma.$transaction(async (tx) => {
    const contact = await tx.contact.create({
      data: {
        userId,
        name: data.name,
        email: data.email || undefined,
        company: data.company || undefined,
      },
    });
    return tx.crmRecord.create({
      data: { businessId, contactId: contact.id },
      include: { contact: true },
    });
  });
}

async function assertOwnsCrmRecord(userId: string, crmRecordId: string) {
  const record = await prisma.crmRecord.findFirst({
    where: { id: crmRecordId, business: businessAccessWhere(userId) },
  });
  if (!record) throw new NotFoundError();
  return record;
}

export async function getCrmRecordDetail(userId: string, crmRecordId: string) {
  await assertOwnsCrmRecord(userId, crmRecordId);
  const record = await prisma.crmRecord.findUnique({
    where: { id: crmRecordId },
    include: {
      contact: true,
      business: true,
      activities: { orderBy: { occurredAt: "desc" } },
      drafts: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!record) throw new NotFoundError();
  return record;
}

export async function updateCrmStage(userId: string, crmRecordId: string, stage: string) {
  await assertOwnsCrmRecord(userId, crmRecordId);
  return prisma.crmRecord.update({
    where: { id: crmRecordId },
    data: { stage, lastTouchAt: new Date() },
  });
}

export async function addActivity(userId: string, crmRecordId: string, data: AddActivityInput) {
  await assertOwnsCrmRecord(userId, crmRecordId);
  await prisma.crmRecord.update({
    where: { id: crmRecordId },
    data: { lastTouchAt: new Date() },
  });
  return prisma.activity.create({
    data: { crmRecordId, kind: data.kind, body: data.body },
  });
}

export async function createEmailDraft(
  userId: string,
  crmRecordId: string,
  data: { subject?: string; body: string; researchNotes?: string; channel?: DraftChannel }
) {
  await assertOwnsCrmRecord(userId, crmRecordId);
  return prisma.emailDraft.create({
    data: {
      crmRecordId,
      channel: data.channel ?? "email",
      subject: data.subject,
      body: data.body,
      researchNotes: data.researchNotes,
    },
  });
}

/**
 * Pushes an existing "email" channel draft into the user's real Gmail
 * Drafts folder, if they've connected Gmail and the contact has an email
 * on file. No-op (returns null) otherwise — the draft just stays in-app.
 */
export async function pushDraftToGmail(userId: string, draftId: string) {
  const draft = await prisma.emailDraft.findFirst({
    where: { id: draftId, crmRecord: { business: businessAccessWhere(userId) } },
    include: { crmRecord: { include: { contact: true } } },
  });
  if (!draft) throw new NotFoundError();
  if (draft.channel !== "email" || draft.gmailDraftId) return null;

  const recipientEmail = draft.crmRecord.contact.email;
  if (!recipientEmail) return null;
  if (!(await isGmailConnected(userId))) return null;

  const gmailDraft = await createGmailDraft(userId, {
    to: recipientEmail,
    subject: draft.subject ?? "",
    body: draft.body,
  });

  return prisma.emailDraft.update({
    where: { id: draftId },
    data: { gmailDraftId: gmailDraft.id },
  });
}

export async function setDraftStatus(userId: string, draftId: string, status: "approved" | "dismissed") {
  const draft = await prisma.emailDraft.findFirst({
    where: { id: draftId, crmRecord: { business: businessAccessWhere(userId) } },
  });
  if (!draft) throw new NotFoundError();
  const updated = await prisma.emailDraft.update({ where: { id: draftId }, data: { status } });

  if (status === "approved" && draft.channel === "email") {
    await pushDraftToGmail(userId, draftId).catch((error) => {
      console.error("Failed to push approved draft to Gmail:", error);
    });
  }

  return updated;
}
