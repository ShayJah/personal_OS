import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth/dal";
import {
  GROUPS,
  getBoardConfig,
  isAgentsOwner,
  listBoardIssues,
  type BoardIssue,
  type Status,
} from "@/lib/agents/board";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ApprovalButtons } from "./approval-buttons";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<Status, string> = {
  queued: "Queued",
  "in-progress": "In progress",
  "awaiting-approval": "Awaiting approval",
  approved: "Approved",
  rejected: "Rejected",
  blocked: "Blocked",
  done: "Done",
};

function groupLabel(issue: BoardIssue) {
  return GROUPS.find((g) => g.key === issue.group)?.label ?? "Ungrouped";
}

function StatusChip({ status }: { status: Status }) {
  return (
    <span className="rounded-full border border-border-strong px-2 py-0.5 text-[11px] uppercase tracking-wide text-muted">
      {STATUS_LABEL[status]}
    </span>
  );
}

export default async function AgentsPage() {
  const session = await requireSession();
  // Fail closed: the board holds private task data and any GitHub user can sign in.
  if (!isAgentsOwner(session.user.email)) notFound();

  const header = (
    <div>
      <p className="eyebrow">Agents</p>
      <h1 className="mt-1 font-serif text-3xl">Master agent</h1>
      <p className="mt-1 text-sm text-muted">
        Outreach, calendar, projects and finals, run on demand. Nothing is sent,
        merged or deployed without your approval.
      </p>
    </div>
  );

  if (!getBoardConfig()) {
    return (
      <div className="space-y-6">
        {header}
        <EmptyState
          title="Board not connected"
          description="Set AGENTS_BOARD_REPO and AGENTS_GITHUB_TOKEN in the environment to connect the task board."
        />
      </div>
    );
  }

  const result = await listBoardIssues();
  if (!result.ok) {
    return (
      <div className="space-y-6">
        {header}
        <EmptyState title="Could not load the board" description={result.error} />
      </div>
    );
  }

  const open = result.issues.filter((i) => i.open);
  const awaiting = open.filter((i) => i.status === "awaiting-approval");
  const closedCount = result.issues.length - open.length;

  return (
    <div className="space-y-8">
      {header}

      <section aria-labelledby="needs-you">
        <h2 id="needs-you" className="font-serif text-xl">
          Needs you ({awaiting.length})
        </h2>
        {awaiting.length === 0 ? (
          <p className="mt-2 text-sm text-muted">Nothing is waiting on you.</p>
        ) : (
          <div className="mt-3 space-y-3">
            {awaiting.map((issue) => (
              <Card key={issue.number} className="space-y-3">
                <div>
                  <p className="eyebrow">{groupLabel(issue)}</p>
                  <a
                    href={issue.url}
                    className="mt-1 block text-sm font-medium underline-offset-2 hover:underline"
                  >
                    #{issue.number} {issue.title}
                  </a>
                </div>
                <ApprovalButtons number={issue.number} />
              </Card>
            ))}
          </div>
        )}
      </section>

      <section aria-labelledby="groups" className="space-y-4">
        <h2 id="groups" className="font-serif text-xl">
          Groups
        </h2>
        {[...GROUPS.map((g) => ({ key: g.key as string | null, label: g.label })), { key: null, label: "Ungrouped" }].map(
          (group) => {
            const items = open.filter((i) => i.group === group.key);
            if (group.key === null && items.length === 0) return null;
            return (
              <Card key={group.label} className="space-y-3">
                <div className="flex items-baseline justify-between">
                  <h3 className="font-serif text-lg">{group.label}</h3>
                  <span className="text-xs text-muted">{items.length} open</span>
                </div>
                {items.length === 0 ? (
                  <p className="text-sm text-muted">No open tasks.</p>
                ) : (
                  <ul className="space-y-2">
                    {items.map((issue) => (
                      <li
                        key={issue.number}
                        className="flex items-start justify-between gap-3"
                      >
                        <a
                          href={issue.url}
                          className="text-sm underline-offset-2 hover:underline"
                        >
                          #{issue.number} {issue.title}
                        </a>
                        <StatusChip status={issue.status} />
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            );
          }
        )}
        <p className="text-xs text-muted">
          {closedCount} closed task{closedCount === 1 ? "" : "s"} not shown. Showing
          the 100 most recently updated.
        </p>
      </section>
    </div>
  );
}
