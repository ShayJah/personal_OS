"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/dal";
import { setDraftStatus } from "@/lib/crm";

// Shared by both the per-contact page and the /outreach batch feed, since a
// draft's approve/dismiss buttons can be clicked from either place.
export async function setDraftStatusAction(
  businessId: string,
  crmRecordId: string,
  draftId: string,
  status: "approved" | "dismissed"
) {
  const session = await requireSession();
  await setDraftStatus(session.user.id, draftId, status);
  revalidatePath(`/businesses/${businessId}/contacts/${crmRecordId}`);
  revalidatePath("/outreach");
}
