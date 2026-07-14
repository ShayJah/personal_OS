import "server-only";
import { prisma } from "@/lib/db";
import { getAnthropicClient, COACH_MODEL } from "@/lib/ai";
import { toDateOnly } from "@/lib/date";
import { addDays, startOfWeek } from "@/lib/calendar";

export type ReportType = "daily" | "weekly";

function periodFor(type: ReportType, referenceDate: Date) {
  if (type === "daily") {
    const day = toDateOnly(referenceDate);
    return { periodStart: day, periodEnd: day };
  }
  const start = startOfWeek(referenceDate);
  return { periodStart: start, periodEnd: addDays(start, 6) };
}

async function gatherStats(userId: string, periodStart: Date, periodEnd: Date) {
  const queryEnd = addDays(periodEnd, 1);

  const [completedTasks, createdTasks, habitLogs, priorities] =
    await Promise.all([
      prisma.task.findMany({
        where: {
          userId,
          completed: true,
          updatedAt: { gte: periodStart, lt: queryEnd },
        },
        select: { title: true },
      }),
      prisma.task.findMany({
        where: { userId, createdAt: { gte: periodStart, lt: queryEnd } },
        select: { title: true },
      }),
      prisma.habitLog.findMany({
        where: {
          userId,
          date: { gte: periodStart, lt: queryEnd },
          completed: true,
        },
        include: { habit: { select: { name: true } } },
      }),
      prisma.priority.findMany({
        where: { userId, date: { gte: periodStart, lt: queryEnd } },
        orderBy: [{ date: "asc" }, { order: "asc" }],
      }),
    ]);

  return { completedTasks, createdTasks, habitLogs, priorities };
}

function statsToPrompt(
  stats: Awaited<ReturnType<typeof gatherStats>>,
  type: ReportType
) {
  const lines: string[] = [];
  lines.push(
    stats.completedTasks.length > 0
      ? `Tasks completed: ${stats.completedTasks.map((t) => t.title).join("; ")}`
      : "No tasks were completed."
  );
  lines.push(
    stats.createdTasks.length > 0
      ? `Tasks created: ${stats.createdTasks.map((t) => t.title).join("; ")}`
      : "No new tasks were created."
  );
  lines.push(
    stats.habitLogs.length > 0
      ? `Habits checked in: ${stats.habitLogs.map((l) => l.habit.name).join("; ")}`
      : "No habits were checked in."
  );
  lines.push(
    stats.priorities.length > 0
      ? `Priorities set: ${stats.priorities.map((p) => p.content).join("; ")}`
      : "No priorities were set."
  );

  return `Generate a ${type} accountability report from this raw activity data:\n\n${lines.join("\n")}`;
}

const REPORT_SYSTEM_PROMPT = `You write short, honest accountability reports for a personal productivity app called PersonalOS. Format the report in markdown with these sections: a one-line headline, "Wins" (bulleted), "Priorities recap" (bulleted, only if priorities were set), "Habits" (one line), and a short "Looking ahead" note. Be factual and grounded only in the data given — never invent accomplishments. If little or nothing happened, say so plainly and encouragingly rather than padding the report. Keep it under 200 words.`;

export async function generateReport(
  userId: string,
  type: ReportType,
  referenceDate: Date = new Date()
) {
  const { periodStart, periodEnd } = periodFor(type, referenceDate);
  const stats = await gatherStats(userId, periodStart, periodEnd);
  const client = getAnthropicClient();

  const response = await client.messages.create({
    model: COACH_MODEL,
    max_tokens: 2048,
    system: REPORT_SYSTEM_PROMPT,
    messages: [{ role: "user", content: statsToPrompt(stats, type) }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  const content =
    textBlock && textBlock.type === "text"
      ? textBlock.text
      : "Report generation failed.";

  return prisma.report.upsert({
    where: { userId_type_periodStart: { userId, type, periodStart } },
    update: { content, periodEnd },
    create: { userId, type, periodStart, periodEnd, content },
  });
}

export async function listReports(userId: string) {
  return prisma.report.findMany({
    where: { userId },
    orderBy: { periodStart: "desc" },
    take: 20,
  });
}
