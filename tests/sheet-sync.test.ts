import { beforeEach, describe, expect, it, vi } from "vitest";

const m = vi.hoisted(() => ({
  prisma: {
    $executeRaw: vi.fn(),
    business: { update: vi.fn() },
    crmRecord: { findMany: vi.fn(), update: vi.fn(), create: vi.fn() },
    contact: { findMany: vi.fn(), update: vi.fn(), create: vi.fn() },
    activity: { create: vi.fn() },
  },
  getOwnedBusiness: vi.fn(),
  fetchSheetRows: vi.fn(),
}));
vi.mock("@/lib/db", () => ({ prisma: m.prisma }));
vi.mock("@/lib/crm", () => ({ getOwnedBusiness: m.getOwnedBusiness }));
vi.mock("@/lib/google-sheets", () => ({
  fetchSheetRows: m.fetchSheetRows,
  listTabNames: vi.fn().mockResolvedValue(["CRM", "Business"]),
  writeSheetRows: vi.fn(),
  addTab: vi.fn(),
  createSpreadsheet: vi.fn(),
  sheetUrl: (id: string) => id,
}));

import { syncBusinessSheet } from "@/lib/sheet-sync";

const HEADER = ["ID", "Name", "Company", "Job Title", "Email", "LinkedIn", "Source", "Stage", "Notes", "Reach Out Date", "Last Contacted", "Next Follow-up", "Meeting Date", "Response"];
const ROW = ["r1", "Ann", "", "", "", "", "", "", "", "", "", "", "", ""]; // Email cell was cleared in the sheet

function setup(recordUpdatedAt: Date) {
  const synced = new Date("2026-10-01T00:00:00Z");
  m.getOwnedBusiness.mockResolvedValue({
    id: "b1", name: "Biz", description: null, contextDoc: null, crmSheetId: "s1", crmSheetTab: "CRM",
    sheetSyncedAt: synced, updatedAt: synced,
  });
  m.fetchSheetRows.mockImplementation(async (_u: string, _s: string, tab: string) => (tab === "CRM" ? [HEADER, [...ROW]] : []));
  const contact = { id: "c1", userId: "u1", name: "Ann", email: "ann@x.com", company: null, role: null, linkedin: null, notes: null };
  m.prisma.crmRecord.findMany.mockResolvedValue([
    { id: "r1", businessId: "b1", contactId: "c1", stage: "lead", updatedAt: recordUpdatedAt, contact, source: null, lastTouchAt: null, nextAction: null, nextActionAt: null },
  ]);
  m.prisma.contact.findMany.mockResolvedValue([contact]);
}

describe("syncBusinessSheet", () => {
  beforeEach(() => {
    Object.values(m.prisma).forEach((v) => (typeof v === "function" ? v.mockReset() : Object.values(v).forEach((f) => f.mockReset())));
    m.fetchSheetRows.mockReset();
    m.prisma.$executeRaw.mockResolvedValue(1);
  });

  it("lets the app win for a lead edited in the app since the last sync", async () => {
    setup(new Date("2026-10-02T00:00:00Z"));
    await syncBusinessSheet("u1", "b1");
    expect(m.prisma.contact.update).not.toHaveBeenCalled();
  });

  it("lets the sheet win otherwise, and a cleared cell clears the app value", async () => {
    setup(new Date("2026-09-30T00:00:00Z"));
    await syncBusinessSheet("u1", "b1");
    expect(m.prisma.contact.update.mock.calls[0][0].data.email).toBeNull();
  });

  it("refuses to run while another sync holds the lock", async () => {
    setup(new Date("2026-09-30T00:00:00Z"));
    m.prisma.$executeRaw.mockResolvedValueOnce(0);
    await expect(syncBusinessSheet("u1", "b1")).rejects.toThrow(/already running/);
    expect(m.fetchSheetRows).not.toHaveBeenCalled();
  });
});
