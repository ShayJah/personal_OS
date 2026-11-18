import { describe, expect, it } from "vitest";
import { gradeAnswer, isAnswered, numOk, parseNum, type Response } from "@/lib/study/grade";
import { mulberry32, realize, realizeAll, type ConcreteQuestion } from "@/lib/study/generators";
import { DEMO_PACK } from "@/lib/study/demo-pack";

const base = { id: "q", templateId: "q", courseId: "c", topicId: "t", origin: "generated" as const, source: { label: "x", url: "" }, explanation: "", marks: 1, prompt: "p" };
const q = <T extends object>(x: T) => ({ ...base, ...x }) as unknown as ConcreteQuestion;

/** The response that a perfect student would give. */
function perfect(c: ConcreteQuestion): Response {
  switch (c.type) {
    case "mc": return { type: "mc", choice: c.answer };
    case "multi": return { type: "multi", choices: [...c.answers] };
    case "num": return { type: "num", text: String(c.answer) };
    case "match": return { type: "match", choices: c.pairs.map((p) => p[1]) };
    case "order": return { type: "order", order: c.steps.map((_, i) => i) };
    case "seq": return { type: "seq", text: c.answer };
    case "written": return { type: "written", selfScore: 1 };
  }
}

describe("parseNum / numOk", () => {
  it("parses scientific and comma forms, rejects junk", () => {
    expect(parseNum("3e8")).toBe(3e8);
    expect(parseNum("3x10^8")).toBe(3e8);
    expect(parseNum("3×10^8")).toBe(3e8);
    expect(parseNum("1,200")).toBe(1200);
    expect(parseNum("abc")).toBeNaN();
    expect(parseNum("")).toBeNaN();
    expect(parseNum("1 2")).toBeNaN();
  });
  it("integers must be exact, decimals get 1%, tol overrides", () => {
    expect(numOk(25, undefined, "25")).toBe(true);
    expect(numOk(25, undefined, "25.1")).toBe(false);
    expect(numOk(9.81, undefined, "9.85")).toBe(true);
    expect(numOk(9.81, undefined, "10.5")).toBe(false);
    expect(numOk(100, 0.02, "101.9")).toBe(true);
    expect(numOk(100, 0.02, "103")).toBe(false);
    expect(numOk(0, undefined, "0.001")).toBe(false);
  });
});

