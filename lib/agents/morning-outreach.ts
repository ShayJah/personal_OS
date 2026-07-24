import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { listTopLeads, pushDraftToGmail } from "@/lib/crm";
import { isConnected as isGmailConnected } from "@/lib/gmail";
import { runResearchDraft } from "@/lib/agents/research-draft";

const LEADS_PER_MORNING = 10;

/**
 * Drafts a personalized email + LinkedIn message for the user's top 10
 * leads. Email drafts get pushed into real Gmail drafts if the user has
 * connected Gmail and the contact has an email on file; LinkedIn has no
 * free API for this, so those drafts just wait in-app for copy/paste.
 * Runs leads sequentially — each one does two agent turns (research +
 * draft, for both channels), so running them in parallel would multiply
 * concurrent Anthropic + web-search calls for no real benefit here.
 */
export async function runMorningOutreach(userId: string) {
  const leads = await listTopLeads(userId, LEADS_PER_MORNING);
  if (leads.length === 0) return null;

  const gmailConnected = await isGmailConnected(userId);
  let emailDrafted = 0;
  let emailPushedToGmail = 0;
  let linkedinDrafted = 0;

  for (const lead of leads) {
    try {
      await runResearchDraft(userId, lead.id, "email", "schedule");
      emailDrafted++;

      if (gmailConnected && lead.contact.email) {
        const latestDraft = await prisma.emailDraft.findFirst({
          where: { crmRecordId: lead.id, channel: "email" },
          orderBy: { createdAt: "desc" },
        });
        if (latestDraft) {
          const pushed = await pushDraftToGmail(userId, latestDraft.id);
          if (pushed) emailPushedToGmail++;
        }
      }
    } catch (error) {
      console.error(`Morning outreach: email draft failed for CRM record ${lead.id}:`, error);
    }

    try {
      await runResearchDraft(userId, lead.id, "linkedin", "schedule");
      linkedinDrafted++;
    } catch (error) {
      console.error(`Morning outreach: LinkedIn draft failed for CRM record ${lead.id}:`, error);
    }
  }

  const body = [
    `${emailDrafted} email draft${emailDrafted === 1 ? "" : "s"}`,
    gmailConnected ? `${emailPushedToGmail} pushed to Gmail` : "Gmail not connected",
    `${linkedinDrafted} LinkedIn draft${linkedinDrafted === 1 ? "" : "s"} staged in-app`,
  ].join(" · ");

  return prisma.notification.create({
    data: {
      userId,
      kind: "morning_outreach",
      title: "Today's outreach drafts are ready",
      body,
      actionUrl: "/businesses",
      payload: { leadIds: leads.map((l) => l.id), emailDrafted, emailPushedToGmail, linkedinDrafted } as unknown as Prisma.InputJsonValue,
    },
  });
}

export async function runMorningOutreachForAllUsers() {
  const users = await prisma.user.findMany({ select: { id: true } });
  const results = await Promise.allSettled(users.map((u) => runMorningOutreach(u.id)));
  return {
    total: users.length,
    succeeded: results.filter((r) => r.status === "fulfilled").length,
    failed: results.filter((r) => r.status === "rejected").length,
  };
}
