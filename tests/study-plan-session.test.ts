import { describe, expect, it } from "vitest";
import { DEMO_PACK } from "@/lib/study/demo-pack";
import { buildDailyPlan, examCountdown, nextExam } from "@/lib/study/plan";
import { buildSession, nextLabItem, retryMissed, summarize, type Result } from "@/lib/study/session";
import { emptyProgress, recordAttempt, markPlanDone } from "@/lib/study/progress";
import { gradeAnswer } from "@/lib/study/grade";
import type { Exam } from "@/lib/study/pack";

const NOW = new Date(2026, 10, 17, 12);
const later = (d: number) => new Date(2026, 10, 17 + d, 12);
const att = (qid: string, topicId: string, score: number, when = NOW) => (p: ReturnType<typeof emptyProgress>) =>
  recordAttempt(p, { qid, topicId, courseId: "demo-1", score, marking: "auto", origin: "generated", mode: "drill" }, when);
const fold = (...fs: Array<(p: ReturnType<typeof emptyProgress>) => ReturnType<typeof emptyProgress>>) => fs.reduce((p, f) => f(p), emptyProgress("demo", NOW));
const exam = (over: Partial<Exam> = {}): Exam => ({ id: "e", courseId: "demo-1", title: "", status: "unverified", sourceUrl: "", verifiedAt: "", date: "", time: "", timezone: "", coverage: [], ...over });

describe("exam countdown", () => {
  it("is null with no date, never invents one", () => {
    expect(examCountdown(exam(), "2026-11-17")).toEqual({ examId: "e", days: null, dateVerified: false });
  });
  it("flags unverified dates and counts days for verified ones", () => {
    expect(examCountdown(exam({ date: "2026-12-10" }), "2026-11-17")).toMatchObject({ days: 23, dateVerified: false });
    expect(examCountdown(exam({ date: "2026-12-10", status: "verified" }), "2026-11-17")).toMatchObject({ days: 23, dateVerified: true });
  });
  it("nextExam ignores undated and past exams", () => {
    const pack = { ...DEMO_PACK, exams: [exam({ id: "a" }), exam({ id: "b", date: "2026-01-01" }), exam({ id: "c", date: "2026-12-20" }), exam({ id: "d", date: "2026-12-01" })] };
    expect(nextExam(pack, "2026-11-17")?.id).toBe("d");
    expect(nextExam({ ...pack, exams: [exam()] }, "2026-11-17")).toBeNull();
  });
});

describe("daily plan", () => {
  it("has the four required blocks and never repeats a question", () => {
    const p = fold(att("q-bigo-1", "t-bigo", 0), att("q-stack-1", "t-stack", 1), att("q-motion-1", "t-motion", 0.2));
    const plan = buildDailyPlan(DEMO_PACK, p, later(3));
    expect(plan.map((i) => i.kind)).toEqual(["retrieval", "timed", "errors", "spaced"]);
    const all = plan.flatMap((i) => i.qids);
    expect(new Set(all).size).toBe(all.length);
    expect(all.every((id) => DEMO_PACK.questions.some((q) => q.id === id))).toBe(true);
  });
  it("puts recent misses in error review and due cards ahead of unseen ones in retrieval", () => {
    const p = fold(att("q-bigo-1", "t-bigo", 0), att("q-stack-1", "t-stack", 1));
    const plan = buildDailyPlan(DEMO_PACK, p, later(3));
    expect(plan.find((i) => i.kind === "errors")!.qids).toContain("q-bigo-1");
    const retrieval = plan.find((i) => i.kind === "retrieval")!.qids;
    expect(retrieval[0]).not.toBe("q-bigo-1"); // already claimed by error review
    expect(retrieval).toContain("q-stack-1"); // due, so ahead of unseen items
  });
  it("is deterministic and reflects completion marks for today only", () => {
    const p = markPlanDone(emptyProgress("demo", NOW), "2026-11-17", "timed", NOW);
    expect(buildDailyPlan(DEMO_PACK, p, NOW)).toEqual(buildDailyPlan(DEMO_PACK, p, NOW));
    expect(buildDailyPlan(DEMO_PACK, p, NOW).find((i) => i.kind === "timed")!.done).toBe(true);
    expect(buildDailyPlan(DEMO_PACK, p, later(1)).find((i) => i.kind === "timed")!.done).toBe(false);
  });
  it("restricts to exam coverage when the exam lists topics", () => {
    const plan = buildDailyPlan(DEMO_PACK, emptyProgress("demo", NOW), NOW, exam({ coverage: ["t-motion"] }));
    const topics = new Set(plan.flatMap((i) => i.qids).map((id) => DEMO_PACK.questions.find((q) => q.id === id)!.topicId));
    expect([...topics]).toEqual(["t-motion"]);
  });
  it("an empty pack gives an empty but well-formed plan", () => {
    const plan = buildDailyPlan({ ...DEMO_PACK, questions: [] }, emptyProgress("demo", NOW), NOW);
    expect(plan).toHaveLength(4);
    expect(plan.every((i) => i.qids.length === 0)).toBe(true);
  });
});

