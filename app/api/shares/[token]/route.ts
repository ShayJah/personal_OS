import {
  getShareLinkByToken,
  getProgressSummary,
  getSharedReport,
  getShareSettings,
} from "@/lib/sharing";
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
            habitStreak: settings.shareHabits ? summary.week.habitStreak : 0,
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
