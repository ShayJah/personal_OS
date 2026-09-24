"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import type { TaskFilter } from "@/lib/tasks";

type Tab = { value: TaskFilter; label: string; count?: number };

const selectClass =
  "!min-h-10 !rounded-xl !bg-surface pl-3 pr-2 text-sm font-medium";

export function TaskToolbar({
  tabs,
  filter,
  group,
  projectId,
  projects,
}: {
  tabs: Tab[];
  filter: TaskFilter;
  group: "due" | "project";
  projectId: string;
  projects: { id: string; name: string }[];
}) {
  const router = useRouter();

  function href(next: { filter?: string; group?: string; project?: string }) {
    const params = new URLSearchParams();
    const f = next.filter ?? filter;
    const g = next.group ?? group;
    const p = next.project ?? projectId;
    if (f !== "all") params.set("filter", f);
    if (g !== "due") params.set("group", g);
    if (p) params.set("project", p);
    const qs = params.toString();
    return qs ? `/tasks?${qs}` : "/tasks";
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <nav aria-label="Task filter" className="w-full overflow-x-auto [scrollbar-width:none] sm:w-auto [&::-webkit-scrollbar]:hidden">
        <div className="flex w-max gap-1 rounded-xl border border-border-strong bg-surface p-1">
          {tabs.map((tab) => (
            <Link
              key={tab.value}
              href={href({ filter: tab.value })}
              aria-current={filter === tab.value ? "page" : undefined}
              className={cn(
                "flex min-h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 text-sm sm:px-3",
                filter === tab.value
                  ? "bg-foreground font-medium text-background"
                  : "text-muted hover:text-foreground"
              )}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className="font-mono text-xs opacity-60">{tab.count}</span>
              )}
            </Link>
          ))}
        </div>
      </nav>

      <div className="flex gap-2">
        <select
          aria-label="Group by"
          value={group}
          onChange={(e) => router.push(href({ group: e.target.value }))}
          className={selectClass}
        >
          <option value="due">Group: Due date</option>
          <option value="project">Group: Project</option>
        </select>
        <select
          aria-label="Filter by project"
          value={projectId}
          onChange={(e) => router.push(href({ project: e.target.value }))}
          className={selectClass}
        >
          <option value="">All projects</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
