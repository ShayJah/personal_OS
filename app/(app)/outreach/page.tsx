import { requireSession } from "@/lib/auth/dal";
import { listAccessibleBusinesses, listRecentDrafts } from "@/lib/crm";
import { isConnected as isGmailConnected } from "@/lib/gmail";
import { listActiveGoals } from "@/lib/goals";
import { withLiveProgress } from "@/lib/goal-progress";
import { isGoalMetric } from "@/lib/goal-pace";
import { getOutreachBoard } from "@/lib/outreach-board";
import { colorForKey } from "@/lib/project-health";
import type { OutreachGoal } from "./goal-strip";
import { OutreachView, type OutreachDraft } from "./outreach-view";

const RECENT_DRAFTS_LIMIT = 40;

export default async function OutreachPage({
  searchParams,
}: {
  searchParams: Promise<{ business?: string; view?: string }>;
}) {
  const session = await requireSession();
  const userId = session.user.id;
  const { business: businessParam, view: viewParam } = await searchParams;
  const view = viewParam === "drafts" ? "drafts" : "board";

  const [businesses, rawGoals] = await Promise.all([listAccessibleBusinesses(userId), listActiveGoals(userId)]);
  const selected = businesses.find((b) => b.id === businessParam) ?? null;
  const scopeIds = selected ? [selected.id] : businesses.map((b) => b.id);
  const colors = new Map(businesses.map((b) => [b.id, colorForKey(b.id)]));

  const [board, goals, drafts, gmailConnected] = await Promise.all([
    getOutreachBoard(scopeIds, colors),
    withLiveProgress(
      userId,
      rawGoals.map((g) => ({
        ...g,
        targetValue: g.targetValue ? Number(g.targetValue) : null,
        currentValue: g.currentValue ? Number(g.currentValue) : null,
      }))
    ),
    view === "drafts" ? listRecentDrafts(userId, RECENT_DRAFTS_LIMIT) : Promise.resolve([]),
    view === "drafts" ? isGmailConnected(userId) : Promise.resolve(false),
  ]);

  // The goal this page reports against: an auto-tracked outreach goal, sends first, then the shortest horizon.
  const tracked = goals
    .filter((g) => isGoalMetric(g.metric) && g.pace && g.targetValue)
    .sort((a, b) => Number(b.metric === "sends") - Number(a.metric === "sends") || (a.horizon === "quarter" ? -1 : 1))[0];
  const goal: OutreachGoal | null =
    tracked && tracked.metric && tracked.pace && tracked.targetValue
      ? {
          id: tracked.id,
          title: tracked.title,
          area: tracked.area,
          horizon: tracked.horizon,
          metric: tracked.metric,
          current: tracked.liveCurrent ?? 0,
          target: tracked.targetValue,
          pace: tracked.pace,
        }
      : null;

  const draftItems: OutreachDraft[] = (selected ? drafts.filter((d) => d.crmRecord.businessId === selected.id) : drafts).map((d) => ({
    id: d.id,
    channel: d.channel,
    subject: d.subject,
    body: d.body,
    researchNotes: d.researchNotes,
    status: d.status,
    gmailDraftId: d.gmailDraftId,
    crmRecordId: d.crmRecordId,
    businessId: d.crmRecord.businessId,
    businessName: d.crmRecord.business.name,
    contactName: d.crmRecord.contact.name,
    recipientEmail: d.crmRecord.contact.email,
  }));

  return (
    <OutreachView
      view={view}
      businesses={businesses.map((b) => ({ id: b.id, name: b.name, color: colors.get(b.id)! }))}
      selectedId={selected?.id ?? null}
      board={board}
      goal={goal}
      drafts={draftItems}
      gmailConnected={gmailConnected}
    />
  );
}
