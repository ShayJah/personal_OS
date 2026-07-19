import "server-only";
import type Anthropic from "@anthropic-ai/sdk";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getAnthropicClient, estimateCostUsd } from "@/lib/ai";
import { toolDefinitions, executeTool } from "@/agents/tools";

const MAX_STEPS = 4;

export interface AgentTurnInput {
  userId: string;
  agent: string;
  trigger: "chat" | "schedule" | "manual";
  model: string;
  systemPrompt: string;
  toolNames: string[];
  extraTools?: Anthropic.ToolUnion[];
  messages: Anthropic.MessageParam[];
  maxTokens?: number;
}

export interface AgentTurnResult {
  text: string;
  agentRunId: string;
}

export async function runAgenticTurn(input: AgentTurnInput): Promise<AgentTurnResult> {
  const { userId, agent, trigger, model, systemPrompt, toolNames, extraTools, messages, maxTokens = 1024 } =
    input;

  const run = await prisma.agentRun.create({
    data: { userId, agent, trigger, status: "running" },
  });

  const client = getAnthropicClient();
  const tools: Anthropic.ToolUnion[] = [...toolDefinitions(toolNames), ...(extraTools ?? [])];
  const conversation: Anthropic.MessageParam[] = [...messages];
  const toolTrace: Array<{ tool: string; input: unknown; output: unknown }> = [];
  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  let totalWebSearchRequests = 0;
  let finalText = "";

  try {
    for (let step = 0; step < MAX_STEPS; step++) {
      const response = await client.messages.create({
        model,
        max_tokens: maxTokens,
        system: systemPrompt,
        tools,
        messages: conversation,
      });

      totalInputTokens += response.usage.input_tokens;
      totalOutputTokens += response.usage.output_tokens;
      totalWebSearchRequests += response.usage.server_tool_use?.web_search_requests ?? 0;

      const toolUseBlocks = response.content.filter(
        (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
      );

      if (toolUseBlocks.length === 0) {
        const textBlock = response.content.find((b) => b.type === "text");
        finalText =
          textBlock && textBlock.type === "text"
            ? textBlock.text
            : "Sorry, I couldn't generate a response just now.";
        break;
      }

      conversation.push({ role: "assistant", content: response.content });

      const toolResults: Anthropic.ToolResultBlockParam[] = [];
      for (const block of toolUseBlocks) {
        const output = await executeTool(
          block.name,
          userId,
          (block.input ?? {}) as Record<string, unknown>
        );
        toolTrace.push({ tool: block.name, input: block.input, output });
        toolResults.push({
          type: "tool_result",
          tool_use_id: block.id,
          content: JSON.stringify(output),
        });
      }

      conversation.push({ role: "user", content: toolResults });

      if (step === MAX_STEPS - 1) {
        finalText = "I looked into this but couldn't finish in time — try asking again, more specifically.";
      }
    }

    await prisma.agentRun.update({
      where: { id: run.id },
      data: {
        status: "done",
        output: { text: finalText },
        toolTrace: toolTrace as unknown as Prisma.InputJsonValue,
        costUsd: estimateCostUsd(totalInputTokens, totalOutputTokens, totalWebSearchRequests, model),
        finishedAt: new Date(),
      },
    });

    return { text: finalText, agentRunId: run.id };
  } catch (error) {
    await prisma.agentRun.update({
      where: { id: run.id },
      data: {
        status: "error",
        toolTrace: toolTrace as unknown as Prisma.InputJsonValue,
        costUsd: estimateCostUsd(totalInputTokens, totalOutputTokens, totalWebSearchRequests, model),
        finishedAt: new Date(),
      },
    });
    throw error;
  }
}
