import "server-only";
import { prisma } from "@/lib/db";

/**
 * CRM follow-ups that are due (or overdue) by `before`, across every business
 * the user owns or collaborates on. Mirrors the access rule in lib/crm.ts.
 */
export async function listDueFollowUps(userId: string, before: Date, take = 4) {
  const where = {
    nextActionAt: { lt: before },
    stage: { notIn: ["won", "lost"] },
    business: { OR: [{ userId }, { collaborators: { some: { userId } } }] },
  };

  const [total, records] = await Promise.all([
    prisma.crmRecord.count({ where }),
    prisma.crmRecord.findMany({
      where,
      orderBy: { nextActionAt: "asc" },
      take,
      include: {
        contact: { select: { name: true } },
        business: { select: { id: true, name: true } },
      },
    }),
  ]);

  return { total, records };
}
