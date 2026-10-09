import "server-only";
import { prisma } from "@/lib/db";

const DAILY_RUN_LIMIT = 100;

export class AiLimitError extends Error {
  constructor() {
    super("Daily AI usage limit reached — try again tomorrow.");
  }
}

/** Caps agent runs per user per rolling 24h so one account can't run up the Anthropic bill. */
export async function enforceDailyAiLimit(userId: string) {
  const since = new Date(Date.now() - 24 * 3600_000);
  const runs = await prisma.agentRun.count({ where: { userId, startedAt: { gte: since } } });
  if (runs >= DAILY_RUN_LIMIT) throw new AiLimitError();
}
