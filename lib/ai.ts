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
