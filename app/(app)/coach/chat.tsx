"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { sendCoachMessageAction } from "./actions";

export type CoachMessageData = {
  id: string;
  role: string;
  content: string;
};

export function Chat({ messages }: { messages: CoachMessageData[] }) {
  const formRef = useRef<HTMLFormElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  return (
    <div className="flex h-[calc(100vh-14rem)] flex-col">
      <div className="flex-1 space-y-3 overflow-y-auto pb-4">
        {messages.length === 0 && (
          <p className="py-10 text-center text-sm text-foreground/40">
            Ask your coach anything about your priorities, tasks, or how the
            week is going.
          </p>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={cn(
              "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm",
              m.role === "user"
                ? "ml-auto bg-foreground text-background"
                : "mr-auto bg-foreground/5"
            )}
          >
            <p className="whitespace-pre-wrap">{m.content}</p>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form
        ref={formRef}
        action={async (formData) => {
          setSending(true);
          await sendCoachMessageAction(formData);
          formRef.current?.reset();
          setSending(false);
        }}
        className="flex gap-2 border-t border-black/10 pt-3 dark:border-white/10"
      >
        <input
          name="content"
          placeholder="Message your coach..."
          required
          maxLength={4000}
          disabled={sending}
          className="min-w-0 flex-1 rounded-lg border border-black/10 bg-transparent px-3 py-2 text-sm dark:border-white/10"
        />
        <Button type="submit" disabled={sending}>
          {sending ? "Thinking..." : "Send"}
        </Button>
      </form>
    </div>
  );
}
