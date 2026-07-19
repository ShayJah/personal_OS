"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { createTaskAction } from "@/app/(app)/tasks/actions";
import { setThemeAction } from "@/app/(app)/settings/actions";
import type { SearchResult } from "@/lib/search";

const NAV_COMMANDS = [
  { label: "Go to Dashboard", href: "/dashboard" },
  { label: "Go to Tasks", href: "/tasks" },
  { label: "Go to Projects", href: "/projects" },
  { label: "Go to Calendar", href: "/calendar" },
  { label: "Go to Habits", href: "/habits" },
  { label: "Go to Capture", href: "/capture" },
  { label: "Go to Coach", href: "/coach" },
  { label: "Go to Reports", href: "/reports" },
  { label: "Go to Settings", href: "/settings" },
];

type Mode = "search" | "create" | "command";

function resolveMode(raw: string): { mode: Mode; value: string } {
  if (raw.startsWith("+")) return { mode: "create", value: raw.slice(1).trim() };
  if (raw.startsWith(">")) return { mode: "command", value: raw.slice(1).trim() };
  return { mode: "search", value: raw.trim() };
}

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [raw, setRaw] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isPending, startTransition] = useTransition();

  const { mode, value } = useMemo(() => resolveMode(raw), [raw]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (mode !== "search" || value.length === 0) return;
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(value)}`, { signal: controller.signal })
        .then((res) => (res.ok ? res.json() : { results: [] }))
        .then((data) => setResults(data.results ?? []))
        .catch(() => {});
    }, 200);
    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [mode, value]);

  const visibleResults = mode === "search" && value.length > 0 ? results : [];

  const handleOpenChange = useCallback((next: boolean) => {
    setOpen(next);
    if (!next) {
      setRaw("");
      setResults([]);
    }
  }, []);

  const close = useCallback(() => handleOpenChange(false), [handleOpenChange]);

  const navigate = useCallback(
    (href: string) => {
      router.push(href);
      close();
    },
    [router, close]
  );

  const runCreateTask = useCallback(() => {
    if (!value) return;
    const formData = new FormData();
    formData.set("title", value);
    startTransition(async () => {
      await createTaskAction(formData);
      close();
    });
  }, [value, close]);

  const runThemeToggle = useCallback(
    (theme: "light" | "dark" | "system") => {
      startTransition(async () => {
        await setThemeAction(theme);
        close();
      });
    },
    [close]
  );

  const filteredCommands = NAV_COMMANDS.filter((c) =>
    c.label.toLowerCase().includes(value.toLowerCase())
  );

  return (
    <Command.Dialog
      open={open}
      onOpenChange={handleOpenChange}
      label="Command palette"
      className="fixed left-1/2 top-24 z-50 w-full max-w-lg -translate-x-1/2 overflow-hidden rounded-xl border border-border bg-surface shadow-xl"
    >
      <div className="border-b border-border px-3 py-2">
        <Command.Input
          value={raw}
          onValueChange={setRaw}
          placeholder="Search, + to create a task, > for commands…"
          className="w-full bg-transparent px-1 py-2 text-sm text-foreground outline-none placeholder:text-foreground/40"
        />
      </div>

      <Command.List className="max-h-80 overflow-y-auto p-2">
        <Command.Empty className="px-3 py-6 text-center text-sm text-foreground/50">
          {isPending ? "Working…" : "No results"}
        </Command.Empty>

        {mode === "search" &&
          visibleResults.map((result) => (
            <Command.Item
              key={`${result.type}-${result.id}`}
              value={`${result.type}-${result.id}-${result.title}`}
              onSelect={() => navigate(result.href)}
              className="cursor-pointer rounded-lg px-3 py-2 text-sm text-foreground data-[selected=true]:bg-surface-sunken"
            >
              <span className="eyebrow mr-2 text-foreground/40">{result.type}</span>
              {result.title}
            </Command.Item>
          ))}

        {mode === "create" && value.length > 0 && (
          <Command.Item
            value={`create-${value}`}
            onSelect={runCreateTask}
            className="cursor-pointer rounded-lg px-3 py-2 text-sm text-foreground data-[selected=true]:bg-surface-sunken"
          >
            Create task: <span className="font-medium">{value}</span>
          </Command.Item>
        )}

        {mode === "command" && (
          <>
            {filteredCommands.map((cmd) => (
              <Command.Item
                key={cmd.href}
                value={cmd.label}
                onSelect={() => navigate(cmd.href)}
                className="cursor-pointer rounded-lg px-3 py-2 text-sm text-foreground data-[selected=true]:bg-surface-sunken"
              >
                {cmd.label}
              </Command.Item>
            ))}
            <Command.Item
              value="Toggle theme: light"
              onSelect={() => runThemeToggle("light")}
              className="cursor-pointer rounded-lg px-3 py-2 text-sm text-foreground data-[selected=true]:bg-surface-sunken"
            >
              Set theme: Light
            </Command.Item>
            <Command.Item
              value="Toggle theme: dark"
              onSelect={() => runThemeToggle("dark")}
              className="cursor-pointer rounded-lg px-3 py-2 text-sm text-foreground data-[selected=true]:bg-surface-sunken"
            >
              Set theme: Dark
            </Command.Item>
            <Command.Item
              value="Toggle theme: system"
              onSelect={() => runThemeToggle("system")}
              className="cursor-pointer rounded-lg px-3 py-2 text-sm text-foreground data-[selected=true]:bg-surface-sunken"
            >
              Set theme: System
            </Command.Item>
          </>
        )}
      </Command.List>
    </Command.Dialog>
  );
}
