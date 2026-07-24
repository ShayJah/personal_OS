"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/dal";
import { addActivitySchema } from "@/lib/validation/crm";
import { addActivity, setDraftStatus, type DraftChannel } from "@/lib/crm";
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

export async function triggerResearchDraftAction(
  businessId: string,
  crmRecordId: string,
  channel: DraftChannel = "email"
) {
  const session = await requireSession();
  await runResearchDraft(session.user.id, crmRecordId, channel);
  revalidateRecordPath(businessId, crmRecordId);
}

export async function setDraftStatusAction(
  businessId: string,
  crmRecordId: string,
  draftId: string,
  status: "approved" | "dismissed"
) {
  const session = await requireSession();
  await setDraftStatus(session.user.id, draftId, status);
  revalidateRecordPath(businessId, crmRecordId);
}
