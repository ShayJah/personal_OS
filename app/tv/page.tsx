import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { parseDigest, DIGEST_TYPE } from "@/lib/agents/home-digest";
import { spendLast24h, DAILY_USD_CAP } from "@/lib/home";
import { getPriorities } from "./data";
import { validTvKey, getTvUserId, getPins, PLANNER_START } from "@/lib/tv";
import { TvWall } from "./tv-wall";

export const dynamic = "force-dynamic";
// The link carries a secret: keep it out of search results and Referer headers.
export const metadata: Metadata = { title: "Amahoro TV", robots: { index: false }, referrer: "no-referrer" };

/** Projector wall: read-only. Event TITLES never render on the wall, only counts; titles appear only as a spoken answer. */
export default async function TvPage({ searchParams }: { searchParams: Promise<{ key?: string }> }) {
  const key = (await searchParams).key;
  if (!validTvKey(key)) notFound();
  const userId = await getTvUserId();
  if (!userId) notFound();

  const { year, month } = PLANNER_START;
  const from = new Date(Date.UTC(year, month - 1, 1));
  const to = new Date(Date.UTC(year, month + 3, 1));
  const since = new Date(Date.now() - 86_400_000);

  const [events, pins, digest, stages, runs, drafts, spend, priorities] = await Promise.all([
    prisma.calendarEvent.findMany({ where: { userId, startAt: { gte: from, lt: to } }, select: { startAt: true } }),
    getPins(userId),
    prisma.report.findFirst({ where: { userId, type: DIGEST_TYPE }, orderBy: { periodStart: "desc" } }),
    prisma.crmRecord.groupBy({ by: ["stage"], where: { business: { userId } }, _count: true }),
    prisma.agentRun.count({ where: { userId, startedAt: { gte: since } } }),
    prisma.emailDraft.count({ where: { status: "pending", crmRecord: { business: { userId } } } }),
    spendLast24h(userId),
    getPriorities(userId),
  ]);

  const eventCounts: Record<string, number> = {};
  for (const e of events) {
    const d = e.startAt.toISOString().slice(0, 10);
    eventCounts[d] = (eventCounts[d] ?? 0) + 1;
  }

  return (
    <TvWall
      tvKey={key!}
      year={year}
      month={month}
      eventCounts={eventCounts}
      pins={pins}
      priorities={priorities}
      pipeline={stages.map((s) => ({ stage: s.stage, count: s._count }))}
      shipped={(digest ? parseDigest(digest.content) : []).slice(0, 3)}
      agents={`${runs} runs · ${drafts} ${drafts === 1 ? "draft" : "drafts"} waiting · $${spend.toFixed(2)}/$${DAILY_USD_CAP.toFixed(2)}`}
    />
  );
}
