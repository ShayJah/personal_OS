import "server-only";
import { prisma } from "@/lib/db";
import { CRM_STAGES, REPLIED_STAGES, STAGE_ACTIVITY_KIND, parseStageChange } from "@/lib/crm-stages";

const DAY_MS = 86_400_000;
export const OUTREACH_WEEKS = 10;

/**
 * What the outreach numbers mean, given what the app records:
 *  - Sent    = outreach drafts someone approved (dated by approval, credited to
 *              whoever approved) + logged calls.
 *  - Replies = leads that answered, counted once each, in the week of their FIRST
 *              reply signal: a "Reply received" note, or a stage move into
 *              qualified / interviewed / proposal / won.
 *  - Meetings = activities of kind "meeting" (scheduling an interview logs one).
 * Weeks run Monday to Sunday, in UTC.
 */
export const SENT_ACTIVITY_KINDS = ["call"];
export const REPLY_ACTIVITY_KIND = "reply";
export const MEETING_ACTIVITY_KIND = "meeting";

export type WeekBucket = {
  weekStart: string;
  sent: number;
  replies: number;
  /** The week still in progress, so a low number isn't a real drop. */
  partial: boolean;
};

export type OutreachPerson = { id: string; name: string; weeks: WeekBucket[] };

export type BusinessSnapshot = {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  iconImage: string | null;
  leads: number;
  newLeads30: number;
  /** Cumulative funnel: how many leads reached at least each stage. */
  funnel: { stage: string; count: number }[];
  sent30: number;
  sentPrev30: number;
  replies30: number;
  meetings30: number;
  meetingsThisWeek: number;
  /** replies / sent over the last 30 days (capped at 100), or null when nothing was sent. */
  replyRate: number | null;
  weekly: WeekBucket[];
  /** Each teammate's own weekly numbers, busiest first. */
  people: OutreachPerson[];
  pendingDrafts: number;
  overdue: number;
};

function weekStartUtc(date: Date): number {
  const d = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  const day = new Date(d).getUTCDay();
  return d - (day === 0 ? 6 : day - 1) * DAY_MS;
}

type Event = { t: number; userId: string | null };

