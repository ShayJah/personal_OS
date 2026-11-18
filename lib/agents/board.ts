import "server-only";

export const GROUPS = [
  { key: "outreach", label: "Outreach" },
  { key: "calendar", label: "Calendar" },
  { key: "projects", label: "Projects" },
  { key: "finals", label: "Finals" },
] as const;
export type GroupKey = (typeof GROUPS)[number]["key"];

export const STATUSES = [
  "queued",
  "in-progress",
  "awaiting-approval",
  "approved",
  "rejected",
  "blocked",
  "done",
] as const;
export type Status = (typeof STATUSES)[number];

export type BoardIssue = {
  number: number;
  title: string;
  url: string;
  open: boolean;
  group: GroupKey | null;
  status: Status;
  updatedAt: string;
};

type BoardConfig = { repo: string; token: string };

/** The board holds private task data; only emails listed in AGENTS_OWNER_EMAILS may see it. Unset = nobody. */
export function isAgentsOwner(email: string | null | undefined): boolean {
  if (!email) return false;
  const owners = (process.env.AGENTS_OWNER_EMAILS ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  return owners.includes(email.toLowerCase());
}

export function getBoardConfig(): BoardConfig | null {
  const repo = process.env.AGENTS_BOARD_REPO?.trim();
  const token = process.env.AGENTS_GITHUB_TOKEN?.trim();
  if (!repo || !token || !/^[\w.-]+\/[\w.-]+$/.test(repo)) return null;
  return { repo, token };
}

async function github(config: BoardConfig, path: string, init: RequestInit = {}) {
  return fetch(`https://api.github.com/repos/${config.repo}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${config.token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
      ...init.headers,
    },
  });
}

type RawLabel = string | { name?: string | null };
type RawIssue = {
  number: number;
  title: string;
  html_url: string;
  state: string;
  updated_at: string;
  labels: RawLabel[];
  pull_request?: unknown;
};

function labelNames(labels: RawLabel[]): string[] {
  return labels
    .map((label) => (typeof label === "string" ? label : label.name ?? ""))
    .filter(Boolean);
}

function toIssue(raw: RawIssue): BoardIssue {
  const names = labelNames(raw.labels);
  const groupName = names.find((n) => n.startsWith("group:"))?.slice(6);
  const statusName = names.find((n) => n.startsWith("status:"))?.slice(7);
  const group = GROUPS.find((g) => g.key === groupName)?.key ?? null;
  const open = raw.state === "open";
  const status =
    STATUSES.find((s) => s === statusName) ?? (open ? "queued" : "done");
  return {
    number: raw.number,
    title: raw.title,
    url: raw.html_url,
    open,
    group,
    status,
    updatedAt: raw.updated_at,
  };
}

export type BoardResult =
  | { ok: true; issues: BoardIssue[] }
  | { ok: false; error: string };

export async function listBoardIssues(): Promise<BoardResult> {
  const config = getBoardConfig();
  if (!config) return { ok: false, error: "Board is not configured." };
  const response = await github(
    config,
    "/issues?state=all&per_page=100&sort=updated&direction=desc"
  );
  if (!response.ok) {
    return { ok: false, error: `GitHub returned ${response.status}.` };
  }
  const raw = (await response.json()) as RawIssue[];
  return { ok: true, issues: raw.filter((i) => !i.pull_request).map(toIssue) };
}

export type DecisionResult = { ok: true } | { ok: false; error: string };

/** Moves an open issue from status:awaiting-approval to status:approved or status:rejected. */
export async function setDecision(
  number: number,
  decision: "approved" | "rejected"
): Promise<DecisionResult> {
  const config = getBoardConfig();
  if (!config) return { ok: false, error: "Board is not configured." };

  const current = await github(config, `/issues/${number}`);
  if (!current.ok) return { ok: false, error: `GitHub returned ${current.status}.` };
  const issue = (await current.json()) as RawIssue;
  if (issue.pull_request) return { ok: false, error: "Not a board task." };
  const names = labelNames(issue.labels);
  if (issue.state !== "open" || !names.includes("status:awaiting-approval")) {
    return { ok: false, error: "This task is no longer awaiting approval." };
  }

  const add = await github(config, `/issues/${number}/labels`, {
    method: "POST",
    body: JSON.stringify({ labels: [`status:${decision}`] }),
  });
  if (!add.ok) return { ok: false, error: `Could not set label (${add.status}).` };

  await github(
    config,
    `/issues/${number}/labels/${encodeURIComponent("status:awaiting-approval")}`,
    { method: "DELETE" }
  );
  await github(config, `/issues/${number}/comments`, {
    method: "POST",
    body: JSON.stringify({
      body: `Decision from PersonalOS (owner): **${decision}**.`,
    }),
  });
  return { ok: true };
}
