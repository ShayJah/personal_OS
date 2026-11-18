import Link from "next/link";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";
import type { BusinessSnapshot } from "@/lib/business-stats";
import { BusinessAvatar } from "./business-avatar";
import { MiniBars } from "./outreach-chart";
import { NewBusinessForm } from "./new-business-form";

export type BusinessCardData = BusinessSnapshot & { color: string };

export function signed(n: number) {
  return `${n > 0 ? "+" : n < 0 ? "−" : ""}${Math.abs(n)}`;
}

export function StatCell({
  label,
  value,
  sub,
  tone,
  className,
}: {
  label: string;
  value: string | number;
  sub?: string;
  tone?: "good" | "bad";
  className?: string;
}) {
  return (
    <div className={className}>
      <dt className="eyebrow">{label}</dt>
      <dd className="mt-2 font-mono text-4xl font-medium tracking-tight">{value}</dd>
      {sub && (
        <p className={cn("mt-1 text-xs", tone === "good" ? "text-success" : tone === "bad" ? "text-danger" : "text-muted")}>
          {sub}
        </p>
      )}
    </div>
  );
}

export function BusinessesView({ businesses }: { businesses: BusinessCardData[] }) {
  const sum = (pick: (b: BusinessCardData) => number) => businesses.reduce((n, b) => n + pick(b), 0);
  const sent30 = sum((b) => b.sent30);
  const sentDelta = sent30 - sum((b) => b.sentPrev30);
  const replies30 = sum((b) => b.replies30);

  return (
    <div className="mx-auto w-full max-w-6xl pb-16 md:pb-0">
      <header className="mb-5 flex items-end justify-between gap-3 sm:mb-6">
        <div>
          <p className="eyebrow">Run</p>
          <h1 className="mt-1 font-serif text-4xl sm:text-5xl">Businesses</h1>
          <p className="mt-2 text-sm text-muted">Pipelines, contacts and outreach for every venture.</p>
        </div>
        <NewBusinessForm />
      </header>

      {businesses.length === 0 ? (
        <EmptyState title="No businesses yet" description="Create one to start tracking a pipeline." />
      ) : (
        <>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-6 rounded-3xl border border-border bg-surface p-5 shadow-[0_1px_2px_rgba(33,24,16,0.04)] sm:p-6 lg:grid-cols-4 lg:gap-y-0 lg:divide-x lg:divide-border-strong">
            <StatCell
              label="In pipeline"
              value={sum((b) => b.leads).toLocaleString()}
              sub={`Across ${businesses.length} ${businesses.length === 1 ? "business" : "businesses"}`}
            />
            <StatCell
              label="Sent · 30d"
              value={sent30}
              sub={`${signed(sentDelta)} vs last month`}
              tone={sentDelta > 0 ? "good" : sentDelta < 0 ? "bad" : undefined}
              className="lg:pl-6"
            />
            <StatCell
              label="Replies · 30d"
              value={replies30}
              sub={sent30 > 0 ? `${Math.round((replies30 / sent30) * 100)}% reply rate` : "No outreach yet"}
              className="lg:pl-6"
            />
            <StatCell
              label="Meetings booked"
              value={sum((b) => b.meetings30)}
              sub={`${sum((b) => b.meetingsThisWeek)} this week`}
              className="lg:pl-6"
            />
          </dl>

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
            {businesses.map((b) => (
              <BusinessCard key={b.id} business={b} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function BusinessCard({ business: b }: { business: BusinessCardData }) {
  const empty = b.leads === 0;
  const action =
    b.pendingDrafts > 0
      ? { text: `Review ${b.pendingDrafts} ${b.pendingDrafts === 1 ? "draft" : "drafts"} ready to send`, href: `/businesses/${b.id}?tab=drafts` }
      : b.overdue > 0
        ? { text: `Follow up with ${b.overdue} ${b.overdue === 1 ? "lead" : "leads"}`, href: `/businesses/${b.id}?tab=pipeline` }
        : null;

  return (
    <article className="group relative flex min-w-0 flex-col rounded-3xl border border-border bg-surface p-5 shadow-[0_1px_2px_rgba(33,24,16,0.04)] transition hover:border-border-strong hover:shadow-md">
      <div className="flex items-center gap-3">
        <BusinessAvatar name={b.name} color={b.color} icon={b.icon} image={b.iconImage} />
        <h2 className="min-w-0 flex-1 truncate font-serif text-2xl">
          {/* Stretched link: the whole card opens the business, inner actions sit above it. */}
          <Link href={`/businesses/${b.id}`} className="after:absolute after:inset-0 after:rounded-3xl">
            {b.name}
          </Link>
        </h2>
        <span aria-hidden="true" className="text-muted transition group-hover:translate-x-0.5 group-hover:text-foreground">
          →
        </span>
      </div>

      <p className="mt-3 line-clamp-2 min-h-10 text-sm leading-5 text-muted">{b.description ?? "No description yet."}</p>

      {empty ? (
        <div className="mt-4 flex flex-1 flex-col justify-center rounded-2xl border border-dashed border-border-strong px-4 py-6">
          <p className="text-sm font-medium">Pipeline is empty</p>
          <p className="mt-1 text-sm text-muted">Import a list from your Sheet or add the first contact to start tracking.</p>
          <div className="relative z-10 mt-4 flex flex-wrap gap-2">
            <Link
              href={`/businesses/${b.id}?tab=settings`}
              className="inline-flex min-h-10 items-center rounded-xl border border-border-strong bg-surface px-3.5 text-sm hover:bg-foreground/5"
            >
              Import from Sheet
            </Link>
            <Link
              href={`/businesses/${b.id}?tab=pipeline&add=1`}
              className="inline-flex min-h-10 items-center rounded-xl border border-border-strong bg-surface px-3.5 text-sm hover:bg-foreground/5"
            >
              + Add contact
            </Link>
          </div>
        </div>
      ) : (
        <>
          <dl className="mt-4 grid grid-cols-4 gap-2 border-y border-border-strong py-3">
            {[
              ["Pipeline", b.leads.toLocaleString()],
              ["Sent", b.sent30],
              ["Replies", b.replies30],
              ["Reply rate", b.replyRate === null ? "—" : `${b.replyRate}%`],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs text-muted">{label}</dt>
                <dd className="mt-0.5 font-mono text-xl">{value}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-3 flex items-end justify-between gap-3">
            <p className="text-xs leading-4 text-muted">
              Outreach · last
              <br />8 weeks
            </p>
            <MiniBars weeks={b.weekly.slice(-8)} />
          </div>
        </>
      )}

      {!empty && (
        <div className="mt-4 min-h-11">
          {action && (
            <Link
              href={action.href}
              className="relative z-10 flex min-h-11 items-center gap-2.5 rounded-xl bg-surface-sunken/70 px-3.5 text-sm hover:bg-surface-sunken"
            >
              <span aria-hidden="true" className="text-accent">⚑</span>
              {action.text}
            </Link>
          )}
        </div>
      )}
    </article>
  );
}
