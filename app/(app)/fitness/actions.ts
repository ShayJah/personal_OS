"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/dal";
import { logMetricSchema } from "@/lib/validation/metric";
import { logMetric } from "@/lib/metrics";

export async function logMetricAction(formData: FormData) {
  const session = await requireSession();
  const body = logMetricSchema.parse({
    kind: formData.get("kind"),
    value: Number(formData.get("value")),
    unit: formData.get("unit") || undefined,
    date: formData.get("date"),
  });

  await logMetric(session.user.id, body);
  revalidatePath("/fitness");
}
