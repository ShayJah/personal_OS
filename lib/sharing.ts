import "server-only";
import crypto from "crypto";
import { prisma } from "@/lib/db";
import { toDateOnly } from "@/lib/date";
import { addDays, startOfWeek } from "@/lib/calendar";

export type ShareType = "progress" | "report" | "summary" | "business";
export type BusinessDetailLevel = "overview" | "pipeline" | "full";

/**
 * Generate a unique shareable token
 */
export function generateShareToken(): string {
  return crypto.randomBytes(16).toString("hex");
}

/**
 * Create a share link for a user
 */
export async function createShareLink(
  userId: string,
  type: ShareType,
  target?: string,
  expiresIn?: number, // milliseconds; null = never expires
  options?: { detailLevel?: BusinessDetailLevel; allowEdit?: boolean }
) {
  const token = generateShareToken();
  const expiresAt = expiresIn ? new Date(Date.now() + expiresIn) : null;

  return prisma.sharedLink.create({
    data: {
      userId,
      token,
      type,
      target,
      expiresAt,
      detailLevel: options?.detailLevel,
      allowEdit: options?.allowEdit ?? false,
    },
  });
}

/**
 * Get a share link by token
 */
export async function getShareLinkByToken(token: string) {
  const link = await prisma.sharedLink.findUnique({
    where: { token },
    include: { user: { include: { profile: true } } },
  });

  if (!link) return null;

  // Check if expired
  if (link.expiresAt && link.expiresAt < new Date()) {
    return null;
  }

  return link;
}

/**
 * Get share settings for a user
 */
export async function getShareSettings(userId: string) {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    include: { shareSettings: true },
  });

  return profile?.shareSettings || null;
}

/**
 * Update share settings for a user
 */
export async function updateShareSettings(
  userId: string,
  settings: {
    shareProgressPage?: boolean;
    shareReports?: boolean;
    shareTasks?: boolean;
    shareHabits?: boolean;
    shareHighlights?: boolean;
  }
) {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (!profile) {
    throw new Error("Profile not found");
  }

  return prisma.shareSettings.upsert({
    where: { profileId: profile.id },
    create: {
      profileId: profile.id,
      ...settings,
    },
    update: settings,
  });
}

/**
 * Get progress summary for sharing
 */
export async function getProgressSummary(userId: string) {
  const today = toDateOnly(new Date());
  const weekStart = startOfWeek(today);
  const weekEnd = addDays(weekStart, 6);

  const [user, todayTasks, weekTasks, habits, weekHabits, priorities] =
    await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, email: true },
      }),
      prisma.task.findMany({
        where: {
          userId,
          createdAt: {
            gte: new Date(today),
            lt: new Date(addDays(today, 1)),
          },
        },
        select: { title: true, completed: true },
      }),
      prisma.task.findMany({
        where: {
          userId,
          createdAt: { gte: weekStart, lt: addDays(weekEnd, 1) },
        },
        select: { title: true, completed: true },
      }),
      prisma.habit.findMany({
        where: { userId },
        select: { name: true, logs: { where: { date: today } } },
      }),
      prisma.habitLog.findMany({
        where: {
          userId,
          date: { gte: weekStart, lte: weekEnd },
          completed: true,
        },
      }),
      prisma.priority.findMany({
        where: { userId, date: today },
        orderBy: { order: "asc" },
      }),
    ]);

  const todayCompleted = todayTasks.filter((t) => t.completed).length;
  const weekCompleted = weekTasks.filter((t) => t.completed).length;
  const habitStreak = habits.filter((h) =>
    h.logs.some((l) => l.completed)
  ).length;

  return {
    user,
    today: {
      tasksCompleted: todayCompleted,
      tasksTotal: todayTasks.length,
      completionRate:
        todayTasks.length > 0
          ? Math.round((todayCompleted / todayTasks.length) * 100)
          : 0,
      priorities: priorities.map((p) => p.content),
    },
    week: {
      tasksCompleted: weekCompleted,
      tasksTotal: weekTasks.length,
      completionRate:
        weekTasks.length > 0
          ? Math.round((weekCompleted / weekTasks.length) * 100)
          : 0,
      habitLogsCompleted: weekHabits.length,
      habitStreak,
    },
    habits: habits.map((h) => ({
      name: h.name,
      completedToday: h.logs.length > 0,
    })),
  };
}

/**
 * Get a report owned by userId for sharing, or null if not found/not owned
 */
export async function getSharedReport(userId: string, reportId: string) {
  return prisma.report.findFirst({
    where: { id: reportId, userId },
  });
}

/**
 * Get a business owned by ownerId for sharing, shaped by detail level
 */
export async function getBusinessShareData(
  ownerId: string,
  businessId: string,
  detailLevel: BusinessDetailLevel
) {
  const business = await prisma.business.findFirst({
    where: { id: businessId, userId: ownerId },
  });
  if (!business) return null;

  const overview = {
    name: business.name,
    description: business.description,
    contextDoc: business.contextDoc,
  };

  if (detailLevel === "overview") {
    return { business: overview };
  }

  const records = await prisma.crmRecord.findMany({
    where: { businessId },
    include: { contact: true },
    orderBy: { updatedAt: "desc" },
  });

  if (detailLevel === "pipeline") {
    const stageCounts: Record<string, number> = {};
    for (const record of records) {
      stageCounts[record.stage] = (stageCounts[record.stage] || 0) + 1;
    }
    return { business: overview, pipeline: { total: records.length, stageCounts } };
  }

  return {
    business: overview,
    records: records.map((record) => ({
      id: record.id,
      stage: record.stage,
      value: record.value ? Number(record.value) : null,
      source: record.source,
      nextAction: record.nextAction,
      nextActionAt: record.nextActionAt,
      contact: {
        name: record.contact.name,
        email: record.contact.email,
        company: record.contact.company,
      },
    })),
  };
}

/**
 * Revoke a share link
 */
export async function revokeShareLink(token: string) {
  return prisma.sharedLink.delete({
    where: { token },
  });
}

/**
 * Get all share links for a user
 */
export async function getUserShareLinks(userId: string) {
  return prisma.sharedLink.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}
