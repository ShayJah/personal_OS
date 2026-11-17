"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { DEMO_PACK } from "@/lib/study/demo-pack";
import type { ConcreteQuestion } from "@/lib/study/generators";
import type { Grade } from "@/lib/study/grade";
import { emptyPack, parsePackText, type Exam, type Pack } from "@/lib/study/pack";
import { buildDailyPlan, examCountdown, type PlanItem } from "@/lib/study/plan";
import {
  PACK_KEY, dayKey, emptyProgress, exportProgress, importProgress, isDue, isWeak, loadProgress, markPlanDone,
  recordAttempt, resetProgress, saveProgress, topicMastery, type Mode, type Progress, type StorageLike,
} from "@/lib/study/progress";
import { buildSession, nextLabItem } from "@/lib/study/session";
import { Runner, safeHref } from "./study-runner";

type Tab = "overview" | "exams" | "plan" | "practice" | "mastery" | "data";
const TABS: Array<[Tab, string]> = [["overview", "Courses"], ["exams", "Exams"], ["plan", "Plan"], ["practice", "Practice"], ["mastery", "Mastery"], ["data", "Data & backup"]];

type Active = { key: number; mode: Mode; items: ConcreteQuestion[]; exam: boolean; endless: boolean; durationMin?: number; examId?: string };

