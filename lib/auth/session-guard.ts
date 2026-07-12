import "server-only";
import { Prisma } from "@prisma/client";
import { signOut } from "@/lib/auth/auth";

const FOREIGN_KEY_VIOLATION = "P2003";

export async function recoverFromOrphanedSession(error: unknown) {
  const isOrphanedSession =
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === FOREIGN_KEY_VIOLATION;

  if (!isOrphanedSession) throw error;

  await signOut({ redirectTo: "/login" });
}
