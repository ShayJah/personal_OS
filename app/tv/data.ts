import "server-only";
import { userToday } from "@/lib/user/preferences";
import { getPrioritiesForDate } from "@/lib/priorities";

export async function getPriorities(userId: string): Promise<string[]> {
  const rows = await getPrioritiesForDate(userId, await userToday(userId));
  return rows.slice(0, 3).map((p) => p.content);
}
