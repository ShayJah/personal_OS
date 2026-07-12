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
      <h2 className="text-sm font-medium text-foreground/60">
        Quick actions
      </h2>

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
          className="min-w-0 flex-1 rounded-lg border border-black/10 bg-transparent px-3 py-2 text-sm dark:border-white/10"
        />
        <Button type="submit" disabled={adding}>
          {adding ? "Adding..." : "Add"}
        </Button>
      </form>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href="/tasks"
          className="rounded-md px-2.5 py-1.5 text-sm text-foreground/60 hover:bg-foreground/5 hover:text-foreground"
        >
          View all tasks →
        </Link>
        <Link
          href="/projects"
          className="rounded-md px-2.5 py-1.5 text-sm text-foreground/60 hover:bg-foreground/5 hover:text-foreground"
        >
          View projects →
        </Link>
      </div>
    </Card>
  );
}
