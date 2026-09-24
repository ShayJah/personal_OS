import "server-only";
import { prisma } from "@/lib/db";
import { CRM_STAGES } from "@/lib/crm-stages";

const DAY_MS = 86_400_000;
export const OUTREACH_WEEKS = 10;

/**
 * What the outreach numbers mean, given what the app records today:
 *  - Sent    = outreach drafts you approved (they go to Gmail) + logged calls.
 *  - Replies = activities logged as "Reply received".
 *  - Meetings = activities of kind "meeting" (scheduling an interview logs one).
 */
export const SENT_ACTIVITY_KINDS = ["call"];
export const REPLY_ACTIVITY_KIND = "reply";
export const MEETING_ACTIVITY_KIND = "meeting";

export type WeekBucket = { weekStart: string; sent: number; replies: number };

export type BusinessSnapshot = {
  id: string;
  name: string;
  description: string | null;
  leads: number;
  newLeads30: number;
  /** Cumulative funnel: how many leads reached at least each stage. */
  funnel: { stage: string; count: number }[];
  sent30: number;
  sentPrev30: number;
  replies30: number;
  meetings30: number;
  meetingsThisWeek: number;
  /** replies / sent over the last 30 days, or null when nothing was sent. */
  replyRate: number | null;
  weekly: WeekBucket[];
  pendingDrafts: number;
  overdue: number;
};

function weekStartUtc(date: Date): number {
  const d = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  const day = new Date(d).getUTCDay();
  return d - (day === 0 ? 6 : day - 1) * DAY_MS;
}

/** Callers must already have checked the user can access these businesses. */
export async function getBusinessSnapshots(
  businesses: { id: string; name: string; description: string | null }[]
): Promise<BusinessSnapshot[]> {
  if (businesses.length === 0) return [];

  const ids = businesses.map((b) => b.id);
  const now = new Date();
  const thisWeek = weekStartUtc(now);
  const firstWeek = thisWeek - (OUTREACH_WEEKS - 1) * 7 * DAY_MS;
  const since = new Date(Math.min(firstWeek, now.getTime() - 60 * DAY_MS));

  const [records, activities, drafts] = await Promise.all([
    prisma.crmRecord.findMany({
      where: { businessId: { in: ids } },
      select: { businessId: true, stage: true, createdAt: true, nextActionAt: true },
    }),
    prisma.activity.findMany({
      where: { crmRecord: { businessId: { in: ids } }, occurredAt: { gte: since } },
      select: { kind: true, occurredAt: true, crmRecord: { select: { businessId: true } } },
    }),
    prisma.emailDraft.findMany({
      where: {
        crmRecord: { businessId: { in: ids } },
        OR: [{ status: "pending" }, { status: "approved", createdAt: { gte: since } }],
      },
      select: { status: true, createdAt: true, crmRecord: { select: { businessId: true } } },
    }),
  ]);

  const t30 = now.getTime() - 30 * DAY_MS;
  const t60 = now.getTime() - 60 * DAY_MS;
  const stageRank = new Map<string, number>(CRM_STAGES.map((s, i) => [s, i]));
  const wonIdx = stageRank.get("won")!;
  const lostIdx = stageRank.get("lost")!;
  const funnelStages = CRM_STAGES.filter((s) => s !== "lost");

  return businesses.map((b) => {
    const recs = records.filter((r) => r.businessId === b.id);
    const acts = activities.filter((a) => a.crmRecord.businessId === b.id);
    const approved = drafts.filter((d) => d.crmRecord.businessId === b.id && d.status === "approved");

    // Outbound touches, each with the moment it happened.
    const sentAt = [
      ...approved.map((d) => d.createdAt.getTime()),
      ...acts.filter((a) => SENT_ACTIVITY_KINDS.includes(a.kind)).map((a) => a.occurredAt.getTime()),
    ];
    const replyAt = acts.filter((a) => a.kind === REPLY_ACTIVITY_KIND).map((a) => a.occurredAt.getTime());
    const meetingAt = acts.filter((a) => a.kind === MEETING_ACTIVITY_KIND).map((a) => a.occurredAt.getTime());

    const weekly: WeekBucket[] = Array.from({ length: OUTREACH_WEEKS }, (_, i) => {
      const start = firstWeek + i * 7 * DAY_MS;
      const inWeek = (t: number) => t >= start && t < start + 7 * DAY_MS;
      return {
        weekStart: new Date(start).toISOString(),
        sent: sentAt.filter(inWeek).length,
        replies: replyAt.filter(inWeek).length,
      };
    });

    const sent30 = sentAt.filter((t) => t >= t30).length;
    const replies30 = replyAt.filter((t) => t >= t30).length;

    return {
      id: b.id,
      name: b.name,
      description: b.description,
      leads: recs.length,
      newLeads30: recs.filter((r) => r.createdAt.getTime() >= t30).length,
      funnel: funnelStages.map((stage) => {
        const rank = stageRank.get(stage)!;
        return {
          stage,
          count: recs.filter((r) => {
            const r2 = stageRank.get(r.stage) ?? 0;
            // "Lost" leads only count toward the first step (they were found).
            return rank === 0 ? true : r2 !== lostIdx && r2 >= rank && r2 <= wonIdx;
          }).length,
        };
      }),
      sent30,
      sentPrev30: sentAt.filter((t) => t >= t60 && t < t30).length,
      replies30,
      meetings30: meetingAt.filter((t) => t >= t30).length,
      meetingsThisWeek: meetingAt.filter((t) => t >= thisWeek).length,
      replyRate: sent30 > 0 ? Math.round((replies30 / sent30) * 100) : null,
      weekly,
      pendingDrafts: drafts.filter((d) => d.crmRecord.businessId === b.id && d.status === "pending").length,
      overdue: recs.filter(
        (r) => r.nextActionAt && r.nextActionAt < now && r.stage !== "won" && r.stage !== "lost"
      ).length,
    };
  });
}

/** Drafts for one business (caller checks access), newest first. */
export async function listBusinessDrafts(businessId: string) {
  return prisma.emailDraft.findMany({
    where: { crmRecord: { businessId } },
    include: { crmRecord: { include: { contact: true } } },
    orderBy: { createdAt: "desc" },
    take: 60,
  });
}
