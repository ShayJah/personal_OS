"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { acceptDailyBrief, dismissNotification } from "./actions";

interface BriefPriority {
  title: string;
  why: string;
}

interface NotificationItem {
  id: string;
  title: string;
  payload: { priorities?: BriefPriority[] } | null;
}

export function NotificationsCard({ notifications }: { notifications: NotificationItem[] }) {
  const [isPending, startTransition] = useTransition();
  const [handledIds, setHandledIds] = useState<string[]>([]);

  const visible = notifications.filter((n) => !handledIds.includes(n.id));
  if (visible.length === 0) return null;

  function handle(id: string, action: (id: string) => Promise<void>) {
    startTransition(async () => {
      await action(id);
      setHandledIds((ids) => [...ids, id]);
    });
  }

  return (
    <section
      aria-label="Suggestions"
      className="space-y-4 rounded-2xl border border-accent/20 bg-accent-soft/60 p-4 sm:p-5"
    >
      {visible.map((notification) => {
        const priorities = notification.payload?.priorities ?? [];
        return (
          <div key={notification.id} className="space-y-2">
            <p className="eyebrow !text-accent">Suggested by Amahoro</p>
            <p className="text-sm font-medium">{notification.title}</p>
            <ul className="space-y-1 text-sm text-muted">
              {priorities.map((p, i) => (
                <li key={i}>
                  <span className="text-foreground">{p.title}</span>
                  {p.why ? ` — ${p.why}` : ""}
                </li>
              ))}
            </ul>
            <div className="flex gap-2 pt-1">
              <Button size="sm" disabled={isPending} onClick={() => handle(notification.id, acceptDailyBrief)}>
                Set as my Top 3
              </Button>
              <Button
                size="sm"
                variant="ghost"
                disabled={isPending}
                onClick={() => handle(notification.id, dismissNotification)}
              >
                Dismiss
              </Button>
            </div>
          </div>
        );
      })}
    </section>
  );
}
