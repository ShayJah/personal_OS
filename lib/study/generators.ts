import type { Pack, Question } from "./pack";

/** Deterministic PRNG so generated practice is reproducible in tests and in saved attempts. */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type ConcreteQuestion = Exclude<Question, { type: "generated" }> & {
  /** id of the pack question this came from; progress is tracked per template for generated items. */
  templateId: string;
  seed?: number;
};

type Rng = () => number;
const ri = (r: Rng, a: number, b: number) => a + Math.floor(r() * (b - a + 1));

function traceOps(r: Rng, kind: "stack" | "queue") {
  for (;;) {
    const n = ri(r, 6, 8);
    const items: number[] = [];
    const ops: string[] = [];
    const steps: string[] = [];
    for (let i = 0; i < n; i++) {
      const canRemove = items.length > 1;
      if (canRemove && r() < 0.35) {
        const gone = kind === "stack" ? items.pop()! : items.shift()!;
        ops.push(kind === "stack" ? "pop" : "dequeue");
        steps.push(`${ops[ops.length - 1]} removes ${gone} → [${items.join(" ")}]`);
      } else {
        const v = ri(r, 1, 9);
        items.push(v);
        ops.push(`${kind === "stack" ? "push" : "enqueue"} ${v}`);
        steps.push(`${ops[ops.length - 1]} → [${items.join(" ")}]`);
      }
    }
    if (items.length > 0 && ops.some((o) => o === "pop" || o === "dequeue")) return { ops, items, steps };
  }
}

export function realize(q: Question, seed: number): ConcreteQuestion {
  if (q.type !== "generated") return { ...q, templateId: q.id };
  const r = mulberry32(seed);
  const common = {
    id: `${q.id}#${seed}`,
    templateId: q.id,
    seed,
    courseId: q.courseId,
    topicId: q.topicId,
    origin: "generated" as const,
    source: q.source,
    marks: q.marks,
  };
  if (q.generator === "stack-trace" || q.generator === "queue-trace") {
    const kind = q.generator === "stack-trace" ? "stack" : "queue";
    const t = traceOps(r, kind);
    const order = kind === "stack" ? "bottom → top" : "front → back";
    return {
      ...common,
      type: "seq",
      prompt: `Start with an empty ${kind}. Write the contents ${order} after: ${t.ops.join(", ")}`,
      answer: t.items.join(" "),
      explanation: t.steps.join("; ") + ".",
    };
  }
  const v0 = ri(r, 0, 10);
  const a = 2 * ri(r, 1, 4);
  const t = ri(r, 2, 8);
  const d = v0 * t + (a * t * t) / 2;
  return {
    ...common,
    type: "num",
    prompt: `An object starts at ${v0} m/s and accelerates uniformly at ${a} m/s² for ${t} s. How far does it travel?`,
    answer: d,
    unit: "m",
    explanation: `d = v₀t + ½at² = ${v0}(${t}) + ½(${a})(${t})² = ${d} m.`,
  };
}

/** Fixed pack questions plus one fresh instance per generator template. */
export function realizeAll(pack: Pack, seed: number): ConcreteQuestion[] {
  return pack.questions.map((q, i) => realize(q, (seed + i * 7919) >>> 0));
}
