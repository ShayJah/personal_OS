import "server-only";
import { prisma } from "@/lib/db";

const DAILY_RUN_LIMIT = 100;

export class AiLimitError extends Error {
  constructor() {
    super("Daily AI usage limit reached — try again tomorrow.");
  }
}

/**
 * Caps agent runs per user per rolling 24h so one account can't run up the Anthropic bill.
 * Call it after the run row exists: the count includes this run, so parallel requests can't all slip under the cap.
 */
export async function enforceDailyAiLimit(userId: string, runId: string) {
  const since = new Date(Date.now() - 24 * 3600_000);
  const runs = await prisma.agentRun.count({ where: { userId, startedAt: { gte: since } } });
  if (runs > DAILY_RUN_LIMIT) {
    await prisma.agentRun.delete({ where: { id: runId } });
    throw new AiLimitError();
  }
}
