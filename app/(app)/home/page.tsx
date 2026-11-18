import Link from "next/link";
import { requireSession } from "@/lib/auth/dal";
import { prisma } from "@/lib/db";
import { userToday } from "@/lib/user/preferences";
import { getPrioritiesForDate } from "@/lib/priorities";
import { spendLast24h, DAILY_USD_CAP } from "@/lib/home";
import { parseDigest, DIGEST_TYPE } from "@/lib/agents/home-digest";
import { Card } from "@/components/ui/card";

const DAY_MS = 86_400_000;

export default async function HomeBasePage() {
  const session = await requireSession();
  const userId = session.user.id;
  const today = await userToday(userId);
  const tomorrow = new Date(today.getTime() + DAY_MS);
  const since = new Date(Date.now() - DAY_MS);

  const [priorities, dueCount, digest, runs, pendingDrafts, spend] = await Promise.all([
    getPrioritiesForDate(userId, today),
    prisma.task.count({ where: { userId, completed: false, dueDate: { lt: tomorrow } } }),
    prisma.report.findFirst({ where: { userId, type: DIGEST_TYPE }, orderBy: { periodStart: "desc" } }),
    prisma.agentRun.findMany({
      where: { userId, startedAt: { gte: since } },
      orderBy: { startedAt: "desc" },
      take: 6,
      select: { id: true, agent: true, status: true, startedAt: true },
    }),
    prisma.emailDraft.count({ where: { status: "pending", crmRecord: { business: { userId } } } }),
    spendLast24h(userId),
  ]);
  const shipped = digest ? parseDigest(digest.content) : [];

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5">
      <h1 className="font-serif text-4xl font-extrabold uppercase tracking-wide">Home base</h1>
      <div className="grid gap-5 lg:grid-cols-3">
        <Card>
          <p className="eyebrow">Today</p>
          {priorities.length === 0 ? (
            <p className="mt-3 text-sm text-muted">No priorities set yet.</p>
          ) : (
            <ol className="mt-3 space-y-2 text-lg">
              {priorities.slice(0, 3).map((p) => (
                <li key={p.id ?? p.content}>{p.content}</li>
              ))}
            </ol>
          )}
          <p className="mt-4 text-sm text-muted">
            {dueCount} {dueCount === 1 ? "task" : "tasks"} due or overdue ·{" "}
            <Link href="/dashboard" className="underline">
              Open Today
            </Link>
          </p>
        </Card>

        <Card>
          <p className="eyebrow">Shipped this week</p>
          {shipped.length === 0 ? (
            <p className="mt-3 text-sm text-muted">The first summary lands after tonight&apos;s digest.</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {shipped.map((i) => (
                <li key={i.title}>
                  <span className="font-semibold">{i.title}</span>
                  <span className="block text-sm text-muted">{i.line}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <p className="eyebrow">Agents</p>
          <p className="mt-3 text-lg">
            {pendingDrafts} {pendingDrafts === 1 ? "draft needs" : "drafts need"} your approval
          </p>
          <p className="text-sm text-muted">
            Spend, last 24h: ${spend.toFixed(2)} of ${DAILY_USD_CAP.toFixed(2)}
          </p>
          <ul className="mt-3 space-y-1 text-sm">
            {runs.length === 0 && <li className="text-muted">No runs in the last 24 hours.</li>}
            {runs.map((r) => (
              <li key={r.id}>
                {r.agent} · {r.status}
              </li>
            ))}
          </ul>
          {pendingDrafts > 0 && (
            <Link href="/outreach" className="mt-3 inline-block text-sm underline">
              Review drafts
            </Link>
          )}
        </Card>
      </div>
    </div>
  );
}
