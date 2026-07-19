import "server-only";
import { prisma } from "@/lib/db";
import { buildUserContext } from "@/lib/user-context";
import { runAgenticTurn } from "@/agents/runtime";
import { AGENTS } from "@/agents/definitions";

export async function getOrCreateThread(userId: string) {
  let thread = await prisma.coachThread.findFirst({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });
  if (!thread) {
    thread = await prisma.coachThread.create({ data: { userId } });
  }
  return thread;
}

export async function listThreadMessages(userId: string) {
  const thread = await getOrCreateThread(userId);
  return prisma.coachMessage.findMany({
    where: { threadId: thread.id },
    orderBy: { createdAt: "asc" },
  });
}

export async function sendCoachMessage(userId: string, content: string) {
  const thread = await getOrCreateThread(userId);
  const history = await prisma.coachMessage.findMany({
    where: { threadId: thread.id },
    orderBy: { createdAt: "asc" },
  });

  await prisma.coachMessage.create({
    data: { threadId: thread.id, role: "user", content },
  });

  const context = await buildUserContext(userId);
  const coach = AGENTS.coach;

  const { text: replyText } = await runAgenticTurn({
    userId,
    agent: coach.name,
    trigger: "chat",
    model: coach.model,
    systemPrompt: coach.systemPrompt(context),
    toolNames: coach.toolNames,
    messages: [
      ...history.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      { role: "user" as const, content },
    ],
  });

  return prisma.coachMessage.create({
    data: { threadId: thread.id, role: "assistant", content: replyText },
  });
}
