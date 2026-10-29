import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({ prisma: { sharedLink: { findUnique: vi.fn() } } }));
vi.mock("@/lib/db", () => db);
vi.mock("@/lib/user/preferences", () => ({ userToday: vi.fn() }));
vi.mock("@/lib/auth/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/crm", () => ({ grantBusinessCollaborator: vi.fn(), isBusinessMember: vi.fn() }));

const sharing = vi.hoisted(() => ({
  getShareLinkByToken: vi.fn(),
  getShareSettings: vi.fn(),
  getProgressSummary: vi.fn(),
  getSharedReport: vi.fn(),
  getBusinessShareData: vi.fn(),
}));

import { getShareLinkByToken } from "@/lib/sharing";
import { createShareSchema } from "@/lib/validation/share";

describe("getShareLinkByToken", () => {
  beforeEach(() => db.prisma.sharedLink.findUnique.mockReset());

  it("returns null once the link has expired", async () => {
    db.prisma.sharedLink.findUnique.mockResolvedValue({ token: "t", expiresAt: new Date(Date.now() - 1000) });
    expect(await getShareLinkByToken("t")).toBeNull();
  });
  it("returns links with no expiry or a future one", async () => {
    db.prisma.sharedLink.findUnique.mockResolvedValue({ token: "t", expiresAt: null });
    expect(await getShareLinkByToken("t")).not.toBeNull();
    db.prisma.sharedLink.findUnique.mockResolvedValue({ token: "t", expiresAt: new Date(Date.now() + 60_000) });
    expect(await getShareLinkByToken("t")).not.toBeNull();
  });
});

describe("createShareSchema", () => {
  it("rejects bad expiry and the removed 'summary' type", () => {
    expect(createShareSchema.safeParse({ type: "progress", expiresIn: "abc" }).success).toBe(false);
    expect(createShareSchema.safeParse({ type: "progress", expiresIn: -5 }).success).toBe(false);
    expect(createShareSchema.safeParse({ type: "summary" }).success).toBe(false);
  });
  it("accepts the shapes the UI sends", () => {
    expect(createShareSchema.safeParse({ type: "progress" }).success).toBe(true);
    expect(createShareSchema.safeParse({ type: "report", target: "r1" }).success).toBe(true);
    expect(
      createShareSchema.safeParse({ type: "business", businessId: "b1", detailLevel: "full", allowEdit: true }).success
    ).toBe(true);
  });
});

describe("progress share route", () => {
  it("hides task counts when shareTasks is off", async () => {
    vi.resetModules();
    vi.doMock("@/lib/sharing", () => sharing);
    sharing.getShareLinkByToken.mockResolvedValue({ type: "progress", userId: "u1", user: { name: "A", email: "a@x.com" } });
    sharing.getShareSettings.mockResolvedValue({
      shareProgressPage: true, shareTasks: false, shareHabits: true, shareHighlights: false,
    });
    sharing.getProgressSummary.mockResolvedValue({
      today: { tasksCompleted: 3, tasksTotal: 5, completionRate: 60, priorities: ["secret"] },
      week: { tasksCompleted: 9, tasksTotal: 10, completionRate: 90, habitLogsCompleted: 4, habitsDoneToday: 1 },
      habits: [{ name: "run", completedToday: true }],
    });

    const { GET } = await import("@/app/api/shares/[token]/route");
    const res = await GET(new Request("http://x"), { params: Promise.resolve({ token: "t" }) });
    const { shareData } = await res.json();

    expect(shareData.today).toEqual({ tasksCompleted: 0, tasksTotal: 0, completionRate: 0, priorities: [] });
    expect(shareData.week.tasksTotal).toBe(0);
    expect(shareData.habits).toHaveLength(1);
  });
});
