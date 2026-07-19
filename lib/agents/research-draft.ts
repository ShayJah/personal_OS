import "server-only";
import { runAgenticTurn } from "@/agents/runtime";
import { AGENTS } from "@/agents/definitions";

export async function runResearchDraft(userId: string, crmRecordId: string) {
  const agent = AGENTS["research-draft"];

  return runAgenticTurn({
    userId,
    agent: agent.name,
    trigger: "manual",
    model: agent.model,
    systemPrompt: agent.systemPrompt(""),
    toolNames: agent.toolNames,
    extraTools: agent.extraTools,
    messages: [
      {
        role: "user",
        content: `Research and draft a personalized outreach email for CRM record ${crmRecordId}.`,
      },
    ],
  });
}
