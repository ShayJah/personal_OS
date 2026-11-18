import { z } from "zod";
import type { Marking } from "./grade";
import type { Pack } from "./pack";

/**
 * Progress lives only in this browser (localStorage). It is never sent to the
 * server. Export a backup regularly: clearing site data deletes it.
 */

export const PROGRESS_SCHEMA = "study-progress/1" as const;
export const MAX_ATTEMPTS = 20000;
export const INTERVALS_DAYS = [1, 2, 4, 8, 16, 32] as const; // by box 1..6
export const PACK_KEY = "study:pack:v1";
export const progressKey = (packId: string) => `study:progress:v1:${packId}`;

const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const iso = z.string().max(40).refine((s) => !Number.isNaN(Date.parse(s)), "not a date");
const safeKey = z.string().min(1).max(120).refine((k) => !["__proto__", "constructor", "prototype"].includes(k), "reserved key");

export const MODES = ["mock", "drill", "lab", "due", "weak", "retry", "plan"] as const;
export type Mode = (typeof MODES)[number];

const attemptSchema = z.object({
  qid: safeKey,
  topicId: safeKey,
  courseId: safeKey,
  at: iso,
  day,
  score: z.number().min(0).max(1),
  marking: z.enum(["auto", "self"]),
  origin: z.enum(["official", "generated"]),
  mode: z.enum(MODES),
  seconds: z.number().min(0).max(86400).optional(),
});

const cardSchema = z.object({
  box: z.number().int().min(1).max(6),
  due: day,
  lapses: z.number().int().min(0).max(10000),
  seen: z.number().int().min(1).max(100000),
  lastScore: z.number().min(0).max(1),
  lastAt: iso,
  lastMarking: z.enum(["auto", "self"]),
  topicId: safeKey,
});

export const PLAN_KINDS = ["retrieval", "timed", "errors", "spaced"] as const;
export type PlanKind = (typeof PLAN_KINDS)[number];

export const progressSchema = z.object({
  schema: z.literal(PROGRESS_SCHEMA),
  packId: safeKey,
  updatedAt: iso,
  exportedAt: iso.optional(),
  attempts: z.array(attemptSchema).max(MAX_ATTEMPTS),
  cards: z.record(safeKey, cardSchema).refine((c) => Object.keys(c).length <= 10000, "too many cards"),
  planDone: z.record(day, z.array(z.enum(PLAN_KINDS)).max(4)).refine((c) => Object.keys(c).length <= 800, "too many plan days"),
});

export type Attempt = z.infer<typeof attemptSchema>;
export type Card = z.infer<typeof cardSchema>;
export type Progress = z.infer<typeof progressSchema>;

export type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export function emptyProgress(packId: string, now: Date): Progress {
  return { schema: PROGRESS_SCHEMA, packId, updatedAt: now.toISOString(), attempts: [], cards: {}, planDone: {} };
}

/** Local calendar day as YYYY-MM-DD. */
export function dayKey(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function addDays(key: string, n: number): string {
  const [y, m, d] = key.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + n));
  return t.toISOString().slice(0, 10);
}

export function daysBetween(from: string, to: string): number {
  const f = (k: string) => {
    const [y, m, d] = k.split("-").map(Number);
    return Date.UTC(y, m - 1, d);
  };
  return Math.round((f(to) - f(from)) / 86_400_000);
}

export type AttemptInput = {
  qid: string; // template id for generated questions
  topicId: string;
  courseId: string;
  score: number;
  marking: Marking;
  origin: "official" | "generated";
  mode: Mode;
  seconds?: number;
};

/** Pure: returns a new Progress with the attempt logged and the card rescheduled. */
export function recordAttempt(p: Progress, a: AttemptInput, now: Date): Progress {
  const today = dayKey(now);
  const score = Math.min(1, Math.max(0, a.score));
  const prev = p.cards[a.qid];
  let box = prev?.box ?? 1;
  let lapses = prev?.lapses ?? 0;
  if (score >= 0.8) box = Math.min(6, box + 1);
  else if (score < 0.5) {
    box = 1;
    if (prev) lapses += 1; // a first miss is not a lapse
  }
  const card: Card = {
    box,
    due: addDays(today, INTERVALS_DAYS[box - 1]),
    lapses,
    seen: (prev?.seen ?? 0) + 1,
    lastScore: score,
    lastAt: now.toISOString(),
    lastMarking: a.marking,
    topicId: a.topicId,
  };
  const attempt: Attempt = { ...a, score, at: now.toISOString(), day: today };
  const attempts = [...p.attempts, attempt].slice(-MAX_ATTEMPTS);
  return { ...p, updatedAt: now.toISOString(), attempts, cards: { ...p.cards, [a.qid]: card } };
}

export function markPlanDone(p: Progress, today: string, kind: PlanKind, now: Date): Progress {
  const cur = p.planDone[today] ?? [];
  if (cur.includes(kind)) return p;
  return { ...p, updatedAt: now.toISOString(), planDone: { ...p.planDone, [today]: [...cur, kind] } };
}

export const isDue = (c: Card, today: string) => c.due <= today;
/** Weak = last result under 70%, or on box 1 with a lapse. */
export const isWeak = (c: Card) => c.lastScore < 0.7 || (c.box === 1 && c.lapses > 0);

export type Mastery = { n: number; avg: number | null };
export type TopicMastery = {
  topicId: string;
  /** Auto-marked and self-marked results are never blended into one number. */
  auto: Mastery;
  self: Mastery;
  level: "no data" | "not enough data" | "weak" | "developing" | "strong";
};

