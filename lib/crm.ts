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
import { parseSpreadsheetId } from "@/lib/google-sheets";
import { after } from "next/server";
import { postToSlack } from "@/lib/slack";
import { SLACK_NOTIFY_STAGES, STAGE_ACTIVITY_KIND, stageChangeBody } from "@/lib/crm-stages";
import { createInterviewEvent, extractMeetLink } from "@/lib/google-calendar";

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

export interface BusinessWithStats {
  id: string;
  name: string;
  description: string | null;
  leads: number;
  won: number;
  overdue: number;
}

/**
 * Same as listBusinesses, plus per-business won/overdue counts for the
 * list page's stat row — two batched queries total, not one per business.
 */
export async function listBusinessesWithStats(userId: string): Promise<BusinessWithStats[]> {
  const businesses = await listBusinesses(userId);
  if (businesses.length === 0) return [];

  const businessIds = businesses.map((b) => b.id);

  const [wonCounts, overdueRecords] = await Promise.all([
    prisma.crmRecord.groupBy({
      by: ["businessId"],
      where: { businessId: { in: businessIds }, stage: "won" },
      _count: { _all: true },
    }),
    prisma.crmRecord.findMany({
      where: {
        businessId: { in: businessIds },
        nextActionAt: { lt: new Date() },
        stage: { notIn: ["won", "lost"] },
      },
      select: { businessId: true },
    }),
  ]);

  const wonByBusiness = new Map(wonCounts.map((row) => [row.businessId, row._count._all]));
  const overdueByBusiness = new Map<string, number>();
  for (const record of overdueRecords) {
    overdueByBusiness.set(record.businessId, (overdueByBusiness.get(record.businessId) ?? 0) + 1);
  }

  return businesses.map((b) => ({
    id: b.id,
    name: b.name,
    description: b.description,
    leads: b._count.crmRecords,
    won: wonByBusiness.get(b.id) ?? 0,
    overdue: overdueByBusiness.get(b.id) ?? 0,
  }));
}

/** Every business the user owns or collaborates on — what the cross-business views show. */
export async function listAccessibleBusinesses(userId: string) {
  return prisma.business.findMany({
    where: businessAccessWhere(userId),
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, icon: true, iconImage: true },
  });
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

/** Owner-only — collaborators can work the pipeline but not share the business or repoint its integrations. */
export async function assertBusinessOwner(userId: string, id: string) {
  const business = await prisma.business.findFirst({ where: { id, userId } });
  if (!business) throw new NotFoundError();
  return business;
}

export async function isBusinessMember(userId: string, businessId: string) {
  return Boolean(await prisma.business.findFirst({ where: { id: businessId, ...businessAccessWhere(userId) }, select: { id: true } }));
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
    include: { contact: true, assignedTo: { select: { id: true, name: true, email: true } } },
    orderBy: { updatedAt: "desc" },
  });
}

export interface OutreachStats {
  totalLeads: number;
  totalActivities: number;
  won: number;
  byUser: { name: string; count: number }[];
}

/** Who's actually reaching out and how much, for the business's team performance card. */
export async function getBusinessOutreachStats(userId: string, businessId: string): Promise<OutreachStats> {
  await getOwnedBusiness(userId, businessId);

  const [totalLeads, won, activityCounts] = await Promise.all([
    prisma.crmRecord.count({ where: { businessId } }),
    prisma.crmRecord.count({ where: { businessId, stage: "won" } }),
    prisma.activity.groupBy({
      by: ["userId"],
      where: { crmRecord: { businessId } },
      _count: { _all: true },
    }),
  ]);

  const totalActivities = activityCounts.reduce((sum, row) => sum + row._count._all, 0);

  const userIds = activityCounts.map((row) => row.userId).filter((id): id is string => Boolean(id));
  const users = userIds.length
    ? await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true, email: true } })
    : [];
  const userLabel = (id: string | null) =>
    users.find((u) => u.id === id)?.name ?? users.find((u) => u.id === id)?.email ?? "Unattributed";

  const byUser = activityCounts
    .map((row) => ({ name: userLabel(row.userId), count: row._count._all }))
    .sort((a, b) => b.count - a.count);

  return { totalLeads, totalActivities, won, byUser };
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
  await assertBusinessOwner(userId, businessId);
  return prisma.business.update({
    where: { id: businessId },
    data: {
      sheetSyncedAt: null,
      crmSheetId: parseSpreadsheetId(data.crmSheetUrl),
      crmSheetTab: data.crmSheetTab,
    },
  });
}

/** Sets the emoji and/or uploaded photo; a field left undefined is untouched, null clears it. */
export async function updateBusinessIcon(
  userId: string,
  businessId: string,
  data: { icon?: string | null; iconImage?: string | null }
) {
  await getOwnedBusiness(userId, businessId);
  return prisma.business.update({ where: { id: businessId }, data });
}

export async function updateBusinessSharedCalendar(userId: string, businessId: string, sharedCalendarId: string) {
  await assertBusinessOwner(userId, businessId);
  return prisma.business.update({
    where: { id: businessId },
    data: { sharedCalendarId: sharedCalendarId || null },
  });
}

/**
 * Creates a Google Meet-enabled event on the business's shared calendar,
 * inviting the contact and whoever's assigned to the lead, moves the lead
 * to "interviewed", and posts the Meet link to Slack — all in one action,
 * so scheduling happens the moment you set the interview instead of
 * waiting on a polling job to notice the calendar changed.
 */
