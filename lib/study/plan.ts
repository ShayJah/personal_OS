import type { Exam, Pack, Question } from "./pack";
import { daysBetween, dayKey, isDue, isWeak, type PlanKind, type Progress } from "./progress";

export type PlanItem = {
  kind: PlanKind;
  title: string;
  minutes: number;
  qids: string[];
  note: string;
  done: boolean;
};

export type ExamCountdown = {
  examId: string;
  /** null = no date supplied. A date from an unverified exam is shown but flagged, never trusted. */
  days: number | null;
  dateVerified: boolean;
};

export function examCountdown(exam: Exam, today: string): ExamCountdown {
  if (!exam.date) return { examId: exam.id, days: null, dateVerified: false };
  return { examId: exam.id, days: daysBetween(today, exam.date), dateVerified: exam.status === "verified" };
}

/** The upcoming exam with a date, else null. Unverified dates still sort but remain flagged by the caller. */
export function nextExam(pack: Pack, today: string): Exam | null {
  const dated = pack.exams.filter((e) => e.date && e.date >= today).sort((a, b) => a.date.localeCompare(b.date));
  return dated[0] ?? null;
}

const TIMED_TYPES = new Set(["num", "seq", "order", "written", "generated"]);

/**
 * Daily plan: short retrieval, timed problems, error review, spaced revisit.
 * Deterministic for a given pack/progress/day. Question ids never repeat across items.
 */
export function buildDailyPlan(pack: Pack, progress: Progress, now: Date, exam?: Exam | null): PlanItem[] {
  const today = dayKey(now);
  const focus = exam?.coverage.length ? new Set(exam.coverage) : null;
  const inFocus = (q: Question) => (!exam || q.courseId === exam.courseId) && (!focus || focus.has(q.topicId));
  const used = new Set<string>();
  const take = (qs: Question[], n: number) => {
    const out: string[] = [];
    for (const q of qs) {
      if (out.length >= n) break;
      if (used.has(q.id)) continue;
      used.add(q.id);
      out.push(q.id);
    }
    return out;
  };
  const card = (q: Question) => progress.cards[q.id];
  const done = progress.planDone[today] ?? [];

  const due = pack.questions
    .filter((q) => card(q) && isDue(card(q)!, today) && inFocus(q))
    .sort((a, b) => card(a)!.due.localeCompare(card(b)!.due) || card(a)!.box - card(b)!.box);
  const unseen = pack.questions.filter((q) => !card(q) && inFocus(q));
  const errors = pack.questions
    .filter((q) => card(q) && isWeak(card(q)!) && inFocus(q))
    .sort((a, b) => card(a)!.lastScore - card(b)!.lastScore);
  const spaced = pack.questions
    .filter((q) => card(q) && card(q)!.box >= 3 && isDue(card(q)!, today) && inFocus(q))
    .sort((a, b) => card(b)!.box - card(a)!.box);
  const timedPool = [...pack.questions.filter((q) => TIMED_TYPES.has(q.type) && inFocus(q) && (!card(q) || isWeak(card(q)!) || isDue(card(q)!, today))),
    ...pack.questions.filter((q) => TIMED_TYPES.has(q.type) && inFocus(q))];

  // Order matters: error review and spaced revisit claim their questions first so retrieval does not swallow them.
  const errIds = take(errors, 5);
  const spacedIds = take(spaced, 4);
  const retrievalIds = take([...due, ...unseen], 8);
  const timedIds = take(timedPool, 2);

  const mk = (kind: PlanKind, title: string, minutes: number, qids: string[], note: string): PlanItem => ({ kind, title, minutes, qids, note, done: done.includes(kind) });
  return [
    mk("retrieval", "Short retrieval", 10, retrievalIds, "Answer from memory first. Due cards come before new ones."),
    mk("timed", "Timed problems", 20, timedIds, "Set a timer and work without notes. Mark honestly."),
    mk("errors", "Error review", 10, errIds, "Redo recent misses, then write one line on what went wrong."),
    mk("spaced", "Spaced revisit", 5, spacedIds, "Older material coming back due."),
  ];
}
