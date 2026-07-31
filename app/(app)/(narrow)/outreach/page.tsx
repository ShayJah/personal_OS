import Link from "next/link";
import { requireSession } from "@/lib/auth/dal";
import { listRecentDrafts } from "@/lib/crm";
import { isConnected as isGmailConnected } from "@/lib/gmail";
import { EmptyState } from "@/components/ui/empty-state";
import { DraftCard } from "../businesses/[id]/contacts/[crmRecordId]/draft-card";
import { GenerateOutreachButton } from "./generate-button";

const RECENT_DRAFTS_LIMIT = 40;

export default async function OutreachPage() {
  const session = await requireSession();
  const [drafts, gmailConnected] = await Promise.all([
    listRecentDrafts(session.user.id, RECENT_DRAFTS_LIMIT),
    isGmailConnected(session.user.id),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Business</p>
        <h1 className="mt-1 font-serif text-3xl">Outreach</h1>
        <p className="mt-1 text-sm text-muted">
          One click researches your top open leads and drafts a personalized email + LinkedIn
          message for each. {gmailConnected
            ? "Email drafts land straight in your Gmail Drafts folder."
            : "Connect Gmail in Settings to have email drafts land straight in your inbox."}{" "}
          Run it as often as you want — it always drafts fresh.
        </p>
      </div>

      <GenerateOutreachButton />

      {!gmailConnected && (
        <p className="text-xs text-muted">
          <Link href="/settings" className="underline hover:text-foreground">
            Connect Gmail
          </Link>{" "}
          to skip the manual copy/paste step for email drafts.
        </p>
      )}

      {drafts.length === 0 ? (
        <EmptyState
          title="No drafts yet"
          description="Hit 'Generate more outreach' above to research and draft for your top leads."
        />
      ) : (
        <div className="space-y-2">
          {drafts.map((draft) => (
            <DraftCard
              key={draft.id}
              draft={draft}
              businessId={draft.crmRecord.businessId}
              crmRecordId={draft.crmRecordId}
              recipientEmail={draft.crmRecord.contact.email}
              contactName={draft.crmRecord.contact.name}
              businessName={draft.crmRecord.business.name}
            />
          ))}
        </div>
      )}
    </div>
  );
}
