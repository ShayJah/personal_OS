import Link from "next/link";
import { cn } from "@/lib/utils";
import type { OutreachBoard as BoardData } from "@/lib/outreach-board";
import { EmptyState } from "@/components/ui/empty-state";
import { DraftCard, type DraftData } from "../businesses/[id]/contacts/[crmRecordId]/draft-card";
import { GenerateOutreachButton } from "./generate-button";
import { GoalStrip, type OutreachGoal } from "./goal-strip";
import { OutreachBoard } from "./outreach-board";

const DRAFT_SECTIONS = [
  { status: "pending", label: "Pending review" },
  { status: "approved", label: "Approved" },
  { status: "dismissed", label: "Dismissed" },
] as const;

const chip =
  "inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full border px-4 text-sm transition";

export type OutreachDraft = DraftData & {
  crmRecordId: string;
  businessId: string;
  businessName: string;
  contactName: string;
  recipientEmail: string | null;
};

export type OutreachViewProps = {
  view: "board" | "drafts";
  businesses: { id: string; name: string; color: string }[];
  selectedId: string | null;
  board: BoardData;
  goal: OutreachGoal | null;
  drafts: OutreachDraft[];
  gmailConnected: boolean;
};

export function pageHref(params: { business?: string | null; view?: string }) {
  const q = new URLSearchParams();
  if (params.business) q.set("business", params.business);
  if (params.view && params.view !== "board") q.set("view", params.view);
  const s = q.toString();
  return s ? `/outreach?${s}` : "/outreach";
}

export function OutreachView({ view, businesses, selectedId, board, goal, drafts, gmailConnected }: OutreachViewProps) {
  const selected = businesses.find((b) => b.id === selectedId) ?? null;
  const importHref = selected ? `/businesses/${selected.id}?tab=settings` : "/businesses";
  const pipelineHref = selected ? `/businesses/${selected.id}?tab=pipeline` : "/businesses";
  const colors = new Map(businesses.map((b) => [b.id, b.color]));

  return (
    <div className="mx-auto w-full max-w-[90rem] space-y-5 pb-16 md:pb-0">
      <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
        <div>
          <p className="eyebrow">Grow</p>
          <h1 className="mt-1 font-serif text-4xl sm:text-5xl">Outreach</h1>
          <p className="mt-2 text-sm text-muted">
            Every contact across your businesses, by stage.
            {board.totalLeads > 0 && (
              <>
                {" "}
                <span className="font-mono">{board.totalLeads}</span> open{board.truncated ? "+" : ""}
              </>
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-start gap-2">
          <Link
            href={importHref}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border-strong bg-surface px-4 text-sm font-medium transition hover:bg-foreground/5 active:scale-[0.98]"
          >
            Import leads
          </Link>
          <GenerateOutreachButton />
        </div>
      </header>

      <GoalStrip goal={goal} />

      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <nav aria-label="Filter by business" className="-mx-1 flex max-w-full gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <Link
            href={pageHref({ view })}
            aria-current={!selected ? "true" : undefined}
            className={cn(chip, !selected ? "border-foreground bg-foreground text-background" : "border-border-strong bg-surface hover:bg-foreground/5")}
          >
            All
          </Link>
          {businesses.map((b) => (
            <Link
              key={b.id}
              href={pageHref({ business: b.id, view })}
              aria-current={selected?.id === b.id ? "true" : undefined}
              className={cn(chip, selected?.id === b.id ? "border-foreground bg-foreground text-background" : "border-border-strong bg-surface hover:bg-foreground/5")}
            >
              <span aria-hidden="true" className="h-2 w-2 rounded-full" style={{ background: colors.get(b.id) }} />
              {b.name}
            </Link>
          ))}
        </nav>

        <div role="group" aria-label="View" className="flex rounded-xl border border-border-strong bg-surface p-0.5 text-sm">
          {(
            [
              { value: "board", label: "Board" },
              { value: "drafts", label: "Drafts", count: board.pendingDrafts },
            ] as const
          ).map((t) => (
            <Link
              key={t.value}
              href={pageHref({ business: selected?.id, view: t.value })}
              aria-current={view === t.value ? "true" : undefined}
              className={cn(
                "inline-flex min-h-9 items-center gap-2 rounded-[10px] px-3.5 transition",
                view === t.value ? "bg-foreground text-background" : "text-muted hover:text-foreground"
              )}
            >
              {t.label}
              {"count" in t && t.count > 0 && (
                <span className={cn("font-mono text-xs", view === t.value ? "text-background/70" : "text-warning")}>{t.count}</span>
              )}
            </Link>
          ))}
        </div>
      </div>

      {view === "board" ? (
        board.totalLeads === 0 ? (
          <EmptyState
            title="No open leads yet"
            description="Import a list from a Sheet or add a contact to a business, and they will show up here by stage."
          />
        ) : (
          <OutreachBoard columns={board.columns} moreHref={pipelineHref} />
        )
      ) : (
        <div className="mx-auto w-full max-w-4xl space-y-6">
          <p className="text-sm text-muted">
            &ldquo;Draft outreach&rdquo; researches your top open leads and writes an email and a LinkedIn message for each.{" "}
            {gmailConnected ? (
              "Email drafts land straight in your Gmail Drafts folder."
            ) : (
              <>
                <Link href="/settings" className="underline hover:text-foreground">
                  Connect Gmail
                </Link>{" "}
                to have email drafts land in your inbox.
              </>
            )}
          </p>
          {drafts.length === 0 ? (
            <EmptyState title="No drafts yet" description="Hit “Draft outreach” above to research and draft for your top leads." />
          ) : (
            DRAFT_SECTIONS.map(({ status, label }) => {
              const section = drafts.filter((d) => d.status === status);
              if (section.length === 0) return null;
              return (
                <div key={status} className="space-y-2">
                  <p className="eyebrow">
                    {label} <span className="text-muted-soft">{section.length}</span>
                  </p>
                  <div className="space-y-2">
                    {section.map((draft) => (
                      <DraftCard
                        key={draft.id}
                        draft={draft}
                        businessId={draft.businessId}
                        crmRecordId={draft.crmRecordId}
                        recipientEmail={draft.recipientEmail}
                        contactName={draft.contactName}
                        businessName={draft.businessName}
                      />
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
