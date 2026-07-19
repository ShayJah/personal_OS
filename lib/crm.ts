import "server-only";
import { prisma } from "@/lib/db";
import { NotFoundError } from "@/lib/api/response";
import type { createBusinessSchema, addLeadSchema, addActivitySchema } from "@/lib/validation/crm";
import type { z } from "zod";

export type CreateBusinessInput = z.infer<typeof createBusinessSchema>;
export type AddLeadInput = z.infer<typeof addLeadSchema>;
export type AddActivityInput = z.infer<typeof addActivitySchema>;

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

export async function getOwnedBusiness(userId: string, id: string) {
  const business = await prisma.business.findFirst({ where: { id, userId } });
  if (!business) throw new NotFoundError();
  return business;
}

export async function listCrmRecords(userId: string, businessId: string) {
  await getOwnedBusiness(userId, businessId);
  return prisma.crmRecord.findMany({
    where: { businessId },
    include: { contact: true },
    orderBy: { updatedAt: "desc" },
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
    where: { id: crmRecordId, business: { userId } },
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
  data: { subject: string; body: string; researchNotes?: string }
) {
  await assertOwnsCrmRecord(userId, crmRecordId);
  return prisma.emailDraft.create({
    data: {
      crmRecordId,
      subject: data.subject,
      body: data.body,
      researchNotes: data.researchNotes,
    },
  });
}

export async function setDraftStatus(userId: string, draftId: string, status: "approved" | "dismissed") {
  const draft = await prisma.emailDraft.findFirst({
    where: { id: draftId, crmRecord: { business: { userId } } },
  });
  if (!draft) throw new NotFoundError();
  return prisma.emailDraft.update({ where: { id: draftId }, data: { status } });
}