export async function scheduleInterview(
  userId: string,
  crmRecordId: string,
  data: { startAt: Date; endAt: Date; extraAttendeeEmails?: string[] }
) {
  const record = await assertOwnsCrmRecord(userId, crmRecordId);
  const [business, contact, actingUser] = await Promise.all([
    prisma.business.findUniqueOrThrow({ where: { id: record.businessId } }),
    prisma.contact.findUniqueOrThrow({ where: { id: record.contactId } }),
    prisma.user.findUnique({ where: { id: userId }, select: { name: true, email: true } }),
  ]);

  if (!business.sharedCalendarId) {
    throw new Error("This business has no shared calendar linked yet.");
  }

  const assignedTo = record.assignedToUserId
    ? await prisma.user.findUnique({ where: { id: record.assignedToUserId }, select: { email: true } })
    : null;
  const attendeeEmails = [
    ...new Set(
      [contact.email, assignedTo?.email, ...(data.extraAttendeeEmails ?? [])].filter(
        (e): e is string => Boolean(e)
      )
    ),
  ];

  const event = await createInterviewEvent(userId, {
    calendarId: business.sharedCalendarId,
    title: `${business.name} Meeting with ${contact.name}`,
    description: `Scheduled from Amahoro by ${actingUser?.name ?? actingUser?.email ?? "a teammate"}.`,
    startAt: data.startAt,
    endAt: data.endAt,
    attendeeEmails,
  });
  const meetLink = extractMeetLink(event);

  await prisma.crmRecord.update({
    where: { id: crmRecordId },
    data: {
      stage: "interviewed",
      lastTouchAt: new Date(),
      nextAction: "Interview",
      nextActionAt: data.startAt,
    },
  });
  await prisma.activity.create({
    data: {
      crmRecordId,
      userId,
      kind: "meeting",
      body: `Interview scheduled for ${data.startAt.toLocaleString()}.${meetLink ? ` Meet: ${meetLink}` : ""}`,
    },
  });

  const when = data.startAt.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  after(() =>
    postToSlack(
    `📅 Interview scheduled: *${contact.name}* (${business.name}) — ${when}${meetLink ? `\n${meetLink}` : ""}`
    )
  );

  return { meetLink };
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
      assignedTo: { select: { id: true, name: true, email: true } },
      activities: { orderBy: { occurredAt: "desc" }, include: { user: { select: { name: true, email: true } } } },
      drafts: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!record) throw new NotFoundError();
  return record;
}

/** Everyone with access to a business — its owner plus every collaborator — for the Owner-assignment dropdown. */
export async function listBusinessMembers(userId: string, businessId: string) {
  const business = await getOwnedBusiness(userId, businessId);
  const collaborators = await prisma.businessCollaborator.findMany({
    where: { businessId },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
  const owner = await prisma.user.findUnique({
    where: { id: business.userId },
    select: { id: true, name: true, email: true },
  });
  const members = owner ? [owner, ...collaborators.map((c) => c.user)] : collaborators.map((c) => c.user);
  return members.filter((m, i) => members.findIndex((m2) => m2.id === m.id) === i);
}

export async function assignCrmRecordOwner(userId: string, crmRecordId: string, assignedToUserId: string | null) {
  await assertOwnsCrmRecord(userId, crmRecordId);
  return prisma.crmRecord.update({
    where: { id: crmRecordId },
    data: { assignedToUserId },
  });
}

export async function updateCrmStage(userId: string, crmRecordId: string, stage: string) {
  const before = await assertOwnsCrmRecord(userId, crmRecordId);
  const updated = await prisma.crmRecord.update({
    where: { id: crmRecordId },
    data: { stage, lastTouchAt: new Date() },
    include: { contact: true, business: true },
  });

  // Keep a dated, attributed trail of stage moves — the outreach chart derives replies from it.
  if (before.stage !== stage) {
    await prisma.activity.create({
      data: { crmRecordId, userId, kind: STAGE_ACTIVITY_KIND, body: stageChangeBody(stage) },
    });
  }

  if (SLACK_NOTIFY_STAGES.includes(stage)) {
    const actingUser = await prisma.user.findUnique({ where: { id: userId }, select: { name: true, email: true } });
    after(() => postToSlack(
      `*${updated.contact.name}* (${updated.business.name}) moved to *${stage}* by ${actingUser?.name ?? actingUser?.email ?? "someone"}.`
    ));
  }

  return updated;
}

export async function addActivity(userId: string, crmRecordId: string, data: AddActivityInput) {
  await assertOwnsCrmRecord(userId, crmRecordId);
  await prisma.crmRecord.update({
    where: { id: crmRecordId },
    data: { lastTouchAt: new Date() },
  });
  return prisma.activity.create({
    data: { crmRecordId, userId, kind: data.kind, body: data.body },
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
  const updated = await prisma.emailDraft.update({
    where: { id: draftId },
    data: {
      status,
      // Record when and by whom, so "sent" lands in the week it was actually approved.
      ...(status === "approved" && draft.status !== "approved"
        ? { approvedAt: new Date(), approvedByUserId: userId }
        : {}),
    },
  });

  if (status === "approved" && draft.channel === "email") {
    await pushDraftToGmail(userId, draftId).catch((error) => {
      console.error("Failed to push approved draft to Gmail:", error);
    });
  }

  return updated;
}
