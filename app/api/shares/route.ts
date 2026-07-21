import { requireSession } from "@/lib/auth/dal";
import {
  createShareLink,
  getUserShareLinks,
  revokeShareLink,
  updateShareSettings,
  getShareSettings,
  type BusinessDetailLevel,
} from "@/lib/sharing";
import { getOwnedBusiness } from "@/lib/crm";
import { NextResponse } from "next/server";

const BUSINESS_DETAIL_LEVELS: BusinessDetailLevel[] = ["overview", "pipeline", "full"];

export async function GET(request: Request) {
  try {
    const session = await requireSession();

    const links = await getUserShareLinks(session.user.id);
    const settings = await getShareSettings(session.user.id);

    return NextResponse.json({ links, settings });
  } catch (error) {
    console.error("Error fetching share links:", error);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const body = await request.json();

    const { type, target, expiresIn, action, settings } = body;

    if (action === "updateSettings") {
      const updated = await updateShareSettings(session.user.id, settings);
      return NextResponse.json(updated);
    }

    if (type === "business") {
      const businessId = body.businessId;
      const detailLevel = body.detailLevel;
      const allowEdit = Boolean(body.allowEdit);

      if (!businessId || !BUSINESS_DETAIL_LEVELS.includes(detailLevel)) {
        return NextResponse.json({ error: "Invalid request" }, { status: 400 });
      }

      await getOwnedBusiness(session.user.id, businessId);

      const link = await createShareLink(
        session.user.id,
        "business",
        businessId,
        expiresIn,
        { detailLevel, allowEdit }
      );
      return NextResponse.json(link);
    }

    if (type && (type === "progress" || type === "report" || type === "summary")) {
      const link = await createShareLink(session.user.id, type, target, expiresIn);
      return NextResponse.json(link);
    }

    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error creating share link:", error);
    return NextResponse.json(
      { error: "Failed to create share link" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await requireSession();
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { error: "Token is required" },
        { status: 400 }
      );
    }

    await revokeShareLink(token);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error revoking share link:", error);
    return NextResponse.json(
      { error: "Failed to revoke share link" },
      { status: 500 }
    );
  }
}
