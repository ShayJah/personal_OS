"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/dal";
import { createBusinessSchema } from "@/lib/validation/crm";
import { createBusiness } from "@/lib/crm";

export async function createBusinessAction(formData: FormData) {
  const session = await requireSession();
  const body = createBusinessSchema.parse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
  });

  await createBusiness(session.user.id, body);
  revalidatePath("/businesses");
}
