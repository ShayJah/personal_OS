import "server-only";
import type Anthropic from "@anthropic-ai/sdk";
import { listTasks, createTask, type TaskFilter } from "@/lib/tasks";
import { listProjectsWithProgress } from "@/lib/projects";
import { getPrioritiesForDate } from "@/lib/priorities";
import { searchAll } from "@/lib/search";
import { toDateOnly } from "@/lib/date";

export interface AgentTool {
  definition: Anthropic.Tool;
  execute: (userId: string, input: Record<string, unknown>) => Promise<unknown>;
}

const TASK_FILTERS: TaskFilter[] = ["today", "upcoming", "completed", "all"];

export const TOOLS: Record<string, AgentTool> = {
  list_tasks: {
    definition: {
      name: "list_tasks",
      description: "List the user's tasks, optionally filtered.",
      input_schema: {
        type: "object",
        properties: {
          filter: {
            type: "string",
            enum: TASK_FILTERS,
            description: "Which tasks to return. Defaults to 'all' (all open tasks).",
          },
        },
      },
    },
    execute: async (userId, input) => {
      const filter = TASK_FILTERS.includes(input.filter as TaskFilter)
        ? (input.filter as TaskFilter)
        : "all";
      return listTasks(userId, filter);
    },
  },

  list_projects: {
    definition: {
      name: "list_projects",
      description: "List the user's projects with task completion progress.",
      input_schema: { type: "object", properties: {} },
    },
    execute: async (userId) => listProjectsWithProgress(userId),
  },

  list_priorities: {
    definition: {
      name: "list_priorities",
      description: "List the user's top priorities for a given date (defaults to today).",
      input_schema: {
        type: "object",
        properties: {
          date: {
            type: "string",
            description: "ISO date (YYYY-MM-DD). Defaults to today if omitted.",
          },
        },
      },
    },
    execute: async (userId, input) => {
      const date = typeof input.date === "string" ? toDateOnly(new Date(input.date)) : toDateOnly();
      return getPrioritiesForDate(userId, date);
    },
  },

  search: {
    definition: {
      name: "search",
      description: "Full-text search across the user's tasks, projects, and captures.",
      input_schema: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search text." },
        },
        required: ["query"],
      },
    },
    execute: async (userId, input) => {
      const query = String(input.query ?? "").trim();
      if (!query) return [];
      return searchAll(userId, query);
    },
  },

  create_task: {
    definition: {
      name: "create_task",
      description: "Create a new task for the user.",
      input_schema: {
        type: "object",
        properties: {
          title: { type: "string", description: "Task title." },
          description: { type: "string" },
          dueDate: { type: "string", description: "ISO date, optional." },
          priority: { type: "number", description: "1 (low) to 3 (high), optional." },
        },
        required: ["title"],
      },
    },
    execute: async (userId, input) => {
      return createTask(userId, {
        title: String(input.title),
        description: typeof input.description === "string" ? input.description : undefined,
        dueDate: typeof input.dueDate === "string" ? new Date(input.dueDate) : undefined,
        priority: typeof input.priority === "number" ? input.priority : undefined,
      });
    },
  },
};

export function toolDefinitions(names: string[]): Anthropic.Tool[] {
  return names.map((name) => TOOLS[name].definition);
}

export async function executeTool(
  name: string,
  userId: string,
  input: Record<string, unknown>
): Promise<unknown> {
  const tool = TOOLS[name];
  if (!tool) throw new Error(`Unknown tool: ${name}`);
  return tool.execute(userId, input);
}
