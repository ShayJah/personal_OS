import "server-only";
import { prisma } from "@/lib/db";

/** Daily dollar cap shown on /home and enforced by the home-digest cron. Rough, from AgentRun.costUsd. */
export const DAILY_USD_CAP = Number(process.env.AI_DAILY_USD_CAP ?? "1");

export async function spendLast24h(userId: string): Promise<number> {
  const since = new Date(Date.now() - 24 * 3600_000);
  const { _sum } = await prisma.agentRun.aggregate({ where: { userId, startedAt: { gte: since } }, _sum: { costUsd: true } });
  return Number(_sum.costUsd ?? 0);
}

export async function isOverDailySpendCap(userId: string) {
  return (await spendLast24h(userId)) >= DAILY_USD_CAP;
}
