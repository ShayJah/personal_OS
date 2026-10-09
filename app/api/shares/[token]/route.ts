import {
  getShareLinkByToken,
  getProgressSummary,
  getSharedReport,
  getShareSettings,
  getBusinessShareData,
  type BusinessDetailLevel,
} from "@/lib/sharing";
import { grantBusinessCollaborator, isBusinessMember } from "@/lib/crm";
import { auth } from "@/lib/auth/auth";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const share = await getShareLinkByToken(token);

    if (!share) {
      return NextResponse.json(
        { error: "Share link not found or expired" },
        { status: 404 }
      );
    }

    const settings = await getShareSettings(share.userId);
    const userName = share.user.name || share.user.email;

    if (share.type === "progress") {
      if (!settings?.shareProgressPage) {
        return NextResponse.json(
          { error: "This progress page is no longer shared" },
          { status: 403 }
        );
      }

      const summary = await getProgressSummary(share.userId);
      return NextResponse.json({
        shareData: {
          today: {
            tasksCompleted: settings.shareTasks ? summary.today.tasksCompleted : 0,
            tasksTotal: settings.shareTasks ? summary.today.tasksTotal : 0,
            completionRate: settings.shareTasks ? summary.today.completionRate : 0,
            priorities: settings.shareHighlights ? summary.today.priorities : [],
          },
          week: {
            tasksCompleted: settings.shareTasks ? summary.week.tasksCompleted : 0,
            tasksTotal: settings.shareTasks ? summary.week.tasksTotal : 0,
            completionRate: settings.shareTasks ? summary.week.completionRate : 0,
            habitLogsCompleted: settings.shareHabits ? summary.week.habitLogsCompleted : 0,
            habitsDoneToday: settings.shareHabits ? summary.week.habitsDoneToday : 0,
          },
          habits: settings.shareHabits ? summary.habits : [],
        },
        userName,
        type: "progress",
      });
    }

    if (share.type === "report") {
      if (!settings?.shareReports || !share.target) {
        return NextResponse.json(
          { error: "This report is no longer shared" },
          { status: 403 }
        );
      }

      const report = await getSharedReport(share.userId, share.target);
      if (!report) {
        return NextResponse.json(
          { error: "Report not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        report: {
          type: report.type,
          content: report.content,
          periodStart: report.periodStart,
          periodEnd: report.periodEnd,
        },
        userName,
        type: "report",
      });
    }

    if (share.type === "business") {
      if (!share.target) {
        return NextResponse.json(
          { error: "This business plan is no longer shared" },
          { status: 403 }
        );
      }

      const detailLevel = (share.detailLevel as BusinessDetailLevel) || "overview";
      const data = await getBusinessShareData(share.userId, share.target, detailLevel);
      if (!data) {
        return NextResponse.json({ error: "Business not found" }, { status: 404 });
      }

      // Viewing never changes access; joining is an explicit POST below.
      const viewerId = share.allowEdit ? (await auth())?.user?.id : undefined;
      const canEdit = Boolean(viewerId) && (await isBusinessMember(viewerId!, share.target));
      const canJoin = Boolean(share.allowEdit && viewerId && !canEdit);

      return NextResponse.json({
        ...data,
        businessId: share.target,
        detailLevel,
        userName,
        canEdit,
        canJoin,
        signedIn: Boolean(viewerId),
        type: "business",
      });
    }

    return NextResponse.json(
      { error: "Share type not supported yet" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error fetching shared content:", error);
    return NextResponse.json(
      { error: "Failed to fetch shared content" },
      { status: 500 }
    );
  }
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const share = await getShareLinkByToken(token);
  if (!share || share.type !== "business" || !share.target || !share.allowEdit) {
    return NextResponse.json({ error: "This link does not grant edit access" }, { status: 403 });
  }
  const viewerId = (await auth())?.user?.id;
  if (!viewerId) return NextResponse.json({ error: "Sign in first" }, { status: 401 });

  await grantBusinessCollaborator(share.target, viewerId);
  return NextResponse.json({ ok: true });
}
