"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EventForm, type TaskOption } from "./event-form";
import { createEventAction } from "./actions";

export function NewEventForm({
  tasks,
  defaultStart,
}: {
  tasks: TaskOption[];
  defaultStart?: Date;
}) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <Button variant="ghost" onClick={() => setOpen(true)} className="w-fit">
        + New event
      </Button>
    );
  }

  return (
    <Card>
      <EventForm
        action={createEventAction}
        tasks={tasks}
        defaultStart={defaultStart}
        submitLabel="Add event"
        onDone={() => setOpen(false)}
      />
    </Card>
  );
}
