import { describe, expect, it } from "vitest";
import { emptyPack, parsePackText, validatePack, MAX_COURSES } from "@/lib/study/pack";
import { DEMO_PACK } from "@/lib/study/demo-pack";

const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));
const errs = (raw: unknown) => {
  const r = validatePack(raw);
  return r.ok ? [] : r.errors.join(" | ");
};

describe("pack validation", () => {
  it("accepts the demo pack and the empty pack", () => {
    expect(validatePack(DEMO_PACK).ok).toBe(true);
    expect(validatePack(emptyPack()).ok).toBe(true);
  });
  it("the empty pack has five blank unverified course slots and invents nothing", () => {
    const p = emptyPack();
    expect(p.courses).toHaveLength(MAX_COURSES);
    for (const c of p.courses) expect(c).toMatchObject({ code: "", title: "", canvasUrl: "", status: "unverified", verifiedAt: "" });
    expect(p.exams).toEqual([]);
    expect(p.topics).toEqual([]);
    expect(p.questions).toEqual([]);
  });
  it("the shipped demo pack has no real exam date and no official items", () => {
    expect(DEMO_PACK.exams.every((e) => e.date === "" && e.status === "unverified")).toBe(true);
    expect(DEMO_PACK.questions.every((q) => q.origin === "generated")).toBe(true);
  });
  it("rejects more than five courses", () => {
    const p = clone(emptyPack());
    p.courses.push({ ...p.courses[0], id: "slot-6" });
    expect(errs(p)).toMatch(/courses/);
  });
  it("a verified exam needs source URL, verified-at, date and timezone", () => {
    const p = clone(DEMO_PACK);
    p.exams[0].status = "verified";
    const e = errs(p);
    expect(e).toMatch(/source URL/);
    expect(e).toMatch(/verified-at/);
    expect(e).toMatch(/date/);
    expect(e).toMatch(/timezone/);
    Object.assign(p.exams[0], { sourceUrl: "https://example.edu/exam", verifiedAt: "2026-11-01", date: "2026-12-10", timezone: "America/Vancouver" });
    expect(validatePack(p).ok).toBe(true);
  });
  it("rejects unknown timezones, bad dates, and non-http URLs", () => {
    const p = clone(DEMO_PACK);
    p.exams[0].timezone = "Mars/Olympus";
    expect(errs(p)).toMatch(/timezone/);
    p.exams[0].timezone = "";
    p.exams[0].date = "12/10/2026";
    expect(errs(p)).toMatch(/YYYY-MM-DD/);
    p.exams[0].date = "";
    p.exams[0].sourceUrl = "javascript:alert(1)";
    expect(errs(p)).toMatch(/http/);
  });
  it("official questions need a source URL; generator output can never be official", () => {
    const p = clone(DEMO_PACK);
    p.questions[0].origin = "official";
    expect(errs(p)).toMatch(/official questions need a source URL/);
    p.questions[0].source.url = "https://example.edu/q1";
    expect(validatePack(p).ok).toBe(true);
    const g = p.questions.findIndex((q) => q.type === "generated");
    p.questions[g].origin = "official";
    p.questions[g].source.url = "https://example.edu/g";
    expect(errs(p)).toMatch(/never official/);
  });
  it("catches dangling references, duplicate ids and out-of-range answers", () => {
    const p = clone(DEMO_PACK);
    p.questions[0].topicId = "nope";
    expect(errs(p)).toMatch(/unknown topic/);
    const d = clone(DEMO_PACK);
    d.questions[1].id = d.questions[0].id;
    expect(errs(d)).toMatch(/duplicate id/);
    const o = clone(DEMO_PACK);
    (o.questions[0] as { answer: number }).answer = 9;
    expect(errs(o)).toMatch(/out of range/);
    const e = clone(DEMO_PACK);
    e.exams[0].coverage = ["ghost"];
    expect(errs(e)).toMatch(/unknown topic/);
  });
  it("parsePackText rejects non-JSON and wrong schema versions", () => {
    expect(parsePackText("{nope")).toEqual({ ok: false, errors: ["not valid JSON"] });
    expect(parsePackText(JSON.stringify({ ...DEMO_PACK, schema: "study-pack/9" })).ok).toBe(false);
    expect(parsePackText(JSON.stringify(DEMO_PACK)).ok).toBe(true);
  });
});

describe("additional integrity checks", () => {
  it("rejects impossible dates and times", () => {
    const p = structuredClone(DEMO_PACK);
    p.exams[0].date = "2026-02-30";
    expect(validatePack(p).ok).toBe(false);
    p.exams[0].date = "2026-02-28";
    p.exams[0].time = "25:92";
    expect(validatePack(p).ok).toBe(false);
  });
  it("rejects question topics from another course", () => {
    const p = structuredClone(DEMO_PACK);
    p.courses.push({ ...p.courses[0], id: "other" });
    p.questions[0].courseId = "other";
    expect(validatePack(p).ok).toBe(false);
  });
});
