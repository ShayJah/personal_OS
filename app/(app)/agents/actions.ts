"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/dal";
import { isAgentsOwner, setDecision, type DecisionResult } from "@/lib/agents/board";

export async function decideAction(
  number: number,
  decision: "approved" | "rejected"
): Promise<DecisionResult> {
  const session = await requireSession();
  if (!isAgentsOwner(session.user.email)) {
    return { ok: false, error: "Not allowed." };
  }
  if (!Number.isInteger(number) || number < 1) {
    return { ok: false, error: "Invalid task." };
  }
  if (decision !== "approved" && decision !== "rejected") {
    return { ok: false, error: "Invalid decision." };
  }
  const result = await setDecision(number, decision);
  revalidatePath("/agents");
  return result;
}
