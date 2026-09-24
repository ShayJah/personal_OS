import Link from "next/link";
import { requireSession } from "@/lib/auth/dal";
import { getOwnedBusiness, listCrmRecords, listBusinessMembers, getBusinessOutreachStats } from "@/lib/crm";
import { getBusinessSnapshots, listBusinessDrafts } from "@/lib/business-stats";
import { CRM_STAGES, stageColorClasses } from "@/lib/crm-stages";
import { colorForKey } from "@/lib/project-health";
import { EmptyState } from "@/components/ui/empty-state";
import { NewLeadForm } from "./new-lead-form";
import { CrmRecordRow, type CrmRecordRowData } from "./crm-record-row";
import { BusinessNotes } from "./business-notes";
import { SheetImport } from "./sheet-import";
import { IconPicker } from "./icon-picker";
import { SharedCalendarSettings } from "./shared-calendar";
import { OutreachStatsCard } from "./outreach-stats";
import { ContactsList } from "./contacts-list";
import { DraftCard } from "./contacts/[crmRecordId]/draft-card";
import { BusinessShell, TABS, type TabValue } from "./business-shell";
import { OverviewTab, type PendingDraft } from "./overview-tab";

const DRAFT_SECTIONS = [
  { status: "pending", label: "Pending review" },
  { status: "approved", label: "Approved" },
  { status: "dismissed", label: "Dismissed" },
] as const;