function download(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "application/json" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

/** Seeds come from the clock, but only inside event handlers, never during render. */
const freshSeed = () => Date.now() >>> 0;

const Pill = ({ children, tone = "muted" }: { children: React.ReactNode; tone?: "muted" | "ok" | "warn" }) => (
  <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", tone === "ok" && "bg-success-soft text-success", tone === "warn" && "bg-danger-soft text-danger", tone === "muted" && "bg-foreground/5 text-muted")}>{children}</span>
);

export function StudyWorkspace({ userId = "local-preview" }: { userId?: string }) {
  const storage = useMemo<StorageLike>(() => ({
    getItem: (key) => window.localStorage.getItem(`study-user:${encodeURIComponent(userId)}:${key}`),
    setItem: (key, value) => window.localStorage.setItem(`study-user:${encodeURIComponent(userId)}:${key}`, value),
    removeItem: (key) => window.localStorage.removeItem(`study-user:${encodeURIComponent(userId)}:${key}`),
  }), [userId]);
  const [tab, setTab] = useState<Tab>("overview");
  const [pack, setPack] = useState<Pack>(() => emptyPack());
  const [progress, setProgress] = useState<Progress>(() => emptyProgress("empty", new Date()));
  const [notice, setNotice] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [active, setActive] = useState<Active | null>(null);
  const [now, setNow] = useState(() => new Date());
  useEffect(() => { const timer = window.setInterval(() => setNow(new Date()), 60000); return () => window.clearInterval(timer); }, []);
  const progressRef = useRef(progress);

  // Load the locally imported pack (never fetched from the server).
  useEffect(() => {
    // Hydrating from localStorage can only happen after mount, so state is set inside the effect on purpose.
    /* eslint-disable react-hooks/set-state-in-effect */
    try {
      const raw = storage.getItem(PACK_KEY);
      if (raw) {
        const r = parsePackText(raw);
        if (r.ok) setPack(r.pack);
        else setNotice("The saved pack no longer validates and was ignored: " + r.errors[0]);
      }
    } catch {
      setNotice("Browser storage is unavailable; nothing will be saved.");
    }
    setReady(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [storage]);

  useEffect(() => {
    if (!ready) return;
    /* eslint-disable react-hooks/set-state-in-effect */
    const r = loadProgress(storage, pack.packId, new Date());
    progressRef.current = r.progress;
    setProgress(r.progress);
    if (r.notice) setNotice(r.notice);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [pack.packId, ready, storage]);

  const commit = (fn: (p: Progress) => Progress) => {
    const next = fn(progressRef.current);
    progressRef.current = next;
    setProgress(next);
    const res = saveProgress(storage, next);
    if (!res.ok) setNotice(res.error);
  };

  const today = dayKey(now);
  const topicTitle = (id: string) => pack.topics.find((t) => t.id === id)?.title ?? id;
  const courseTitle = (id: string) => { const c = pack.courses.find((x) => x.id === id); return c ? [c.code, c.title].filter(Boolean).join(" · ") || "Unnamed slot" : id; };
  const dueQs = pack.questions.filter((q) => progress.cards[q.id] && isDue(progress.cards[q.id], today));
  const weakQs = pack.questions.filter((q) => progress.cards[q.id] && isWeak(progress.cards[q.id]));

  const start = (mode: Mode, o: { topicIds?: string[]; exam?: Exam; qids?: string[]; length?: number; examMode?: boolean; durationMin?: number } = {}) => {
    const seed = freshSeed();
    const endless = mode === "lab";
    const items = endless ? [nextLabItem(pack, seed)].filter((x): x is ConcreteQuestion => x !== null) : buildSession({ pack, progress, mode, now: new Date(), seed, ...o });
    if (!items.length) return setNotice("No questions match that selection yet. Import a pack or pick other topics.");
    setNotice(null);
    setActive({ key: seed, mode, items, exam: !!o.examMode && !endless, endless, durationMin: o.durationMin, examId: o.exam?.id });
  };

  const onAttempt = (q: ConcreteQuestion, g: Grade, seconds: number) =>
    commit((p) => recordAttempt(p, { qid: q.templateId, topicId: q.topicId, courseId: q.courseId, score: g.score, marking: g.marking, origin: q.origin, mode: active?.mode ?? "drill", seconds }, new Date()));

  if (active) {
    return (
      <div className="mx-auto max-w-3xl">
        <Runner key={active.key} pack={pack} mode={active.mode} items={active.items} exam={active.exam} endless={active.endless} durationMin={active.durationMin}
          nextItem={() => nextLabItem(pack, freshSeed())} onAttempt={onAttempt} onExit={() => setActive(null)}
          onRetry={(missed) => setActive({ key: freshSeed(), mode: "retry", items: missed, exam: false, endless: false })} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="space-y-1">
        <p className="eyebrow">study workspace</p>
        <h1 className="font-serif text-3xl font-extrabold">Finals study</h1>
        <p className="text-sm text-muted">Pack: <strong>{pack.title || pack.packId}</strong>. Your pack and progress stay in this browser. This page ships no course data.</p>
      </header>
      {notice && <p role="alert" className="rounded-lg border border-border-strong bg-danger-soft px-3 py-2 text-sm">{notice}</p>}
      <nav role="tablist" aria-label="Study sections" className="flex flex-wrap gap-1 border-b border-border pb-2">
        {TABS.map(([k, label]) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={cn("rounded-lg px-3 py-1.5 text-sm", tab === k ? "bg-accent-soft font-medium" : "text-muted hover:bg-foreground/5")}>{label}</button>
        ))}
      </nav>

      {tab === "overview" && (
        <section className="space-y-3" aria-label="Courses">
          <p className="text-sm text-muted">Official facts are shown exactly as supplied in your pack. Blank means not supplied yet, not unknown to the app.</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {pack.courses.map((c, idx) => {
              const att = progress.attempts.filter((a) => a.courseId === c.id);
              const auto = att.filter((a) => a.marking === "auto");
              const href = safeHref(c.canvasUrl);
              const empty = !c.code && !c.title;
              return (
                <Card key={c.id} className="space-y-2">
                  <div className="flex items-center justify-between"><span className="text-xs text-muted">Slot {idx + 1}</span><Pill tone={c.status === "verified" ? "ok" : "warn"}>{c.status}{c.verifiedAt ? ` · ${c.verifiedAt}` : ""}</Pill></div>
                  <h2 className="text-lg font-medium">{empty ? "Empty slot" : courseTitle(c.id)}</h2>
                  {empty && <p className="text-sm text-muted">Supply this course in a private pack.</p>}
                  {href && <a className="text-sm underline" href={href} target="_blank" rel="noopener noreferrer">Course page</a>}
                  <p className="text-xs text-muted">{pack.topics.filter((t) => t.courseId === c.id).length} topics · {pack.questions.filter((q) => q.courseId === c.id).length} questions · {pack.exams.filter((e) => e.courseId === c.id).length} exams</p>
                  <p className="text-xs text-muted">Practised: {att.length} attempts{auto.length ? ` · auto-marked average ${Math.round((100 * auto.reduce((s, a) => s + a.score, 0)) / auto.length)}% (n=${auto.length})` : ""}</p>
                  {c.notes && <p className="whitespace-pre-wrap text-sm">{c.notes}</p>}
                </Card>
              );
            })}
          </div>
        </section>
      )}

      {tab === "exams" && (
        <section className="space-y-3" aria-label="Exams">
          <p className="text-sm text-muted">An exam is only treated as verified when your pack gives a source link, a verified-at date, a date and a timezone. Everything else is shown as unverified.</p>
          {pack.exams.length === 0 && <Card><p className="text-sm text-muted">No exams in the loaded pack. Dates and coverage are never guessed.</p></Card>}
          {pack.exams.map((e) => {
            const cd = examCountdown(e, today);
            const href = safeHref(e.sourceUrl);
            return (
              <Card key={e.id} className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-lg font-medium">{e.title || "Untitled exam"} <span className="text-sm font-normal text-muted">· {courseTitle(e.courseId)}</span></h2><Pill tone={e.status === "verified" ? "ok" : "warn"}>{e.status}</Pill></div>
                <dl className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
                  <div><dt className="inline text-muted">Date: </dt><dd className="inline">{e.date ? `${e.date}${e.time ? ` ${e.time}` : ""}${e.timezone ? ` (${e.timezone})` : " (timezone not supplied)"}` : "not supplied"}</dd></div>
                  <div><dt className="inline text-muted">Countdown: </dt><dd className="inline">{cd.days === null ? "n/a" : `${cd.days} day${cd.days === 1 ? "" : "s"}${cd.dateVerified ? "" : " (date unverified)"}`}</dd></div>
                  <div><dt className="inline text-muted">Verified at: </dt><dd className="inline">{e.verifiedAt || "never"}</dd></div>
                  <div><dt className="inline text-muted">Source: </dt><dd className="inline">{href ? <a className="underline" href={href} target="_blank" rel="noopener noreferrer">link</a> : "none supplied"}</dd></div>
                  <div className="sm:col-span-2"><dt className="inline text-muted">Coverage: </dt><dd className="inline">{e.coverage.length ? e.coverage.map(topicTitle).join(", ") : "not supplied"}</dd></div>
                </dl>
                {e.notes && <p className="text-sm text-muted whitespace-pre-wrap">{e.notes}</p>}
                <p className="text-xs text-muted">Practice uses only the loaded questions for this course. It is not a full-length or complete-coverage exam.</p>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => start("mock", { exam: e, length: 20, examMode: true, durationMin: e.durationMin })}>Timed practice{e.durationMin ? ` (${e.durationMin} min)` : ""}</Button>
                  <Button size="sm" variant="outline" onClick={() => start("mock", { exam: e, length: 15 })}>{e.coverage.length ? "Practice this coverage" : "Practice this course (scope unconfirmed)"}</Button>
                </div>
              </Card>
            );
          })}
        </section>
      )}

      {tab === "plan" && <PlanTab pack={pack} progress={progress} now={now} today={today} start={start} onDone={(k) => commit((p) => markPlanDone(p, today, k, new Date()))} />}

      {tab === "practice" && <PracticeTab pack={pack} dueN={dueQs.length} weakN={weakQs.length} topicTitle={topicTitle} start={start} />}

      {tab === "mastery" && (
        <section className="space-y-3" aria-label="Mastery">
          <p className="text-sm text-muted">Auto-marked means the app compared your answer with a stored one. Self-marked means you graded yourself. They are never averaged together, and a level needs at least 5 auto-marked attempts.</p>
          <Card className="overflow-x-auto">
            <table className="w-full text-sm"><thead><tr className="text-left text-muted"><th className="py-1">Topic</th><th>Auto-marked</th><th>Self-marked</th><th>Level</th></tr></thead>
              <tbody>{pack.topics.map((t) => { const m = topicMastery(progress, t.id); const f = (x: { n: number; avg: number | null }) => (x.avg === null ? "none" : `${Math.round(x.avg * 100)}% (n=${x.n})`); return <tr key={t.id} className="border-t border-border"><td className="py-1.5">{t.title} <span className="text-xs text-muted">{t.official ? "official outline" : "your grouping"}</span></td><td>{f(m.auto)}</td><td>{f(m.self)}</td><td>{m.level}</td></tr>; })}</tbody></table>
            {pack.topics.length === 0 && <p className="text-sm text-muted">No topics loaded.</p>}
          </Card>
        </section>
      )}

      {tab === "data" && <DataTab storage={storage} pack={pack} progress={progress} now={now} setPack={setPack} setNotice={setNotice} commit={commit} setProgress={(p) => { progressRef.current = p; setProgress(p); }} />}
    </div>
  );
}

function PlanTab({ pack, progress, now, today, start, onDone }: { pack: Pack; progress: Progress; now: Date; today: string; start: (m: Mode, o?: { qids?: string[]; examMode?: boolean; durationMin?: number }) => void; onDone: (k: PlanItem["kind"]) => void }) {
  const [examId, setExamId] = useState("");
  const exam = pack.exams.find((e) => e.id === examId) ?? null;
  const plan = useMemo(() => buildDailyPlan(pack, progress, now, exam), [pack, progress, now, exam]);
  return (
    <section className="space-y-3" aria-label="Daily plan">
      {pack.trainingPlan && <Card className="space-y-2"><details><summary className="cursor-pointer font-medium">Your dated training plan and source notes</summary><div className="mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed">{pack.trainingPlan}</div></details></Card>}
      <div className="flex flex-wrap items-center gap-2 text-sm"><label htmlFor="focus">Focus on</label>
        <select id="focus" className="rounded-lg border border-border-strong bg-background px-2 py-1" value={examId} onChange={(e) => setExamId(e.target.value)}>
          <option value="">everything in the pack</option>{pack.exams.map((e) => <option key={e.id} value={e.id}>{e.title || e.id}</option>)}</select>
        <span className="text-muted">{today}</span></div>
      {plan.map((it) => (
        <Card key={it.kind} className="space-y-2">
          <div className="flex items-center justify-between"><h2 className="font-medium">{it.title} <span className="text-sm font-normal text-muted">· ~{it.minutes} min · {it.qids.length} question{it.qids.length === 1 ? "" : "s"}</span></h2>{it.done && <Pill tone="ok">done today</Pill>}</div>
          <p className="text-sm text-muted">{it.note}</p>
          <div className="flex gap-2">
            <Button size="sm" disabled={!it.qids.length} onClick={() => start("plan", { qids: it.qids, examMode: it.kind === "timed", durationMin: it.kind === "timed" ? it.minutes : undefined })}>{it.kind === "timed" ? `Start timed (${it.minutes} min)` : "Start"}</Button>
            <Button size="sm" variant="outline" disabled={it.done} onClick={() => onDone(it.kind)}>Mark block done</Button>
          </div>
          {it.qids.length === 0 && <p className="text-xs text-muted">Nothing to do here yet: import a pack or practise first.</p>}
        </Card>
      ))}
      <p className="text-xs text-muted">The plan is built from your own results. It does not know your real exam dates unless your pack supplies them, and it never assumes any.</p>
    </section>
  );
}

function PracticeTab({ pack, dueN, weakN, topicTitle, start }: { pack: Pack; dueN: number; weakN: number; topicTitle: (id: string) => string; start: (m: Mode, o?: { topicIds?: string[]; length?: number; examMode?: boolean }) => void }) {
  const [len, setLen] = useState(15);
  const [held, setHeld] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const modes: Array<[string, string, () => void, boolean]> = [
    ["Mock quiz", "A mix of every topic.", () => start("mock", { length: len, examMode: held }), pack.questions.length > 0],
    ["Topic drill", picked.length ? `${picked.length} topic(s) selected.` : "Pick topics below.", () => start("drill", { topicIds: picked, length: len, examMode: held }), picked.length > 0],
    ["Endless lab", "Generated numeric and trace practice, then written items. Stop any time.", () => start("lab"), pack.questions.length > 0],
    ["Due now", `${dueN} question${dueN === 1 ? "" : "s"} scheduled for today or earlier.`, () => start("due", { length: len }), dueN > 0],
    ["Weak spots", `${weakN} question${weakN === 1 ? "" : "s"} below 70% on the last try.`, () => start("weak", { length: len }), weakN > 0],
  ];
  return (
    <section className="space-y-4" aria-label="Practice">
      <div className="flex flex-wrap items-center gap-4 text-sm">
        <label>Length <input type="number" min={1} max={100} value={len} onChange={(e) => setLen(Math.min(100, Math.max(1, Number(e.target.value) || 1)))} className="w-16 rounded border border-border-strong bg-background px-2 py-1" /></label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={held} onChange={(e) => setHeld(e.target.checked)} /> Exam mode (hold feedback to the end, timer, navigator)</label>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {modes.map(([t, d, go, ok]) => <Card key={t} className="space-y-2"><h2 className="font-medium">{t}</h2><p className="text-sm text-muted">{d}</p><Button size="sm" disabled={!ok} onClick={go}>Start</Button></Card>)}
      </div>
      <Card className="space-y-2"><h3 className="text-sm font-medium">Topics for the drill</h3>
        {pack.topics.length === 0 && <p className="text-sm text-muted">No topics loaded.</p>}
        <div className="flex flex-wrap gap-2">{pack.topics.map((t) => <button key={t.id} aria-pressed={picked.includes(t.id)} onClick={() => setPicked((x) => (x.includes(t.id) ? x.filter((y) => y !== t.id) : [...x, t.id]))} className={cn("rounded-full border px-3 py-1 text-sm", picked.includes(t.id) ? "border-foreground bg-accent-soft" : "border-border")}>{topicTitle(t.id)}</button>)}</div>
      </Card>
    </section>
  );
}

function DataTab({ storage, pack, progress, now, setPack, setNotice, commit, setProgress }: { storage: StorageLike; pack: Pack; progress: Progress; now: Date; setPack: (p: Pack) => void; setNotice: (s: string | null) => void; commit: (fn: (p: Progress) => Progress) => void; setProgress: (p: Progress) => void }) {
  const [errors, setErrors] = useState<string[]>([]);
  const [msg, setMsg] = useState("");
  const [armed, setArmed] = useState(false);
  const [mode, setMode] = useState<"merge" | "replace">("merge");
  const applyPack = (p: Pack, persist: boolean) => {
    try { if (persist) storage.setItem(PACK_KEY, JSON.stringify(p)); else storage.removeItem(PACK_KEY); } catch { setNotice("Could not save the pack to browser storage; it will be gone after reload."); }
    setPack(p);
  };
  const onPack = async (f: File | undefined) => {
    if (!f) return;
    const r = parsePackText(await f.text());
    if (r.ok) { setErrors([]); applyPack(r.pack, true); setMsg(`Loaded pack "${r.pack.title || r.pack.packId}": ${r.pack.questions.length} questions.`); }
    else { setErrors(r.errors); setMsg(""); }
  };
  const onProgress = async (f: File | undefined) => {
    if (!f) return;
    const r = importProgress(await f.text(), pack, progress, mode);
    if (!r.ok) { setErrors(r.errors); setMsg(""); return; }
    setErrors([]);
    commit(() => r.progress);
    setMsg(`Imported (${mode}): ${r.added.attempts} attempts and ${r.added.cards} new cards.`);
  };
  return (
    <section className="space-y-4" aria-label="Data and backup">
      <Card className="space-y-1 border-border-strong text-sm">
        <h2 className="font-medium">Where your data lives</h2>
        <p>Your pack and progress are stored only in this browser on this device. They are not on the server and not synced. Clearing site data deletes them; another browser or private window has a separate copy. Storage is account-scoped, but not encrypted. Use your own browser profile on a shared device. <strong>Export a backup after each session.</strong> Keep exported files somewhere private. They may contain your course details.</p>
      </Card>
      {(errors.length > 0 || msg) && <div role="status" className="rounded-lg border border-border p-3 text-sm">{msg}{errors.length > 0 && <><p className="font-medium">Could not import:</p><ul className="list-disc pl-5">{errors.map((e) => <li key={e}>{e}</li>)}</ul></>}</div>}
      <Card className="space-y-2"><h2 className="font-medium">Private pack</h2>
        <p className="text-sm text-muted">Load a JSON pack from your computer. It is validated and kept in this browser only. Nothing is uploaded.</p>
        <div className="flex flex-wrap items-center gap-2">
          <input type="file" accept="application/json,.json" aria-label="Load pack file" onChange={(e) => { void onPack(e.target.files?.[0]); e.target.value = ""; }} />
          <Button size="sm" variant="outline" onClick={() => download("study-pack.template.json", JSON.stringify({ ...emptyPack(), packId: "my-private-pack", title: "My private pack" }, null, 2))}>Download blank template</Button>
          <Button size="sm" variant="outline" onClick={() => { applyPack(DEMO_PACK, true); setMsg("Demo pack loaded. It is generic practice, not course material."); setErrors([]); }}>Load demo pack</Button>
          <Button size="sm" variant="ghost" onClick={() => { applyPack(emptyPack(), false); setMsg("Pack removed from this browser. Progress was kept."); }}>Remove pack</Button>
        </div></Card>
      <Card className="space-y-2"><h2 className="font-medium">Progress backup</h2>
        <p className="text-sm text-muted">{progress.attempts.length} attempts · {Object.keys(progress.cards).length} scheduled questions · last change {progress.updatedAt.slice(0, 16).replace("T", " ")}</p>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" onClick={() => download(`study-progress-${pack.packId}-${dayKey(now)}.json`, exportProgress(progress, new Date()))}>Export progress</Button>
          <select aria-label="Import mode" className="rounded-lg border border-border-strong bg-background px-2 py-1 text-sm" value={mode} onChange={(e) => setMode(e.target.value as "merge" | "replace")}><option value="merge">Merge into current</option><option value="replace">Replace current</option></select>
          <input type="file" accept="application/json,.json" aria-label="Import progress file" onChange={(e) => { void onProgress(e.target.files?.[0]); e.target.value = ""; }} />
        </div></Card>
      <Card className="space-y-2"><h2 className="font-medium">Reset</h2>
        <p className="text-sm text-muted">Deletes progress for the loaded pack from this browser. Export first if you might want it back.</p>
        <Button size="sm" variant="outline" onClick={() => { if (!armed) return setArmed(true); setProgress(resetProgress(storage, pack.packId, new Date())); setArmed(false); setMsg("Progress reset."); }}>{armed ? "Click again to erase progress" : "Reset progress"}</Button></Card>
    </section>
  );
            }
