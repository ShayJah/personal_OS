import { requireSession } from "@/lib/auth/dal";
import { isAiEnabled } from "@/lib/ai";
import { listThreadMessages } from "@/lib/coach";
import { Card } from "@/components/ui/card";
import { Chat } from "./chat";

export default async function CoachPage() {
  const session = await requireSession();

  if (!isAiEnabled()) {
    return (
      <Card className="py-10 text-center">
        <h1 className="font-serif text-2xl">AI Coach</h1>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
          Add an <code className="rounded bg-foreground/10 px-1">ANTHROPIC_API_KEY</code> to{" "}
          <code className="rounded bg-foreground/10 px-1">.env.local</code> to
          enable the AI coach.
        </p>
      </Card>
    );
  }

  const messages = await listThreadMessages(session.user.id);

  return (
    <div className="space-y-4">
      <div>
        <p className="eyebrow">Talk it through</p>
        <h1 className="mt-1 font-serif text-3xl">Coach</h1>
        <p className="mt-1 text-sm text-muted">
          Grounded in your actual tasks, projects, and priorities.
        </p>
      </div>
      <Chat
        messages={messages.map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
        }))}
      />
    </div>
  );
}