export default async function BusinessDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string; add?: string }>;
}) {
  const session = await requireSession();
  const { id } = await params;
  const { tab: tabParam, add } = await searchParams;
  const tab: TabValue = TABS.some((t) => t.value === tabParam) ? (tabParam as TabValue) : "overview";

  const business = await getOwnedBusiness(session.user.id, id);
  const userId = session.user.id;

  const needsRecords = tab === "pipeline" || tab === "contacts" || tab === "calendar";
  const [[snapshot], records, members, stats, drafts] = await Promise.all([
    getBusinessSnapshots([business]),
    needsRecords ? listCrmRecords(userId, id) : Promise.resolve([]),
    tab === "pipeline" || tab === "contacts" ? listBusinessMembers(userId, id) : Promise.resolve([]),
    tab === "pipeline" ? getBusinessOutreachStats(userId, id) : Promise.resolve(null),
    tab === "overview" || tab === "drafts" ? listBusinessDrafts(id) : Promise.resolve([]),
  ]);

  const toRowData = (record: (typeof records)[number]): CrmRecordRowData => ({
    id: record.id,
    businessId: business.id,
    stage: record.stage,
    contact: { name: record.contact.name, email: record.contact.email, company: record.contact.company },
    assignedTo: record.assignedTo,
    lastTouchAt: record.lastTouchAt,
    nextAction: record.nextAction,
    nextActionAt: record.nextActionAt,
  });

  const pendingDrafts: PendingDraft[] = drafts
    .filter((d) => d.status === "pending")
    .slice(0, 3)
    .map((d) => ({
      id: d.id,
      crmRecordId: d.crmRecordId,
      contactName: d.crmRecord.contact.name,
      preview: d.subject ?? d.body.slice(0, 80),
    }));

  let content: React.ReactNode;

  if (tab === "overview") {
    content = <OverviewTab businessId={business.id} snapshot={snapshot} drafts={pendingDrafts} />;
  } else if (tab === "pipeline") {
    const now = new Date();
    const overdue = records.filter(
      (r) => r.nextActionAt && r.nextActionAt < now && r.stage !== "won" && r.stage !== "lost"
    );
    const byStage = new Map<string, typeof records>();
    for (const record of records) byStage.set(record.stage, [...(byStage.get(record.stage) ?? []), record]);
    const stageOrder = [...CRM_STAGES.filter((s) => s !== "won" && s !== "lost"), "won", "lost"];

    content = (
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0 space-y-6">
          {overdue.length > 0 && (
            <div className="space-y-2 rounded-2xl border border-danger/30 bg-danger-soft/40 p-4">
              <p className="eyebrow !text-danger">Overdue</p>
              <ul className="space-y-1.5 text-sm">
                {overdue.map((r) => {
                  const days = Math.round((now.getTime() - r.nextActionAt!.getTime()) / 86_400_000);
                  return (
                    <li key={r.id}>
                      <Link
                        href={`/businesses/${business.id}/contacts/${r.id}`}
                        className="underline decoration-danger/30 underline-offset-2 hover:decoration-danger"
                      >
                        {r.contact.name}
                      </Link>
                      <span className="text-muted"> — {r.nextAction ?? "follow up"}, </span>
                      <span className="text-danger">{days === 0 ? "today" : `${days} days overdue`}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          <NewLeadForm businessId={business.id} defaultOpen={add === "1"} />

          {records.length === 0 ? (
            <EmptyState title="No leads yet" description="Add one to start the pipeline." />
          ) : (
            <div className="space-y-6">
              {stageOrder.map((stage) => {
                const bucket = byStage.get(stage);
                if (!bucket?.length) return null;
                return (
                  <section key={stage} className="space-y-2" aria-label={stage}>
                    <div className="flex items-center gap-2 border-b border-border-strong pb-2">
                      <span className={`h-2 w-2 rounded-full ${stageColorClasses(stage).split(" ")[0]}`} />
                      <h2 className="!font-sans text-sm font-semibold capitalize">{stage}</h2>
                      <span className="font-mono text-xs text-muted">{bucket.length}</span>
                    </div>
                    <div className="space-y-2">
                      {bucket.map((record) => (
                        <CrmRecordRow key={record.id} members={members} record={toRowData(record)} />
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          )}
        </div>
        {stats && <OutreachStatsCard stats={stats} />}
      </div>
    );
  } else if (tab === "contacts") {
    const sorted = [...records].sort((a, b) => a.contact.name.localeCompare(b.contact.name));
    content = <ContactsList records={sorted.map(toRowData)} members={members} />;
  } else if (tab === "drafts") {
    content =
      drafts.length === 0 ? (
        <EmptyState
          title="No drafts yet"
          description="Generate outreach from the Outreach page to draft for your top leads."
          action={
            <Link href="/outreach" className="text-sm underline underline-offset-2">
              Go to Outreach
            </Link>
          }
        />
      ) : (
        <div className="space-y-6">
          {DRAFT_SECTIONS.map(({ status, label }) => {
            const section = drafts.filter((d) => d.status === status);
            if (section.length === 0) return null;
            return (
              <section key={status} className="space-y-2" aria-label={label}>
                <p className="eyebrow">
                  {label} <span className="text-muted-soft">{section.length}</span>
                </p>
                <div className="space-y-2">
                  {section.map((draft) => (
                    <DraftCard
                      key={draft.id}
                      draft={draft}
                      businessId={business.id}
                      crmRecordId={draft.crmRecordId}
                      recipientEmail={draft.crmRecord.contact.email}
                      contactName={draft.crmRecord.contact.name}
                      businessName={business.name}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      );
  } else if (tab === "calendar") {
    const now = new Date();
    const upcoming = records
      .filter((r) => r.nextActionAt && r.nextActionAt >= now && r.stage === "interviewed")
      .sort((a, b) => a.nextActionAt!.getTime() - b.nextActionAt!.getTime());
    content = (
      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <section className="rounded-3xl border border-border bg-surface p-5 sm:p-6" aria-label="Upcoming meetings">
          <p className="eyebrow">Upcoming meetings</p>
          {upcoming.length === 0 ? (
            <p className="mt-3 text-sm text-muted">
              No interviews scheduled. Schedule one from a contact&apos;s page and it lands here and on the shared calendar.
            </p>
          ) : (
            <ul className="mt-2 divide-y divide-border-strong">
              {upcoming.map((r) => (
                <li key={r.id}>
                  <Link
                    href={`/businesses/${business.id}/contacts/${r.id}`}
                    className="flex min-h-14 items-center justify-between gap-4 py-2"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-[15px]">{r.contact.name}</span>
                      <span className="block truncate text-xs text-muted">{r.contact.company ?? r.nextAction ?? "Interview"}</span>
                    </span>
                    <span className="shrink-0 font-mono text-xs text-muted">
                      {r.nextActionAt!.toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
        <SharedCalendarSettings businessId={business.id} sharedCalendarId={business.sharedCalendarId} />
      </div>
    );
  } else {
    content = (
      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-2">
        <div className="lg:col-span-2">
          <IconPicker
            businessId={business.id}
            name={business.name}
            color={colorForKey(business.id)}
            icon={business.icon}
            image={business.iconImage}
          />
        </div>
        <BusinessNotes businessId={business.id} initialNote={business.contextDoc ?? ""} />
        <SheetImport
          businessId={business.id}
          crmSheetId={business.crmSheetId}
          crmSheetTab={business.crmSheetTab ?? "CRM"}
        />
      </div>
    );
  }

  return (
    <BusinessShell
      business={{
        id: business.id,
        name: business.name,
        description: business.description,
        color: colorForKey(business.id),
        icon: business.icon,
        iconImage: business.iconImage,
      }}
      tab={tab}
      counts={{ pipeline: snapshot.leads, contacts: snapshot.leads, drafts: snapshot.pendingDrafts }}
    >
      {content}
    </BusinessShell>
  );
}
