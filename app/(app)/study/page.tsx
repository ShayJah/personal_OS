import type { Metadata } from "next";
import { requireSession } from "@/lib/auth/dal";
import { StudyWorkspace } from "./study-workspace";

export const metadata: Metadata = { title: "Study" };

/**
 * Server-side gate: proxy.ts redirects anonymous visitors, and this page checks the
 * session again so protection does not depend on the proxy matcher alone.
 * The page itself ships no course data. Packs and progress are imported and kept in the browser.
 */
export default async function StudyPage() {
  const session = await requireSession();
  return <StudyWorkspace userId={session.user.id} />;
}
