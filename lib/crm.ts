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
