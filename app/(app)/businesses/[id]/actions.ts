"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/dal";
import {
  addLeadSchema,
  updateStageSchema,
  updateContextDocSchema,
  updateSheetLinkSchema,
  assignOwnerSchema,
  updateSharedCalendarSchema,
  updateBusinessIconSchema,
} from "@/lib/validation/crm";
import {
  addLead,
  updateCrmStage,
  updateBusinessContextDoc,
  updateBusinessSheetLink,
  importLeadsFromSheet,
  assignCrmRecordOwner,
  updateBusinessSharedCalendar,
  updateBusinessIcon,
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

export async function assignOwnerAction(businessId: string, crmRecordId: string, assignedToUserId: string) {
  const session = await requireSession();
  const body = assignOwnerSchema.parse({ assignedToUserId: assignedToUserId || null });
  await assignCrmRecordOwner(session.user.id, crmRecordId, body.assignedToUserId);
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

export async function updateSharedCalendarAction(businessId: string, formData: FormData) {
  const session = await requireSession();
  const body = updateSharedCalendarSchema.parse({
    sharedCalendarId: formData.get("sharedCalendarId"),
  });
  await updateBusinessSharedCalendar(session.user.id, businessId, body.sharedCalendarId);
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

export async function updateBusinessIconAction(
  businessId: string,
  change: { icon?: string | null; image?: string | null }
) {
  const session = await requireSession();
  const body = updateBusinessIconSchema.parse({
    icon: change.icon === undefined ? undefined : change.icon || null,
    image: change.image,
  });
  await updateBusinessIcon(session.user.id, businessId, { icon: body.icon, iconImage: body.image });
  revalidatePath(`/businesses/${businessId}`);
  revalidatePath("/businesses");
}
