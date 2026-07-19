"use client";

import { useState, useTransition } from "react";
import { Card } from "@/components/ui/card";
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

  return (
    <Card>
      <p className="eyebrow">Suggestions</p>
      <div className="mt-3 space-y-4">
        {visible.map((notification) => {
          const priorities = notification.payload?.priorities ?? [];
          return (
            <div key={notification.id} className="space-y-2">
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
                <Button
                  size="sm"
                  disabled={isPending}
                  onClick={() =>
                    startTransition(async () => {
                      await acceptDailyBrief(notification.id);
                      setHandledIds((ids) => [...ids, notification.id]);
                    })
                  }
                >
                  Accept all
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={isPending}
                  onClick={() =>
                    startTransition(async () => {
                      await dismissNotification(notification.id);
                      setHandledIds((ids) => [...ids, notification.id]);
                    })
                  }
                >
                  Dismiss
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