describe("gradeAnswer", () => {
  it("mc is all-or-nothing and auto-marked", () => {
    const m = q({ type: "mc", options: ["a", "b"], answer: 1 });
    expect(gradeAnswer(m, { type: "mc", choice: 1 })).toMatchObject({ score: 1, correct: true, marking: "auto" });
    expect(gradeAnswer(m, { type: "mc", choice: 0 })).toMatchObject({ score: 0, correct: false });
    expect(gradeAnswer(m, { type: "mc", choice: null }).score).toBe(0);
  });
  it("multi gives (right - wrong) / answers, floored at 0, ignoring duplicate picks", () => {
    const m = q({ type: "multi", options: ["a", "b", "c", "d"], answers: [0, 2] });
    expect(gradeAnswer(m, { type: "multi", choices: [0, 2] }).score).toBe(1);
    expect(gradeAnswer(m, { type: "multi", choices: [0] }).score).toBe(0.5);
    expect(gradeAnswer(m, { type: "multi", choices: [0, 1] }).score).toBe(0);
    expect(gradeAnswer(m, { type: "multi", choices: [1, 3] }).score).toBe(0);
    expect(gradeAnswer(m, { type: "multi", choices: [0, 0, 2] }).correct).toBe(true);
  });
  it("match and order give per-part credit", () => {
    const m = q({ type: "match", pairs: [["a", "1"], ["b", "2"], ["c", "3"], ["d", "4"]] });
    expect(gradeAnswer(m, { type: "match", choices: ["1", "2", "3", ""] }).score).toBe(0.75);
    const o = q({ type: "order", steps: ["s0", "s1", "s2", "s3"] });
    expect(gradeAnswer(o, { type: "order", order: [0, 1, 3, 2] }).score).toBe(0.5);
    expect(gradeAnswer(o, { type: "order", order: [0, 1] }).score).toBe(0); // malformed → no credit
  });
  it("seq: positional partial credit, penalises extra items, tolerates brackets and case", () => {
    const s = q({ type: "seq", answer: "4 1 3" });
    expect(gradeAnswer(s, { type: "seq", text: "[4, 1, 3]" }).correct).toBe(true);
    expect(gradeAnswer(s, { type: "seq", text: "4 1 9" }).score).toBeCloseTo(2 / 3);
    expect(gradeAnswer(s, { type: "seq", text: "4 1 3 7" }).correct).toBe(false);
    expect(gradeAnswer(s, { type: "seq", text: "4 1 3 7" }).score).toBeCloseTo(2 / 3);
    expect(gradeAnswer(s, { type: "seq", text: "" }).score).toBe(0);
  });
  it("written is labelled self-marked and trusts only the 0 / 0.5 / 1 the student chose", () => {
    const w = q({ type: "written", reference: "ref", rubric: [] });
    expect(gradeAnswer(w, { type: "written", selfScore: 0.5 })).toMatchObject({ score: 0.5, correct: false, marking: "self" });
    expect(gradeAnswer(w, { type: "written", selfScore: 1 }).correct).toBe(true);
    expect(gradeAnswer(w, { type: "written", selfScore: null }).score).toBe(0);
    expect(isAnswered(w, { type: "written", selfScore: null })).toBe(false);
  });
  it("refuses a response of the wrong type", () => {
    expect(() => gradeAnswer(q({ type: "mc", options: ["a", "b"], answer: 0 }), { type: "num", text: "1" })).toThrow();
  });
});

describe("question banks grade themselves", () => {
  it("every demo-pack question accepts its own answer", () => {
    for (const c of realizeAll(DEMO_PACK, 1)) {
      expect(gradeAnswer(c, perfect(c)).score, c.id).toBe(1);
      expect(isAnswered(c, perfect(c)), c.id).toBe(true);
    }
  });
  it("each generator yields gradeable questions across 300 seeds", () => {
    for (const t of DEMO_PACK.questions.filter((x) => x.type === "generated")) {
      for (let seed = 0; seed < 300; seed++) {
        const c = realize(t, seed);
        expect((c.type as string) === "generated").toBe(false);
        expect(c.origin).toBe("generated");
        expect(gradeAnswer(c, perfect(c)).correct, `${t.id}#${seed}`).toBe(true);
      }
    }
  });
  it("generation is deterministic per seed and varies across seeds", () => {
    const t = DEMO_PACK.questions.find((x) => x.id === "q-stack-g")!;
    expect(realize(t, 5)).toEqual(realize(t, 5));
    const prompts = new Set(Array.from({ length: 30 }, (_, i) => (realize(t, i) as { prompt: string }).prompt));
    expect(prompts.size).toBeGreaterThan(20);
  });
  it("stack and queue traces match an independent simulation of the prompt", () => {
    for (const [id, kind] of [["q-stack-g", "stack"], ["q-queue-g", "queue"]] as const) {
      const t = DEMO_PACK.questions.find((x) => x.id === id)!;
      for (let seed = 0; seed < 200; seed++) {
        const c = realize(t, seed) as Extract<ConcreteQuestion, { type: "seq" }>;
        const ops = c.prompt.split(": ")[1].split(", ");
        const items: number[] = [];
        for (const op of ops) {
          const [name, v] = op.split(" ");
          if (name === "push" || name === "enqueue") items.push(Number(v));
          else if (name === "pop") items.pop();
          else items.shift();
        }
        expect(c.answer, `${kind}#${seed}`).toBe(items.join(" "));
        expect(items.length).toBeGreaterThan(0);
      }
    }
  });
  it("mulberry32 is stable", () => {
    const a = mulberry32(42), b = mulberry32(42);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });
});
