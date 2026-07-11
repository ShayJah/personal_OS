import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";

export const requireSession = cache(async () => {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  return session;
});