export const MIN_ATTEMPTS_FOR_LEVEL = 5;

export function topicMastery(p: Progress, topicId: string): TopicMastery {
  const agg = (m: Marking): Mastery => {
    const xs = p.attempts.filter((a) => a.topicId === topicId && a.marking === m);
    return { n: xs.length, avg: xs.length ? xs.reduce((s, a) => s + a.score, 0) / xs.length : null };
  };
  const auto = agg("auto");
  const self = agg("self");
  let level: TopicMastery["level"] = "no data";
  if (auto.n + self.n > 0) level = "not enough data";
  // Level uses auto-marked results only; self-marked are shown but not trusted for a verdict.
  if (auto.n >= MIN_ATTEMPTS_FOR_LEVEL && auto.avg !== null) {
    level = auto.avg >= 0.85 ? "strong" : auto.avg >= 0.6 ? "developing" : "weak";
  }
  return { topicId, auto, self, level };
}

/* ---------------- persistence ---------------- */

export type LoadResult = { progress: Progress; notice?: string };

export function loadProgress(storage: StorageLike, packId: string, now: Date): LoadResult {
  const key = progressKey(packId);
  let raw: string | null = null;
  try {
    raw = storage.getItem(key);
  } catch {
    return { progress: emptyProgress(packId, now), notice: "Browser storage is unavailable; progress will not be saved." };
  }
  if (raw === null) return { progress: emptyProgress(packId, now) };
  try {
    const r = progressSchema.safeParse(JSON.parse(raw));
    if (r.success && r.data.packId === packId) return { progress: r.data };
  } catch {
    /* fall through to recovery */
  }
  try {
    storage.setItem(`${key}:corrupt`, raw);
  } catch {
    /* best effort */
  }
  return {
    progress: emptyProgress(packId, now),
    notice: "Saved progress could not be read. A copy was kept under a recovery key; starting fresh.",
  };
}

export function saveProgress(storage: StorageLike, p: Progress): { ok: true } | { ok: false; error: string } {
  try {
    storage.setItem(progressKey(p.packId), JSON.stringify(p));
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not save to browser storage (full or blocked). Export a backup now." };
  }
}

export function resetProgress(storage: StorageLike, packId: string, now: Date): Progress {
  try {
    storage.removeItem(progressKey(packId));
  } catch {
    /* ignore */
  }
  return emptyProgress(packId, now);
}

export function exportProgress(p: Progress, now: Date): string {
  return JSON.stringify({ ...p, exportedAt: now.toISOString() }, null, 2);
}

const RESERVED = new Set(["__proto__", "constructor", "prototype"]);
/** Deep scan for keys that could be abused for prototype pollution. JSON.parse makes "__proto__" an own key. */
export function hasReservedKey(v: unknown, depth = 0): boolean {
  if (depth > 8 || v === null || typeof v !== "object") return false;
  if (Array.isArray(v)) return v.some((x) => hasReservedKey(x, depth + 1));
  return Object.keys(v).some((k) => RESERVED.has(k) || hasReservedKey((v as Record<string, unknown>)[k], depth + 1));
}

export type ImportResult =
  | { ok: true; progress: Progress; added: { attempts: number; cards: number } }
  | { ok: false; errors: string[] };

export function importProgress(text: string, pack: Pick<Pack, "packId">, current: Progress, mode: "replace" | "merge"): ImportResult {
  if (text.length > 20_000_000) return { ok: false, errors: ["file is larger than 20 MB"] };
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, errors: ["not valid JSON"] };
  }
  if (hasReservedKey(raw)) return { ok: false, errors: ["file contains a reserved key (__proto__, constructor or prototype)"] };
  const r = progressSchema.safeParse(raw);
  if (!r.success) {
    const errors = r.error.issues.slice(0, 10).map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`);
    return { ok: false, errors };
  }
  const incoming = r.data;
  if (incoming.packId !== pack.packId) {
    return { ok: false, errors: [`this backup is for pack "${incoming.packId}", but the loaded pack is "${pack.packId}"`] };
  }
  if (mode === "replace") {
    return { ok: true, progress: incoming, added: { attempts: incoming.attempts.length, cards: Object.keys(incoming.cards).length } };
  }
  const seen = new Set(current.attempts.map((a) => `${a.qid}|${a.at}`));
  const fresh = incoming.attempts.filter((a) => !seen.has(`${a.qid}|${a.at}`));
  const attempts = [...current.attempts, ...fresh].sort((a, b) => a.at.localeCompare(b.at)).slice(-MAX_ATTEMPTS);
  const cards: Record<string, Card> = { ...current.cards };
  let newCards = 0;
  for (const [k, c] of Object.entries(incoming.cards)) {
    const mine = cards[k];
    if (!mine) newCards++;
    if (!mine || c.lastAt > mine.lastAt) cards[k] = c;
  }
  const planDone: Progress["planDone"] = { ...current.planDone };
  for (const [d, kinds] of Object.entries(incoming.planDone)) {
    planDone[d] = [...new Set([...(planDone[d] ?? []), ...kinds])];
  }
  const updatedAt = incoming.updatedAt > current.updatedAt ? incoming.updatedAt : current.updatedAt;
  return { ok: true, progress: { ...current, updatedAt, attempts, cards, planDone }, added: { attempts: fresh.length, cards: newCards } };
}
