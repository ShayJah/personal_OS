import "server-only";
import { auth } from "@/lib/auth/auth";

export class UnauthorizedError extends Error {
  constructor() {
    super("Unauthorized");
  }
}

export async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new UnauthorizedError();
  return session.user.id;
}
