import { describe, expect, it } from "vitest";
import {
  addDays, daysBetween, dayKey, emptyProgress, exportProgress, importProgress, loadProgress, markPlanDone,
  progressKey, recordAttempt, resetProgress, saveProgress, topicMastery, isDue, isWeak, type AttemptInput, type StorageLike,
} from "@/lib/study/progress";

const NOW = new Date(2026, 10, 17, 12, 0, 0);
const later = (days: number) => new Date(2026, 10, 17 + days, 12, 0, 0);
const A = (over: Partial<AttemptInput> = {}): AttemptInput => ({ qid: "q1", topicId: "t1", courseId: "c1", score: 1, marking: "auto", origin: "generated", mode: "drill", ...over });

function memStorage(initial: Record<string, string> = {}, failWrites = false): StorageLike & { data: Record<string, string> } {
  const data = { ...initial };
  return {
    data,
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => { if (failWrites) throw new Error("QuotaExceededError"); data[k] = v; },
    removeItem: (k) => { delete data[k]; },
  };
}

describe("day helpers", () => {
  it("add and diff days across month and year ends", () => {
    expect(addDays("2026-11-30", 1)).toBe("2026-12-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(daysBetween("2026-11-17", "2026-12-10")).toBe(23);
    expect(dayKey(NOW)).toBe("2026-11-17");
  });
});

describe("recordAttempt scheduling", () => {
  it("a correct first answer moves to box 2 and is due in 2 days", () => {
    const p = recordAttempt(emptyProgress("p", NOW), A(), NOW);
    expect(p.cards.q1).toMatchObject({ box: 2, due: "2026-11-19", lapses: 0, seen: 1, lastScore: 1 });
    expect(p.attempts).toHaveLength(1);
    expect(isDue(p.cards.q1, "2026-11-18")).toBe(false);
    expect(isDue(p.cards.q1, "2026-11-19")).toBe(true);
  });
  it("success climbs the boxes up to a cap of 6", () => {
    let p = emptyProgress("p", NOW);
    for (let i = 0; i < 10; i++) p = recordAttempt(p, A(), later(i));
    expect(p.cards.q1.box).toBe(6);
    expect(p.cards.q1.seen).toBe(10);
  });
  it("a miss resets to box 1; only a miss after a first sighting is a lapse", () => {
    let p = recordAttempt(emptyProgress("p", NOW), A({ score: 0 }), NOW);
    expect(p.cards.q1).toMatchObject({ box: 1, lapses: 0 });
    p = recordAttempt(p, A({ score: 1 }), later(1));
    p = recordAttempt(p, A({ score: 0.2 }), later(2));
    expect(p.cards.q1).toMatchObject({ box: 1, lapses: 1 });
    expect(isWeak(p.cards.q1)).toBe(true);
  });
  it("middling scores hold the box", () => {
    let p = recordAttempt(emptyProgress("p", NOW), A(), NOW);
    p = recordAttempt(p, A({ score: 0.6 }), later(2));
    expect(p.cards.q1.box).toBe(2);
  });
  it("clamps scores and does not mutate its input", () => {
    const p0 = emptyProgress("p", NOW);
    const p1 = recordAttempt(p0, A({ score: 7 }), NOW);
    expect(p1.attempts[0].score).toBe(1);
    expect(p0.attempts).toHaveLength(0);
    expect(p0.cards).toEqual({});
  });
  it("markPlanDone is idempotent", () => {
    const p = markPlanDone(markPlanDone(emptyProgress("p", NOW), "2026-11-17", "timed", NOW), "2026-11-17", "timed", NOW);
    expect(p.planDone["2026-11-17"]).toEqual(["timed"]);
  });
});

describe("mastery labels", () => {
  it("keeps auto-marked and self-marked results separate and needs 5 auto attempts for a level", () => {
    let p = emptyProgress("p", NOW);
    for (let i = 0; i < 4; i++) p = recordAttempt(p, A({ qid: `a${i}`, score: 1 }), NOW);
    for (let i = 0; i < 6; i++) p = recordAttempt(p, A({ qid: `s${i}`, score: 1, marking: "self" }), NOW);
    let m = topicMastery(p, "t1");
    expect(m.auto).toEqual({ n: 4, avg: 1 });
    expect(m.self).toEqual({ n: 6, avg: 1 });
    expect(m.level).toBe("not enough data"); // six self-marks never earn a verdict
    p = recordAttempt(p, A({ qid: "a4", score: 0 }), NOW);
    m = topicMastery(p, "t1");
    expect(m.auto.n).toBe(5);
    expect(m.level).toBe("developing"); // auto average 0.8
  });
  it("level thresholds", () => {
    const mk = (scores: number[]) => scores.reduce((p, s, i) => recordAttempt(p, A({ qid: `x${i}`, score: s }), NOW), emptyProgress("p", NOW));
    expect(topicMastery(mk([1, 1, 1, 1, 1]), "t1").level).toBe("strong");
    expect(topicMastery(mk([1, 1, 1, 0, 0]), "t1").level).toBe("developing");
    expect(topicMastery(mk([0, 0, 0, 1, 1]), "t1").level).toBe("weak");
    expect(topicMastery(emptyProgress("p", NOW), "t1").level).toBe("no data");
  });
});

describe("persistence", () => {
  it("round-trips through storage and is keyed by pack id", () => {
    const s = memStorage();
    const p = recordAttempt(emptyProgress("pack-a", NOW), A(), NOW);
    expect(saveProgress(s, p)).toEqual({ ok: true });
    expect(Object.keys(s.data)).toEqual([progressKey("pack-a")]);
    expect(loadProgress(s, "pack-a", NOW).progress).toEqual(p);
    expect(loadProgress(s, "pack-b", NOW).progress.attempts).toEqual([]);
  });
  it("corrupt data is preserved under a recovery key and replaced with a fresh state plus a notice", () => {
    const s = memStorage({ [progressKey("p")]: "{broken" });
    const r = loadProgress(s, "p", NOW);
    expect(r.progress.attempts).toEqual([]);
    expect(r.notice).toMatch(/recovery/);
    expect(s.data[`${progressKey("p")}:corrupt`]).toBe("{broken");
  });
  it("schema-invalid data is also recovered rather than trusted", () => {
    const bad = JSON.stringify({ ...emptyProgress("p", NOW), attempts: [{ qid: "x", score: 5 }] });
    const r = loadProgress(memStorage({ [progressKey("p")]: bad }), "p", NOW);
    expect(r.progress.attempts).toEqual([]);
    expect(r.notice).toBeDefined();
  });
  it("reports failed writes instead of pretending to save", () => {
    const res = saveProgress(memStorage({}, true), emptyProgress("p", NOW));
    expect(res.ok).toBe(false);
    expect(res.ok === false && res.error).toMatch(/Export a backup/);
  });
  it("reset removes the stored key and returns an empty state", () => {
    const s = memStorage();
    saveProgress(s, recordAttempt(emptyProgress("p", NOW), A(), NOW));
    const fresh = resetProgress(s, "p", later(1));
    expect(fresh.attempts).toEqual([]);
    expect(s.data[progressKey("p")]).toBeUndefined();
  });
});

describe("export / import validation", () => {
  const pack = { packId: "p" };
  const populated = () => recordAttempt(emptyProgress("p", NOW), A(), NOW);

  it("export then replace-import is lossless", () => {
    const p = populated();
    const text = exportProgress(p, later(1));
    const r = importProgress(text, pack, emptyProgress("p", NOW), "replace");
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.progress.attempts).toEqual(p.attempts);
      expect(r.progress.cards).toEqual(p.cards);
    }
  });
  it("rejects non-JSON, wrong schema, wrong pack, bad scores, bad dates", () => {
    const cur = emptyProgress("p", NOW);
    expect(importProgress("nope", pack, cur, "replace")).toMatchObject({ ok: false });
    expect(importProgress(JSON.stringify({ ...populated(), schema: "study-progress/2" }), pack, cur, "replace").ok).toBe(false);
    const other = importProgress(JSON.stringify({ ...populated(), packId: "other" }), pack, cur, "replace");
    expect(other.ok).toBe(false);
    expect(!other.ok && other.errors[0]).toMatch(/other/);
    const badScore = populated();
    badScore.attempts[0].score = 2;
    expect(importProgress(JSON.stringify(badScore), pack, cur, "replace").ok).toBe(false);
    const badDay = populated();
    badDay.cards.q1.due = "tomorrow";
    expect(importProgress(JSON.stringify(badDay), pack, cur, "replace").ok).toBe(false);
  });
  it("rejects prototype-pollution keys and does not pollute", () => {
    const text = JSON.stringify(populated()).replace('"q1":', '"__proto__":');
    const r = importProgress(text, pack, emptyProgress("p", NOW), "replace");
    expect(r.ok).toBe(false);
    expect(!r.ok && r.errors[0]).toMatch(/reserved key/);
    expect(({} as Record<string, unknown>).box).toBeUndefined();
  });
  it("merge dedupes attempts, keeps the newer card, unions plan days", () => {
    const cur = markPlanDone(populated(), "2026-11-17", "retrieval", NOW);
    let theirs = recordAttempt(populated(), A({ score: 0 }), later(3)); // newer attempt on same card
    theirs = markPlanDone(theirs, "2026-11-17", "timed", later(3));
    theirs = recordAttempt(theirs, A({ qid: "q2" }), later(3));
    const r = importProgress(JSON.stringify(theirs), pack, cur, "merge");
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.added).toEqual({ attempts: 2, cards: 1 });
    expect(r.progress.attempts).toHaveLength(3); // shared first attempt not duplicated
    expect(r.progress.cards.q1.lastScore).toBe(0); // newer wins
    expect(r.progress.planDone["2026-11-17"].sort()).toEqual(["retrieval", "timed"]);
    const again = importProgress(JSON.stringify(theirs), pack, r.progress, "merge");
    expect(again.ok && again.added.attempts).toBe(0); // idempotent
  });
});
