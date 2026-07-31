"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { quickAddTask } from "./actions";

export function QuickActionsCard() {
  const formRef = useRef<HTMLFormElement>(null);
  const [adding, setAdding] = useState(false);

  return (
    <Card>
      <p className="eyebrow">Quick actions</p>

      <form
        ref={formRef}
        action={async (formData) => {
          setAdding(true);
          await quickAddTask(formData);
          formRef.current?.reset();
          setAdding(false);
        }}
        className="mt-3 flex gap-2"
      >
        <input
          name="title"
          placeholder="Add a task..."
          required
          maxLength={300}
          className="min-w-0 flex-1 px-3 py-2 text-sm"
        />
        <Button type="submit" disabled={adding}>
          {adding ? "Adding..." : "Add"}
        </Button>
      </form>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href="/tasks"
          className="rounded-md px-2.5 py-1.5 text-sm text-muted hover:bg-foreground/5 hover:text-foreground"
        >
          View all tasks →
        </Link>
        <Link
          href="/projects"
          className="rounded-md px-2.5 py-1.5 text-sm text-muted hover:bg-foreground/5 hover:text-foreground"
        >
          View projects →
        </Link>
      </div>
    </Card>
  );
}
