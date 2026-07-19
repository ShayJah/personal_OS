import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { runAgenticTurn } from "@/agents/runtime";
import { AGENTS } from "@/agents/definitions";

interface DailyBriefPriority {
  title: string;
  why: string;
}

function parseBrief(text: string): DailyBriefPriority[] {
  try {
    const parsed = JSON.parse(text);
    if (!Array.isArray(parsed.priorities)) return [];
    return parsed.priorities
      .filter((p: unknown): p is DailyBriefPriority =>
        typeof p === "object" && p !== null && typeof (p as DailyBriefPriority).title === "string"
      )
      .slice(0, 5);
  } catch {
    return [];
  }
}

export async function runDailyBrief(userId: string) {
  const agent = AGENTS["daily-brief"];

  const { text } = await runAgenticTurn({
    userId,
    agent: agent.name,
    trigger: "schedule",
    model: agent.model,
    systemPrompt: agent.systemPrompt(""),
    toolNames: agent.toolNames,
    messages: [{ role: "user", content: "Propose today's priorities." }],
  });

  const priorities = parseBrief(text);
  if (priorities.length === 0) return null;

  return prisma.notification.create({
    data: {
      userId,
      kind: "daily_brief",
      title: "Today's suggested priorities",
      body: priorities.map((p) => p.title).join(" · "),
      payload: { priorities } as unknown as Prisma.InputJsonValue,
    },
  });
}

export async function runDailyBriefForAllUsers() {
  const users = await prisma.user.findMany({ select: { id: true } });
  const results = await Promise.allSettled(users.map((u) => runDailyBrief(u.id)));
  return {
    total: users.length,
    succeeded: results.filter((r) => r.status === "fulfilled").length,
    failed: results.filter((r) => r.status === "rejected").length,
  };
}
