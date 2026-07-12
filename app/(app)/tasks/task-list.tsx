import { Card } from "@/components/ui/card";
import { TaskRow, type TaskRowData } from "./task-row";
import type { ProjectOption } from "./task-form";

export function TaskList({
  tasks,
  projects,
  emptyMessage = "No tasks here.",
}: {
  tasks: TaskRowData[];
  projects: ProjectOption[];
  emptyMessage?: string;
}) {
  if (tasks.length === 0) {
    return (
      <Card className="py-10 text-center text-sm text-foreground/40">
        {emptyMessage}
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {tasks.map((task) => (
        <TaskRow key={task.id} task={task} projects={projects} />
      ))}
    </div>
  );
}
