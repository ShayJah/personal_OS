import "server-only";

export function isSlackConfigured(): boolean {
  return Boolean(process.env.SLACK_WEBHOOK_URL);
}

/** Posts a message to the team Slack channel via incoming webhook. Silently no-ops if unconfigured — never blocks the action that triggered it. */
export async function postToSlack(text: string): Promise<void> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) return;

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) {
      console.error(`Slack webhook failed: ${res.status} ${await res.text()}`);
    }
  } catch (error) {
    console.error("Slack webhook request failed:", error);
  }
}
