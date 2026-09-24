import Link from "next/link";
import type { BusinessSnapshot } from "@/lib/business-stats";
import { StatCell, signed } from "../businesses-view";
import { OutreachPanel } from "../outreach-panel";
import { BusinessShareDialog } from "./business-share-dialog";

export type PendingDraft = {
  id: string;
  crmRecordId: string;
  contactName: string;
  preview: string;
};

const card = "rounded-3xl border border-border bg-surface p-5 shadow-[0_1px_2px_rgba(33,24,16,0.04)] sm:p-6";

export function OverviewTab({
  businessId,
  snapshot: s,
  drafts,
}: {
  businessId: string;
  snapshot: BusinessSnapshot;
  drafts: PendingDraft[];
}) {
  const sentDelta = s.sent30 - s.sentPrev30;
  const funnelMax = Math.max(1, s.funnel[0]?.count ?? 1);

  return (
    <div className="space-y-4 lg:space-y-5">
      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-5">
        {[
          <StatCell key="p" label="In pipeline" value={s.leads.toLocaleString()} sub={`${signed(s.newLeads30)} this month`} tone={s.newLeads30 > 0 ? "good" : undefined} />,
          <StatCell key="s" label="Sent · 30d" value={s.sent30} sub={`${signed(sentDelta)} vs last month`} tone={sentDelta > 0 ? "good" : sentDelta < 0 ? "bad" : undefined} />,
          <StatCell key="r" label="Replies · 30d" value={s.replies30} sub={s.replyRate === null ? "No outreach yet" : `${s.replyRate}% reply rate`} />,
          <StatCell key="m" label="Meetings booked" value={s.meetings30} sub={`${s.meetingsThisWeek} this week`} />,
        ].map((cell, i) => (
          <div key={i} className="rounded-3xl border border-border bg-surface p-4 shadow-[0_1px_2px_rgba(33,24,16,0.04)] sm:p-5">
            {cell}
          </div>
        ))}
      </dl>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-5">
        <section className={card} aria-label="Outreach chart">
          <OutreachPanel weeks={s.weekly} people={s.people} />
        </section>

        <section className={card} aria-label="Stages">
          <div className="flex items-baseline justify-between">
            <p className="eyebrow">Stages</p>
            <Link href={`/businesses/${businessId}?tab=pipeline`} className="text-xs text-muted hover:text-foreground">
              Pipeline →
            </Link>
          </div>
          <ul className="mt-4 space-y-4">
            {s.funnel.map((row) => (
              <li key={row.stage}>
                <div className="flex items-baseline justify-between text-sm">
                  <span className="capitalize">{row.stage}</span>
                  <span className="font-mono">{row.count.toLocaleString()}</span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-sunken">
                  <div
                    className="h-full rounded-full bg-accent"
                    style={{ width: `${row.count === 0 ? 0 : Math.max(2, (row.count / funnelMax) * 100)}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-5">
        <section className={card} aria-label="Drafts ready to send">
          <div className="flex items-baseline justify-between">
            <p className="eyebrow">Drafts ready to send</p>
            <Link href={`/businesses/${businessId}?tab=drafts`} className="text-xs text-muted hover:text-foreground">
              All drafts →
            </Link>
          </div>
          {drafts.length === 0 ? (
            <p className="mt-4 text-sm text-muted">
              Nothing waiting. Generate outreach from the{" "}
              <Link href="/outreach" className="underline underline-offset-2 hover:text-foreground">
                Outreach page
              </Link>{" "}
              to draft for your top leads.
            </p>
          ) : (
            <ul className="mt-2">
              {drafts.map((d) => (
                <li key={d.id} className="flex items-center gap-3 py-2.5">
                  <span aria-hidden="true" className="grid h-9 w-9 shrink-0 place-content-center rounded-xl bg-surface-sunken text-muted">
                    ✉
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px]">{d.contactName}</span>
                    <span className="block truncate text-xs text-muted">{d.preview}</span>
                  </span>
                  <Link
                    href={`/businesses/${businessId}/contacts/${d.crmRecordId}`}
                    className="inline-flex min-h-10 shrink-0 items-center rounded-xl border border-border-strong bg-surface px-3.5 text-sm hover:bg-foreground/5"
                  >
                    Review
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className={card} aria-label="Sharing">
          <p className="eyebrow">Share this business</p>
          <p className="mt-3 text-[15px]">Send a link to a teammate, advisor or investor.</p>
          <p className="mt-1 text-sm text-muted">
            Choose how much they see: just the overview, a pipeline snapshot, or every lead. Contacts stay private unless you pick full records.
          </p>
          <BusinessShareDialog
            businessId={businessId}
            label="Create share link"
            className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-foreground px-5 text-sm font-medium text-background transition hover:bg-foreground/85 active:scale-[0.98]"
          />
        </section>
      </div>
    </div>
  );
}
