"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TaskForm, type ProjectOption } from "./task-form";
import { createTaskAction } from "./actions";

export function NewTaskForm({
  projects,
  defaultProjectId,
}: {
  projects: ProjectOption[];
  defaultProjectId?: string;
}) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <Button variant="ghost" onClick={() => setOpen(true)} className="w-fit">
        + New task
      </Button>
    );
  }

  return (
    <Card>
      <TaskForm
        action={createTaskAction}
        projects={projects}
        defaultProjectId={defaultProjectId}
        submitLabel="Add task"
        onDone={() => setOpen(false)}
      />
    </Card>
  );
}
