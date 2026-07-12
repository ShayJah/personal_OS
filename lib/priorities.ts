import "server-only";
import { prisma } from "@/lib/db";

export async function getPrioritiesForDate(userId: string, date: Date) {
  return prisma.priority.findMany({
    where: { userId, date },
    orderBy: { order: "asc" },
  });
}

export async function setPrioritiesForDate(
  userId: string,
  date: Date,
  items: string[]
) {
  return prisma.$transaction(async (tx) => {
    await tx.priority.deleteMany({ where: { userId, date } });
    if (items.length === 0) return [];
    await tx.priority.createMany({
      data: items.map((content, index) => ({
        userId,
        date,
        content,
        order: index,
      })),
    });
    return tx.priority.findMany({
      where: { userId, date },
      orderBy: { order: "asc" },
    });
  });
}
