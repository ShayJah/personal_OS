import { requireSession } from "@/lib/auth/dal";
import {
  createShareLink,
  getUserShareLinks,
  revokeShareLink,
  updateShareSettings,
  getShareSettings,
} from "@/lib/sharing";
import { assertBusinessOwner } from "@/lib/crm";
import { shareSettingsSchema, createShareSchema } from "@/lib/validation/share";
import { ZodError } from "zod";
import { NextResponse } from "next/server";

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

    if (body.action === "updateSettings") {
      const updated = await updateShareSettings(session.user.id, shareSettingsSchema.parse(body.settings));
      return NextResponse.json(updated);
    }

    const input = createShareSchema.parse(body);

    if (input.type === "business") {
      await assertBusinessOwner(session.user.id, input.businessId);
      const link = await createShareLink(session.user.id, "business", input.businessId, input.expiresIn, {
        detailLevel: input.detailLevel,
        allowEdit: Boolean(input.allowEdit),
      });
      return NextResponse.json(link);
    }

    const link = await createShareLink(session.user.id, input.type, input.target, input.expiresIn);
    return NextResponse.json(link);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
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

    await revokeShareLink(session.user.id, token);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error revoking share link:", error);
    return NextResponse.json(
      { error: "Failed to revoke share link" },
      { status: 500 }
    );
  }
}
