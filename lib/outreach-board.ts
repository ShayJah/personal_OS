import "server-only";
import { prisma } from "@/lib/db";
import { REPLIED_STAGES, STAGE_ACTIVITY_KIND } from "@/lib/crm-stages";
import { MEETING_ACTIVITY_KIND, REPLY_ACTIVITY_KIND, SENT_ACTIVITY_KINDS, isReplySignal } from "@/lib/business-stats";
import { colorForKey } from "@/lib/project-health";

const DAY_MS = 86_400_000;
const MAX_LEADS = 1500;
const CARDS_PER_COLUMN = 24;

export const BOARD_STAGES = [
  { key: "to_contact", label: "To contact" },
  { key: "drafted", label: "Drafted" },
  { key: "sent", label: "Sent" },
  { key: "replied", label: "Replied" },
  { key: "meeting", label: "Meeting" },
] as const;

export type BoardStageKey = (typeof BOARD_STAGES)[number]["key"];

export type OutreachCard = {
  id: string;
  href: string;
  title: string;
  subtitle: string | null;
  business: { id: string; name: string; color: string };
  meta: string;
  action: string | null;
  /** Sent a while ago with no reply yet. */
  stale: boolean;
};

export type OutreachColumn = { key: BoardStageKey; label: string; total: number; cards: OutreachCard[] };

export type OutreachBoard = {
  columns: OutreachColumn[];
  pendingDrafts: number;
  totalLeads: number;
  truncated: boolean;
};

function dayLabel(date: Date, now: Date): string {
  const days = Math.floor((startOfDay(now) - startOfDay(date)) / DAY_MS);
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days > 1 && days < 7) return `${days} days ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function startOfDay(d: Date): number {
  return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
}

/**
 * Sorts every open lead into a pipeline column from what the app records:
 * the furthest signal wins (meeting > replied > sent > drafted > to contact).
 * Won and lost leads are finished, so they stay off the board.
 */
export async function getOutreachBoard(businessIds: string[], colors: Map<string, string> = new Map()): Promise<OutreachBoard> {
  if (businessIds.length === 0) return { columns: BOARD_STAGES.map((s) => ({ ...s, total: 0, cards: [] })), pendingDrafts: 0, totalLeads: 0, truncated: false };

  const now = new Date();
  const records = await prisma.crmRecord.findMany({
    where: { businessId: { in: businessIds }, stage: { notIn: ["won", "lost"] } },
    orderBy: { updatedAt: "desc" },
    take: MAX_LEADS + 1,
    select: {
      id: true,
      stage: true,
      createdAt: true,
      lastTouchAt: true,
      nextAction: true,
      nextActionAt: true,
      business: { select: { id: true, name: true } },
      contact: { select: { name: true, role: true, company: true } },
      drafts: { select: { status: true, channel: true, createdAt: true, approvedAt: true } },
      activities: {
        where: { kind: { in: [...SENT_ACTIVITY_KINDS, REPLY_ACTIVITY_KIND, MEETING_ACTIVITY_KIND, STAGE_ACTIVITY_KIND] } },
        select: { kind: true, body: true, occurredAt: true },
        orderBy: { occurredAt: "desc" },
        take: 20,
      },
    },
  });

  const truncated = records.length > MAX_LEADS;
  const leads = truncated ? records.slice(0, MAX_LEADS) : records;

  const buckets: Record<BoardStageKey, { at: number; card: OutreachCard }[]> = {
    to_contact: [],
    drafted: [],
    sent: [],
    replied: [],
    meeting: [],
  };
  let pendingDrafts = 0;

  for (const r of leads) {
    const sentTimes = [
      ...r.drafts.filter((d) => d.status === "approved").map((d) => (d.approvedAt ?? d.createdAt).getTime()),
      ...r.activities.filter((a) => SENT_ACTIVITY_KINDS.includes(a.kind)).map((a) => a.occurredAt.getTime()),
    ];
    const pending = r.drafts.filter((d) => d.status === "pending");
    pendingDrafts += pending.length;

    const replyAt = r.activities.filter(isReplySignal).map((a) => a.occurredAt.getTime());
    const meetingAt = r.activities.filter((a) => a.kind === MEETING_ACTIVITY_KIND).map((a) => a.occurredAt.getTime());

    const inMeeting = r.stage === "interviewed" || r.stage === "proposal" || meetingAt.length > 0;
    const replied = REPLIED_STAGES.includes(r.stage) || replyAt.length > 0;
    const sent = sentTimes.length > 0 || r.stage === "contacted";

    let key: BoardStageKey;
    let at: number;
    let meta: string;
    let action: string | null = null;
    let stale = false;

    if (inMeeting) {
      key = "meeting";
      const upcoming = r.nextActionAt && r.nextActionAt.getTime() > now.getTime() ? r.nextActionAt : null;
      const when = upcoming ?? new Date(Math.max(...meetingAt, r.lastTouchAt?.getTime() ?? 0, r.createdAt.getTime()));
      at = upcoming ? upcoming.getTime() : when.getTime();
      meta = upcoming
        ? upcoming.toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
        : `Met ${dayLabel(when, now)}`;
    } else if (replied) {
      key = "replied";
      const t = replyAt.length ? Math.min(...replyAt) : (r.lastTouchAt ?? r.createdAt).getTime();
      at = t;
      meta = `Replied ${dayLabel(new Date(t), now)}`;
      action = "Reply";
    } else if (sent) {
      key = "sent";
      const t = sentTimes.length ? Math.max(...sentTimes) : (r.lastTouchAt ?? r.createdAt).getTime();
      at = t;
      meta = `Sent ${dayLabel(new Date(t), now)}`;
      if (now.getTime() - t >= 3 * DAY_MS) {
        stale = true;
        action = "Follow up";
      }
    } else if (pending.length > 0) {
      key = "drafted";
      at = Math.max(...pending.map((d) => d.createdAt.getTime()));
      meta = pending.some((d) => d.channel === "linkedin") && !pending.some((d) => d.channel !== "linkedin") ? "LinkedIn draft ready" : "Draft ready";
      action = "Review";
    } else {
      key = "to_contact";
      at = r.createdAt.getTime();
      meta = `Found ${dayLabel(r.createdAt, now)}`;
    }

    const role = [r.contact.role, r.contact.company].filter(Boolean).join(" · ");
    buckets[key].push({
      at,
      card: {
        id: r.id,
        href: `/businesses/${r.business.id}/contacts/${r.id}`,
        title: r.contact.name,
        subtitle: role || null,
        business: { id: r.business.id, name: r.business.name, color: colors.get(r.business.id) ?? colorForKey(r.business.id) },
        meta,
        action,
        stale,
      },
    });
  }

  const columns = BOARD_STAGES.map((s) => {
    const items = buckets[s.key];
    // Meetings: upcoming soonest-first, then past ones newest-first. Everything else most recent first.
    const nowT = now.getTime();
    items.sort((a, b) => {
      if (s.key !== "meeting") return b.at - a.at;
      const aUp = a.at >= nowT;
      const bUp = b.at >= nowT;
      if (aUp !== bUp) return aUp ? -1 : 1;
      return aUp ? a.at - b.at : b.at - a.at;
    });
    return { ...s, total: items.length, cards: items.slice(0, CARDS_PER_COLUMN).map((i) => i.card) };
  });

  return { columns, pendingDrafts, totalLeads: leads.length, truncated };
}
