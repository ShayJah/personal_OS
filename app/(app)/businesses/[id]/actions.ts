"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/dal";
import { addLeadSchema, updateStageSchema, updateContextDocSchema } from "@/lib/validation/crm";
import { addLead, updateCrmStage, updateBusinessContextDoc } from "@/lib/crm";

export async function addLeadAction(businessId: string, formData: FormData) {
  const session = await requireSession();
  const body = addLeadSchema.parse({
    name: formData.get("name"),
    email: formData.get("email") || undefined,
    company: formData.get("company") || undefined,
  });

  await addLead(session.user.id, businessId, body);
  revalidatePath(`/businesses/${businessId}`);
}

export async function updateStageAction(businessId: string, crmRecordId: string, stage: string) {
  const session = await requireSession();
  const body = updateStageSchema.parse({ stage });
  await updateCrmStage(session.user.id, crmRecordId, body.stage);
  revalidatePath(`/businesses/${businessId}`);
}

export async function updateBusinessNoteAction(businessId: string, contextDoc: string) {
  const session = await requireSession();
  const body = updateContextDocSchema.parse({ contextDoc });
  await updateBusinessContextDoc(session.user.id, businessId, body.contextDoc);
  revalidatePath(`/businesses/${businessId}`);
}
