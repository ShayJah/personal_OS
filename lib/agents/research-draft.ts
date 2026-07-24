import "server-only";
import { runAgenticTurn } from "@/agents/runtime";
import { AGENTS } from "@/agents/definitions";
import type { DraftChannel } from "@/lib/crm";

export async function runResearchDraft(
  userId: string,
  crmRecordId: string,
  channel: DraftChannel = "email",
  trigger: "manual" | "schedule" = "manual"
) {
  const agent = AGENTS["research-draft"];
  const channelLabel = channel === "linkedin" ? "LinkedIn message" : "email";

  return runAgenticTurn({
    userId,
    agent: agent.name,
    trigger,
    model: agent.model,
    systemPrompt: agent.systemPrompt(""),
    toolNames: agent.toolNames,
    extraTools: agent.extraTools,
    messages: [
      {
        role: "user",
        content: `Research and draft a personalized outreach ${channelLabel} for CRM record ${crmRecordId}. Use channel "${channel}" when calling create_email_draft.`,
      },
    ],
  });
}