/** Callers must already have checked the user can access these businesses. */
export async function getBusinessSnapshots(
  businesses: { id: string; name: string; description: string | null; icon: string | null; iconImage: string | null }[]
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
    // Window activities for sent/meetings, plus every reply signal ever
    // (a lead's FIRST reply may predate the chart window).
    prisma.activity.findMany({
      where: {
        crmRecord: { businessId: { in: ids } },
        OR: [{ occurredAt: { gte: since } }, { kind: { in: [REPLY_ACTIVITY_KIND, STAGE_ACTIVITY_KIND] } }],
      },
      select: {
        kind: true,
        body: true,
        occurredAt: true,
        userId: true,
        crmRecordId: true,
        crmRecord: { select: { businessId: true } },
      },
    }),
    prisma.emailDraft.findMany({
      where: {
        crmRecord: { businessId: { in: ids } },
        OR: [{ status: "pending" }, { status: "approved" }],
      },
      select: {
        status: true,
        createdAt: true,
        approvedAt: true,
        approvedByUserId: true,
        crmRecord: { select: { businessId: true, assignedToUserId: true } },
      },
    }),
  ]);

  const userIds = new Set<string>();
  for (const a of activities) if (a.userId) userIds.add(a.userId);
  for (const d of drafts) {
    const u = d.approvedByUserId ?? d.crmRecord.assignedToUserId;
    if (u) userIds.add(u);
  }
  const users = userIds.size
    ? await prisma.user.findMany({
        where: { id: { in: [...userIds] } },
        select: { id: true, name: true, email: true },
      })
    : [];
  const nameOf = (id: string | null) => {
    if (!id) return "Unattributed";
    const u = users.find((x) => x.id === id);
    return u?.name ?? u?.email ?? "Teammate";
  };

  const t30 = now.getTime() - 30 * DAY_MS;
  const t60 = now.getTime() - 60 * DAY_MS;
  const stageRank = new Map<string, number>(CRM_STAGES.map((s, i) => [s, i]));
  const wonIdx = stageRank.get("won")!;
  const lostIdx = stageRank.get("lost")!;
  const funnelStages = CRM_STAGES.filter((s) => s !== "lost");

  return businesses.map((b) => {
    const recs = records.filter((r) => r.businessId === b.id);
    const acts = activities.filter((a) => a.crmRecord.businessId === b.id);

    // Approved drafts count when approved; older ones (no approval time recorded)
    // fall back to when they were generated and the lead's owner.
    const sent: Event[] = [
      ...drafts
        .filter((d) => d.crmRecord.businessId === b.id && d.status === "approved")
        .map((d) => ({
          t: (d.approvedAt ?? d.createdAt).getTime(),
          userId: d.approvedByUserId ?? d.crmRecord.assignedToUserId,
        })),
      ...acts
        .filter((a) => SENT_ACTIVITY_KINDS.includes(a.kind))
        .map((a) => ({ t: a.occurredAt.getTime(), userId: a.userId })),
    ];

    // One reply per lead: the earliest reply signal.
    const firstReply = new Map<string, Event>();
    for (const a of acts) {
      const isReply =
        a.kind === REPLY_ACTIVITY_KIND ||
        (a.kind === STAGE_ACTIVITY_KIND && REPLIED_STAGES.includes(parseStageChange(a.body) ?? ""));
      if (!isReply) continue;
      const t = a.occurredAt.getTime();
      const prev = firstReply.get(a.crmRecordId);
      if (!prev || t < prev.t) firstReply.set(a.crmRecordId, { t, userId: a.userId });
    }
    const replies = [...firstReply.values()];

    const meetings = acts.filter((a) => a.kind === MEETING_ACTIVITY_KIND).map((a) => a.occurredAt.getTime());

    const bucketize = (sentEv: Event[], replyEv: Event[]): WeekBucket[] =>
      Array.from({ length: OUTREACH_WEEKS }, (_, i) => {
        const start = firstWeek + i * 7 * DAY_MS;
        const inWeek = (e: Event) => e.t >= start && e.t < start + 7 * DAY_MS;
        return {
          weekStart: new Date(start).toISOString(),
          sent: sentEv.filter(inWeek).length,
          replies: replyEv.filter(inWeek).length,
          partial: start === thisWeek,
        };
      });

    const weekly = bucketize(sent, replies);

    const peopleIds = [...new Set([...sent, ...replies].map((e) => e.userId ?? "unattributed"))];
    const people: OutreachPerson[] = peopleIds
      .map((pid) => {
        const uid = pid === "unattributed" ? null : pid;
        return {
          id: pid,
          name: nameOf(uid),
          weeks: bucketize(
            sent.filter((e) => e.userId === uid),
            replies.filter((e) => e.userId === uid)
          ),
        };
      })
      .sort((x, y) => {
        const total = (p: OutreachPerson) => p.weeks.reduce((n, w) => n + w.sent + w.replies, 0);
        return total(y) - total(x);
      });

    const sent30 = sent.filter((e) => e.t >= t30).length;
    const replies30 = replies.filter((e) => e.t >= t30).length;

    return {
      id: b.id,
      name: b.name,
      description: b.description,
      icon: b.icon,
      iconImage: b.iconImage,
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
      sentPrev30: sent.filter((e) => e.t >= t60 && e.t < t30).length,
      replies30,
      meetings30: meetings.filter((t) => t >= t30).length,
      meetingsThisWeek: meetings.filter((t) => t >= thisWeek).length,
      replyRate: sent30 > 0 ? Math.min(100, Math.round((replies30 / sent30) * 100)) : null,
      weekly,
      people,
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
