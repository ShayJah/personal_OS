import type { ConcreteQuestion } from "./generators";
import { mulberry32, realize } from "./generators";
import type { Exam, Pack, Question } from "./pack";
import type { Grade } from "./grade";
import { dayKey, isDue, isWeak, type Mode, type Progress } from "./progress";

/**
 * Session mechanics follow the Apricode/Unfold practice tools:
 * mock quiz, topic drill, endless lab, exam mode (feedback held until the end,
 * timer, navigator), results by topic, and "retry missed".
 */

export type SessionOpts = {
  pack: Pack;
  progress: Progress;
  mode: Mode;
  now: Date;
  seed: number;
  length?: number;
  topicIds?: string[];
  exam?: Exam;
  /** explicit question ids (plan items) */
  qids?: string[];
};

function shuffle<T>(xs: T[], r: () => number): T[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Interleave topics so a short session touches as many as possible. */
function roundRobin(qs: Question[], r: () => number): Question[] {
  const by = new Map<string, Question[]>();
  for (const q of shuffle(qs, r)) by.set(q.topicId, [...(by.get(q.topicId) ?? []), q]);
  const lists = shuffle([...by.values()], r);
  const out: Question[] = [];
  while (lists.some((l) => l.length)) for (const l of lists) if (l.length) out.push(l.shift()!);
  return out;
}

export function buildSession(o: SessionOpts): ConcreteQuestion[] {
  const r = mulberry32(o.seed);
  const today = dayKey(o.now);
  const len = o.length ?? 15;
  const cover = o.exam?.coverage.length ? new Set(o.exam.coverage) : null;
  let pool: Question[];
  switch (o.mode) {
    case "drill":
      pool = o.pack.questions.filter((q) => o.topicIds?.includes(q.topicId));
      break;
    case "due":
      pool = o.pack.questions.filter((q) => {
        const c = o.progress.cards[q.id];
        return c && isDue(c, today);
      });
      break;
    case "weak":
      pool = o.pack.questions.filter((q) => {
        const c = o.progress.cards[q.id];
        return c && isWeak(c);
      });
      break;
    case "plan":
      pool = o.pack.questions.filter((q) => o.qids?.includes(q.id));
      break;
    default:
      pool = cover ? o.pack.questions.filter((q) => cover.has(q.topicId)) : o.pack.questions;
  }
  // An exam without confirmed coverage still belongs to its course, never the whole pack.
  if (o.exam) pool = pool.filter((q) => q.courseId === o.exam!.courseId);
  const picked = o.mode === "plan" ? shuffle(pool, r) : roundRobin(pool, r);
  return picked.slice(0, len).map((q, i) => realize(q, (o.seed + i * 104729) >>> 0));
}

/** Endless lab: favour generated practice, then calculation/trace/written items. */
export function nextLabItem(pack: Pack, seed: number): ConcreteQuestion | null {
  const r = mulberry32(seed);
  const gens = pack.questions.filter((q) => q.type === "generated");
  const hands = pack.questions.filter((q) => ["num", "seq", "written", "order"].includes(q.type));
  const any = pack.questions;
  const pool = gens.length && (r() < 0.7 || !hands.length) ? gens : hands.length ? hands : any;
  if (!pool.length) return null;
  return realize(pool[Math.floor(r() * pool.length)], (seed ^ 0x9e3779b9) >>> 0);
}

export type Result = { q: ConcreteQuestion; grade: Grade; revealed?: boolean; seconds?: number };

export type TopicSummary = { topicId: string; n: number; points: number; earned: number; auto: number; self: number };
export type Summary = {
  n: number;
  correct: number;
  earned: number;
  possible: number;
  /** points from auto-marked vs self-marked questions, reported separately */
  autoEarned: number;
  selfEarned: number;
  byTopic: TopicSummary[];
  missed: Result[];
};

/** Revealed answers count as zero, as in Apricode. */
export const effectiveScore = (r: Result) => (r.revealed ? 0 : r.grade.score);

export function summarize(results: Result[]): Summary {
  const byTopic = new Map<string, TopicSummary>();
  let correct = 0, earned = 0, possible = 0, autoEarned = 0, selfEarned = 0;
  for (const r of results) {
    const s = effectiveScore(r) * r.q.marks;
    earned += s;
    possible += r.q.marks;
    if (!r.revealed && r.grade.correct) correct++;
    if (r.grade.marking === "auto") autoEarned += s;
    else selfEarned += s;
    const t = byTopic.get(r.q.topicId) ?? { topicId: r.q.topicId, n: 0, points: 0, earned: 0, auto: 0, self: 0 };
    t.n++;
    t.points += r.q.marks;
    t.earned += s;
    t[r.grade.marking]++;
    byTopic.set(r.q.topicId, t);
  }
  const missed = results.filter((r) => r.revealed || !r.grade.correct);
  return { n: results.length, correct, earned, possible, autoEarned, selfEarned, byTopic: [...byTopic.values()], missed };
}

/** "Retry missed": the same questions again, in a new order. */
export function retryMissed(results: Result[], seed: number): ConcreteQuestion[] {
  const missed = results.filter((r) => r.revealed || !r.grade.correct).map((r) => r.q);
  return shuffle(missed, mulberry32(seed));
}
