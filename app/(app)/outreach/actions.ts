"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/dal";
import { runMorningOutreach } from "@/lib/agents/morning-outreach";

export async function triggerOutreachBatchAction() {
  const session = await requireSession();
  const notification = await runMorningOutreach(session.user.id);
  revalidatePath("/outreach");

  if (!notification) return { ranForLeads: 0 };
  const payload = notification.payload as {
    emailDrafted?: number;
    emailPushedToGmail?: number;
    linkedinDrafted?: number;
  } | null;
  return {
    ranForLeads: (payload?.emailDrafted ?? 0),
    emailPushedToGmail: payload?.emailPushedToGmail ?? 0,
    linkedinDrafted: payload?.linkedinDrafted ?? 0,
  };
}
