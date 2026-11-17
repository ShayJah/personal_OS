import type { ConcreteQuestion } from "./generators";

/**
 * Grading is split by who decides the mark:
 *   auto — the app compares against a stored answer (mc, multi, num, match, order, seq)
 *   self — the student compares with a reference and marks themselves (written)
 * Both labels are carried through to progress so mastery never blends them silently.
 */
export type Marking = "auto" | "self";

export type Response =
  | { type: "mc"; choice: number | null }
  | { type: "multi"; choices: number[] }
  | { type: "num"; text: string }
  | { type: "match"; choices: string[] }
  | { type: "order"; order: number[] }
  | { type: "seq"; text: string }
  | { type: "written"; selfScore: 0 | 0.5 | 1 | null; text?: string };

export type Grade = { score: number; correct: boolean; marking: Marking; detail: string };

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const norm = (s: string) => s.toLowerCase().replace(/[[\](){},;]/g, " ").trim().split(/\s+/).filter(Boolean);

/** "3e8", "3x10^8", "3×10^8", "1,200" → number; NaN when not numeric. */
export function parseNum(s: string): number {
  const t = String(s).trim().replace(/,/g, "").replace(/\s*[x×*]\s*10\^?\s*/i, "e");
  return /^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i.test(t) ? Number(t) : NaN;
}

/** Integer answers must be exact; decimals get 1% relative unless the question sets tol. */
export function numOk(answer: number, tol: number | undefined, text: string): boolean {
  const x = parseNum(text);
  const t = tol ?? (Number.isInteger(answer) ? 0 : 0.01);
  return !Number.isNaN(x) && Math.abs(x - answer) <= Math.abs(answer) * t + 1e-12;
}

const fmt = (score: number, correct: boolean, marking: Marking, detail: string): Grade => ({ score: clamp01(score), correct, marking, detail });

export function isAnswered(q: ConcreteQuestion, r: Response): boolean {
  if (r.type !== q.type) return false;
  switch (r.type) {
    case "mc": return r.choice !== null;
    case "multi": return r.choices.length > 0;
    case "num": return r.text.trim() !== "";
    case "match": return r.choices.every((c) => c !== "");
    case "order": return true;
    case "seq": return r.text.trim() !== "";
    case "written": return r.selfScore !== null;
  }
}

export function gradeAnswer(q: ConcreteQuestion, r: Response): Grade {
  if (r.type !== q.type) throw new Error(`response type ${r.type} does not match question type ${q.type}`);
  switch (q.type) {
    case "mc": {
      const ok = (r as Extract<Response, { type: "mc" }>).choice === q.answer;
      return fmt(ok ? 1 : 0, ok, "auto", ok ? "Correct." : "Not the right option.");
    }
    case "multi": {
      const sel = [...new Set((r as Extract<Response, { type: "multi" }>).choices)];
      const hits = sel.filter((i) => q.answers.includes(i)).length;
      const wrong = sel.length - hits;
      const ok = hits === q.answers.length && wrong === 0;
      return fmt((hits - wrong) / q.answers.length, ok, "auto", `${hits} of ${q.answers.length} right, ${wrong} wrong pick${wrong === 1 ? "" : "s"}.`);
    }
    case "num": {
      const ok = numOk(q.answer, q.tol, (r as Extract<Response, { type: "num" }>).text);
      return fmt(ok ? 1 : 0, ok, "auto", ok ? "Within tolerance." : "Outside tolerance or not a number.");
    }
    case "match": {
      const ch = (r as Extract<Response, { type: "match" }>).choices;
      const right = q.pairs.filter((p, i) => ch[i] === p[1]).length;
      return fmt(right / q.pairs.length, right === q.pairs.length, "auto", `${right} of ${q.pairs.length} pairs right.`);
    }
    case "order": {
      const ord = (r as Extract<Response, { type: "order" }>).order;
      const right = q.steps.filter((_, i) => ord[i] === i).length;
      const valid = ord.length === q.steps.length;
      return fmt(valid ? right / q.steps.length : 0, valid && right === q.steps.length, "auto", `${right} of ${q.steps.length} positions right.`);
    }
    case "seq": {
      const want = norm(q.answer);
      const got = norm((r as Extract<Response, { type: "seq" }>).text);
      const right = want.filter((w, i) => got[i] === w).length;
      const ok = right === want.length && got.length === want.length;
      const extra = Math.max(0, got.length - want.length);
      return fmt((right - extra) / want.length, ok, "auto", ok ? "Exactly right." : `${right} of ${want.length} positions right.`);
    }
    case "written": {
      const s = (r as Extract<Response, { type: "written" }>).selfScore;
      if (s === null) return fmt(0, false, "self", "Not marked yet.");
      return fmt(s, s === 1, "self", "Self-marked against the reference answer.");
    }
  }
}
