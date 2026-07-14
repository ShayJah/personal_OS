import "server-only";
import { prisma } from "@/lib/db";
import { getAnthropicClient, COACH_MODEL } from "@/lib/ai";
import { buildUserContext } from "@/lib/user-context";

const SYSTEM_PROMPT = `You are a calm, encouraging personal productivity coach inside an app called PersonalOS. Help the user plan their day, reflect on progress, and stay accountable to their priorities. Keep responses concise (a few sentences, or a short list) and grounded in the specific context provided below — reference actual task and project names when relevant rather than speaking generically. Do not invent tasks, priorities, or habits that aren't in the context.`;

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
  const client = getAnthropicClient();

  const response = await client.messages.create({
    model: COACH_MODEL,
    max_tokens: 1024,
    system: `${SYSTEM_PROMPT}\n\nCurrent user context:\n${context}`,
    messages: [
      ...history.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      { role: "user" as const, content },
    ],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  const replyText =
    textBlock && textBlock.type === "text"
      ? textBlock.text
      : "Sorry, I couldn't generate a response just now.";

  return prisma.coachMessage.create({
    data: { threadId: thread.id, role: "assistant", content: replyText },
  });
}
