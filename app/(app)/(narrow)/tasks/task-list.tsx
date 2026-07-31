import { EmptyState } from "@/components/ui/empty-state";
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
    return <EmptyState title={emptyMessage} />;
  }

  return (
    <div className="space-y-2">
      {tasks.map((task) => (
        <TaskRow key={task.id} task={task} projects={projects} />
      ))}
    </div>
  );
}
