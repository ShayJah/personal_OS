"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/dal";
import { addActivitySchema, scheduleInterviewSchema } from "@/lib/validation/crm";
import { addActivity, scheduleInterview, type DraftChannel } from "@/lib/crm";
import { runResearchDraft } from "@/lib/agents/research-draft";

function revalidateRecordPath(businessId: string, crmRecordId: string) {
  revalidatePath(`/businesses/${businessId}/contacts/${crmRecordId}`);
}

export async function addActivityAction(
  businessId: string,
  crmRecordId: string,
  formData: FormData
) {
  const session = await requireSession();
  const body = addActivitySchema.parse({
    kind: formData.get("kind"),
    body: formData.get("body"),
  });

  await addActivity(session.user.id, crmRecordId, body);
  revalidateRecordPath(businessId, crmRecordId);
}

export async function scheduleInterviewAction(
  businessId: string,
  crmRecordId: string,
  formData: FormData
): Promise<{ meetLink: string | null } | { error: string }> {
  const session = await requireSession();
  try {
    const body = scheduleInterviewSchema.parse({
      startAt: formData.get("startAt"),
      durationMinutes: formData.get("durationMinutes") || undefined,
    });
    const endAt = new Date(body.startAt.getTime() + body.durationMinutes * 60_000);
    const result = await scheduleInterview(session.user.id, crmRecordId, {
      startAt: body.startAt,
      endAt,
    });
    revalidateRecordPath(businessId, crmRecordId);
    return result;
  } catch (error) {
    console.error("Schedule interview failed:", error);
    return { error: error instanceof Error ? error.message : "Failed to schedule interview." };
  }
}

export async function triggerResearchDraftAction(
  businessId: string,
  crmRecordId: string,
  channel: DraftChannel = "email"
) {
  const session = await requireSession();
  await runResearchDraft(session.user.id, crmRecordId, channel);
  revalidateRecordPath(businessId, crmRecordId);
}
