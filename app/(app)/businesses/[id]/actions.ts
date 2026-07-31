"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/dal";
import {
  addLeadSchema,
  updateStageSchema,
  updateContextDocSchema,
  updateSheetLinkSchema,
} from "@/lib/validation/crm";
import {
  addLead,
  updateCrmStage,
  updateBusinessContextDoc,
  updateBusinessSheetLink,
  importLeadsFromSheet,
  type SheetImportResult,
} from "@/lib/crm";

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

export async function updateSheetLinkAction(businessId: string, formData: FormData) {
  const session = await requireSession();
  const body = updateSheetLinkSchema.parse({
    crmSheetUrl: formData.get("crmSheetUrl"),
    crmSheetTab: formData.get("crmSheetTab") || undefined,
  });
  await updateBusinessSheetLink(session.user.id, businessId, body);
  revalidatePath(`/businesses/${businessId}`);
}

export async function importFromSheetAction(
  businessId: string
): Promise<SheetImportResult | { error: string }> {
  const session = await requireSession();
  try {
    const result = await importLeadsFromSheet(session.user.id, businessId);
    revalidatePath(`/businesses/${businessId}`);
    return result;
  } catch (error) {
    // Thrown errors from Server Actions get their message redacted by
    // Next.js in production — return the message as data instead so it
    // actually reaches the UI.
    console.error("Sheet import failed:", error);
    return { error: error instanceof Error ? error.message : "Import failed." };
  }
}
