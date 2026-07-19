import "server-only";
import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | null = null;

export class AiNotConfiguredError extends Error {
  constructor() {
    super("ANTHROPIC_API_KEY is not set — AI features are disabled.");
  }
}

export function isAiEnabled(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

export function getAnthropicClient(): Anthropic {
  if (!isAiEnabled()) throw new AiNotConfiguredError();
  if (!client) client = new Anthropic();
  return client;
}

export const COACH_MODEL = "claude-haiku-4-5";

// Approximate Haiku-class pricing (USD per million tokens) — used only to
// populate AgentRun.costUsd for a rough running total, not billing-accurate.
const HAIKU_INPUT_PER_MTOK = 1;
const HAIKU_OUTPUT_PER_MTOK = 5;

export function estimateCostUsd(inputTokens: number, outputTokens: number): number {
  return (
    (inputTokens / 1_000_000) * HAIKU_INPUT_PER_MTOK +
    (outputTokens / 1_000_000) * HAIKU_OUTPUT_PER_MTOK
  );
}
