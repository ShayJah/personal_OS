import { timingSafeEqual } from "node:crypto";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { parseDigest, DIGEST_TYPE } from "@/lib/agents/home-digest";
import { spendLast24h, DAILY_USD_CAP } from "@/lib/home";
import { TvSlides, type Slide } from "./tv-slides";

export const dynamic = "force-dynamic";
// The link carries a secret: keep it out of search results and Referer headers.
export const metadata: Metadata = { title: "Amahoro TV", robots: { index: false }, referrer: "no-referrer" };

function validKey(key: string | undefined) {
  const secret = process.env.TV_TOKEN;
  if (!secret || !key) return false; // unset secret must never match
  const a = Buffer.from(key);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Projector screen: read-only, WORK ITEMS ONLY (no priorities, contacts, money details or personal notes). */
export default async function TvPage({ searchParams }: { searchParams: Promise<{ key?: string }> }) {
  if (!validKey((await searchParams).key)) notFound();

  const email = process.env.TV_USER_EMAIL;
  const user = email ? await prisma.user.findUnique({ where: { email }, select: { id: true } }) : null;
  if (!user) notFound();

  const since = new Date(Date.now() - 86_400_000);
  const [digest, runs, pendingDrafts, spend] = await Promise.all([
    prisma.report.findFirst({ where: { userId: user.id, type: DIGEST_TYPE }, orderBy: { periodStart: "desc" } }),
    prisma.agentRun.count({ where: { userId: user.id, startedAt: { gte: since } } }),
    prisma.emailDraft.count({ where: { status: "pending", crmRecord: { business: { userId: user.id } } } }),
    spendLast24h(user.id),
  ]);

  const slides: Slide[] = (digest ? parseDigest(digest.content) : []).map((i) => ({
    eyebrow: "Shipped this week",
    title: i.title,
    body: i.line,
  }));
  slides.push({
    eyebrow: "Agents",
    title: `${runs} ${runs === 1 ? "run" : "runs"} in 24h`,
    body: `${pendingDrafts} ${pendingDrafts === 1 ? "draft waits" : "drafts wait"} for approval · spend $${spend.toFixed(2)} of $${DAILY_USD_CAP.toFixed(2)}`,
  });

  return <TvSlides slides={slides} />;
}
