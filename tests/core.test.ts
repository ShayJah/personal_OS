import { describe, expect, it, vi } from "vitest";

// Keep the Next/auth/DB graph out of plain-Node tests; only pure logic is under test.
vi.mock("@/lib/db", () => ({ prisma: {} }));
vi.mock("@/lib/crm", () => ({ getOwnedBusiness: vi.fn() }));
vi.mock("@/agents/runtime", () => ({ runAgenticTurn: vi.fn() }));
vi.mock("@/agents/definitions", () => ({ AGENTS: {} }));

import { isCronRequest } from "@/lib/api/cron";
import { toRfc2822 } from "@/lib/gmail";
import { parseBrief } from "@/lib/agents/daily-brief";
import { stageFromSheetRow, parseSheetDate } from "@/lib/sheet-sync";
import { toDateOnly } from "@/lib/date";
import { shareSettingsSchema } from "@/lib/validation/share";

const req = (auth?: string) => new Request("http://x", { headers: auth ? { authorization: auth } : {} });

describe("isCronRequest", () => {
  it("rejects 'Bearer undefined' when CRON_SECRET is unset", () => {
    vi.stubEnv("CRON_SECRET", "");
    expect(isCronRequest(req("Bearer undefined"))).toBe(false);
    expect(isCronRequest(req("Bearer "))).toBe(false);
  });
  it("accepts only the right secret", () => {
    vi.stubEnv("CRON_SECRET", "s3cret");
    expect(isCronRequest(req("Bearer s3cret"))).toBe(true);
    expect(isCronRequest(req("Bearer nope"))).toBe(false);
    expect(isCronRequest(req())).toBe(false);
  });
});

describe("toRfc2822", () => {
  it("cannot be header-injected through To or Subject", () => {
    const raw = toRfc2822({ to: "a@b.com\r\nBcc: evil@x.com", subject: "Hi\nBcc: evil@x.com", body: "body" });
    const headers = raw.split("\r\n\r\n")[0];
    expect(headers.split("\r\n").filter((l) => l.startsWith("Bcc"))).toHaveLength(0);
  });
  it("encodes non-ASCII subjects", () => {
    expect(toRfc2822({ to: "a@b.com", subject: "Café", body: "" })).toMatch(/Subject: =\?UTF-8\?B\?/);
  });
});

describe("parseBrief", () => {
  const json = '{"priorities":[{"title":"A","why":"x"}]}';
  it("parses plain and code-fenced JSON", () => {
    expect(parseBrief(json)).toHaveLength(1);
    expect(parseBrief("```json\n" + json + "\n```")).toHaveLength(1);
  });
  it("returns [] on garbage and caps at 5", () => {
    expect(parseBrief("nope")).toEqual([]);
    const many = JSON.stringify({ priorities: Array.from({ length: 9 }, (_, i) => ({ title: `t${i}`, why: "" })) });
    expect(parseBrief(many)).toHaveLength(5);
  });
});

describe("sheet helpers", () => {
  it("maps Response to a stage", () => {
    expect(stageFromSheetRow("Decline", null)).toBe("lost");
    expect(stageFromSheetRow("accept", null)).toBe("proposal");
    expect(stageFromSheetRow("", new Date())).toBe("contacted");
    expect(stageFromSheetRow(undefined, null)).toBe("lead");
  });
  it("ignores unparseable dates", () => {
    expect(parseSheetDate("not a date")).toBeNull();
    expect(parseSheetDate("2026-10-09")?.toISOString()).toBe("2026-10-09T00:00:00.000Z");
  });
});

describe("toDateOnly", () => {
  it("uses the user's timezone for 'today'", () => {
    const evening = new Date("2026-10-09T02:00:00Z"); // 7pm Oct 8 in Vancouver
    expect(toDateOnly(evening).toISOString()).toBe("2026-10-09T00:00:00.000Z");
    expect(toDateOnly(evening, "America/Vancouver").toISOString()).toBe("2026-10-08T00:00:00.000Z");
  });
});

describe("shareSettingsSchema", () => {
  it("rejects smuggled fields like profileId", () => {
    expect(shareSettingsSchema.safeParse({ shareTasks: true, profileId: "victim" }).success).toBe(false);
    expect(shareSettingsSchema.safeParse({ shareTasks: true }).success).toBe(true);
  });
});