describe("sessions", () => {
  const base = { pack: DEMO_PACK, progress: emptyProgress("demo", NOW), now: NOW, seed: 7 };
  it("topic drill only draws the chosen topics", () => {
    const qs = buildSession({ ...base, mode: "drill", topicIds: ["t-stack"], length: 20 });
    expect(qs.length).toBeGreaterThan(0);
    expect(qs.every((q) => q.topicId === "t-stack")).toBe(true);
  });
  it("mock honours exam coverage and the length cap", () => {
    const qs = buildSession({ ...base, mode: "mock", exam: exam({ coverage: ["t-bigo"] }), length: 2 });
    expect(qs).toHaveLength(2);
    expect(qs.every((q) => q.topicId === "t-bigo")).toBe(true);
  });
  it("an exam without coverage cannot pull another course", () => {
    const pack = structuredClone(DEMO_PACK);
    pack.questions.push({ ...pack.questions[0], id: "foreign", courseId: "other" });
    const qs = buildSession({ ...base, pack, mode: "mock", exam: exam(), length: 100 });
    expect(qs.every(q => q.courseId === "demo-1")).toBe(true);
  });
  it("due and weak modes use scheduling state", () => {
    const p = fold(att("q-bigo-1", "t-bigo", 0), att("q-stack-1", "t-stack", 1));
    expect(buildSession({ ...base, progress: p, now: NOW, mode: "due" })).toHaveLength(0);
    expect(buildSession({ ...base, progress: p, now: later(3), mode: "due" }).map((q) => q.templateId).sort()).toEqual(["q-bigo-1", "q-stack-1"]);
    expect(buildSession({ ...base, progress: p, mode: "weak" }).map((q) => q.templateId)).toEqual(["q-bigo-1"]);
  });
  it("generated questions get fresh numbers per session seed but keep their template id", () => {
    const a = buildSession({ ...base, seed: 1, mode: "drill", topicIds: ["t-motion"] });
    const b = buildSession({ ...base, seed: 2, mode: "drill", topicIds: ["t-motion"] });
    const ga = a.find((q) => q.templateId === "q-motion-g")!;
    const gb = b.find((q) => q.templateId === "q-motion-g")!;
    expect(ga.id).not.toBe(gb.id);
    expect(ga.origin).toBe("generated");
  });
  it("the endless lab always yields a question and favours generated practice", () => {
    let gen = 0;
    for (let s = 0; s < 200; s++) {
      const q = nextLabItem(DEMO_PACK, s);
      expect(q).not.toBeNull();
      if (q!.seed !== undefined) gen++;
    }
    expect(gen).toBeGreaterThan(100);
    expect(nextLabItem({ ...DEMO_PACK, questions: [] }, 1)).toBeNull();
  });
  it("summaries split auto and self points, count revealed answers as zero, and drive retry-missed", () => {
    const qs = buildSession({ ...base, mode: "mock", length: 50 });
    const answerRight = (q: (typeof qs)[number]): Result => {
      const resp = { mc: { type: "mc", choice: (q as { answer: number }).answer }, num: { type: "num", text: String((q as { answer: number }).answer) }, written: { type: "written", selfScore: 1 } } as const;
      const r = (resp as Record<string, unknown>)[q.type] as Parameters<typeof gradeAnswer>[1] | undefined;
      return { q, grade: r ? gradeAnswer(q, r) : { score: 0, correct: false, marking: "auto", detail: "" } };
    };
    const results = qs.map(answerRight);
    const s = summarize(results);
    expect(s.n).toBe(qs.length);
    expect(s.possible).toBe(qs.reduce((a, q) => a + q.marks, 0));
    expect(s.selfEarned).toBe(2); // the one written question, 2 marks
    expect(s.earned).toBeCloseTo(s.autoEarned + s.selfEarned);
    expect(s.byTopic.reduce((a, t) => a + t.n, 0)).toBe(s.n);
    const revealed = summarize(results.map((r) => ({ ...r, revealed: true })));
    expect(revealed.earned).toBe(0);
    expect(revealed.correct).toBe(0);
    const retry = retryMissed(results, 3);
    expect(retry).toHaveLength(s.missed.length);
    expect(retry.every((q) => !results.find((r) => r.q === q)!.grade.correct)).toBe(true);
  });
});
