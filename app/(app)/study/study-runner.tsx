"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { gradeAnswer, isAnswered, type Grade, type Response } from "@/lib/study/grade";
import { mulberry32, type ConcreteQuestion } from "@/lib/study/generators";
import { summarize, type Result } from "@/lib/study/session";
import type { Pack } from "@/lib/study/pack";
import type { Mode } from "@/lib/study/progress";

export type RunnerProps = {
  pack: Pack;
  mode: Mode;
  items: ConcreteQuestion[];
  /** exam mode: feedback is held until the end, with a timer and a navigator */
  exam: boolean;
  endless: boolean;
  durationMin?: number;
  nextItem?: () => ConcreteQuestion | null;
  onAttempt: (q: ConcreteQuestion, g: Grade, seconds: number) => void;
  onExit: () => void;
  onRetry: (missed: ConcreteQuestion[]) => void;
};

const hash = (s: string) => [...s].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) >>> 0, 7);
const shuffled = <T,>(xs: T[], seed: number) => {
  const r = mulberry32(seed);
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

export function safeHref(u: string): string | null {
  return /^https?:\/\//i.test(u) ? u : null;
}

function initial(q: ConcreteQuestion): Response {
  switch (q.type) {
    case "mc": return { type: "mc", choice: null };
    case "multi": return { type: "multi", choices: [] };
    case "num": return { type: "num", text: "" };
    case "match": return { type: "match", choices: q.pairs.map(() => "") };
    case "order": {
      const idx = q.steps.map((_, i) => i);
      let p = shuffled(idx, hash(q.id));
      for (let k = 1; p.every((v, i) => v === i); k++) p = shuffled(idx, hash(q.id) + k);
      return { type: "order", order: p };
    }
    case "seq": return { type: "seq", text: "" };
    case "written": return { type: "written", selfScore: null, text: "" };
  }
}

export function OriginBadge({ q }: { q: ConcreteQuestion }) {
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", q.origin === "official" ? "bg-success-soft text-success" : "bg-accent-soft text-accent")}>
      {q.origin === "official" ? "Official material" : q.seed !== undefined ? "Generated practice (new numbers)" : "Generated practice"}
    </span>
  );
}

function SourceLine({ q }: { q: ConcreteQuestion }) {
  const href = safeHref(q.source.url);
  return (
    <p className="text-xs text-muted">
      Source: {href ? <a className="underline" href={href} target="_blank" rel="noopener noreferrer">{q.source.label}</a> : <>{q.source.label} <em>(no link supplied)</em></>}
    </p>
  );
}

function Body({ q, r, set, locked }: { q: ConcreteQuestion; r: Response; set: (r: Response) => void; locked: boolean }) {
  const perm = useMemo(() => (q.type === "mc" || q.type === "multi" ? shuffled(q.options.map((_, i) => i), hash(q.id)) : []), [q]);
  const rights = useMemo(() => (q.type === "match" ? shuffled(q.pairs.map((p) => p[1]), hash(q.id)) : []), [q]);
  const field = "w-full rounded-lg border border-border-strong bg-background px-3 py-2 text-sm";
  if (q.type === "mc" && r.type === "mc") {
    return (
      <div className="grid gap-2" role="radiogroup">
        {perm.map((i) => (
          <button key={i} role="radio" aria-checked={r.choice === i} disabled={locked} onClick={() => set({ type: "mc", choice: i })}
            className={cn("rounded-lg border px-3 py-2 text-left text-sm", r.choice === i ? "border-foreground bg-accent-soft" : "border-border", locked && i === q.answer && "border-success bg-success-soft", locked && r.choice === i && i !== q.answer && "border-danger bg-danger-soft")}>
            {q.options[i]}
          </button>
        ))}
      </div>
    );
  }
  if (q.type === "multi" && r.type === "multi") {
    return (
      <div className="grid gap-2">
        {perm.map((i) => {
          const on = r.choices.includes(i);
          return (
            <button key={i} role="checkbox" aria-checked={on} disabled={locked} onClick={() => set({ type: "multi", choices: on ? r.choices.filter((x) => x !== i) : [...r.choices, i] })}
              className={cn("rounded-lg border px-3 py-2 text-left text-sm", on ? "border-foreground bg-accent-soft" : "border-border", locked && q.answers.includes(i) && "border-success bg-success-soft", locked && on && !q.answers.includes(i) && "border-danger bg-danger-soft")}>
              {on ? "☑ " : "☐ "}{q.options[i]}
            </button>
          );
        })}
        {!locked && <p className="text-xs text-muted">Select every correct option. Wrong picks cost marks.</p>}
      </div>
    );
  }
  if (q.type === "num" && r.type === "num") {
    return (
      <div className="flex items-center gap-2">
        <input className={cn(field, "max-w-48")} inputMode="decimal" autoComplete="off" disabled={locked} value={r.text} onChange={(e) => set({ type: "num", text: e.target.value })} aria-label="Numeric answer" />
        <span className="text-xs text-muted">{q.unit ? `${q.unit} · ` : ""}{Number.isInteger(q.answer) && q.tol === undefined ? "exact" : `within ${Number(((q.tol ?? 0.01) * 100).toPrecision(3))}%`} · 3e8 or 3x10^8 works</span>
      </div>
    );
  }
  if (q.type === "match" && r.type === "match") {
    return (
      <div className="grid gap-2">
        {q.pairs.map((p, i) => (
          <label key={i} className="grid items-center gap-2 text-sm sm:grid-cols-2">
            <span>{p[0]}</span>
            <select disabled={locked} className={field} value={r.choices[i]} onChange={(e) => set({ type: "match", choices: r.choices.map((c, j) => (j === i ? e.target.value : c)) })}>
              <option value="">Choose…</option>
              {rights.map((x) => <option key={x}>{x}</option>)}
            </select>
          </label>
        ))}
      </div>
    );
  }
  if (q.type === "order" && r.type === "order") {
    const move = (pos: number, d: number) => {
      const o = [...r.order];
      [o[pos], o[pos + d]] = [o[pos + d], o[pos]];
      set({ type: "order", order: o });
    };
    return (
      <ol className="grid gap-2">
        {r.order.map((si, pos) => (
          <li key={si} className={cn("flex items-center gap-2 rounded-lg border px-3 py-2 text-sm", locked ? (si === pos ? "border-success bg-success-soft" : "border-danger bg-danger-soft") : "border-border")}>
            <span className="w-5 text-muted">{pos + 1}</span><span className="flex-1">{q.steps[si]}</span>
            {!locked && <>
              <Button size="sm" variant="ghost" disabled={pos === 0} onClick={() => move(pos, -1)} aria-label="Move up">↑</Button>
              <Button size="sm" variant="ghost" disabled={pos === r.order.length - 1} onClick={() => move(pos, 1)} aria-label="Move down">↓</Button>
            </>}
          </li>
        ))}
      </ol>
    );
  }
  if (q.type === "seq" && r.type === "seq") {
    return <input className={field} disabled={locked} autoComplete="off" spellCheck={false} placeholder="items separated by spaces, e.g. 4 1 3" value={r.text} onChange={(e) => set({ type: "seq", text: e.target.value })} aria-label="Sequence answer" />;
  }
  if (q.type === "written" && r.type === "written") {
    return <textarea className={cn(field, "min-h-28")} disabled={locked} value={r.text ?? ""} onChange={(e) => set({ ...r, text: e.target.value })} placeholder="Write your answer from memory, then reveal the reference and mark yourself honestly." aria-label="Written answer" />;
  }
  return null;
}

type Slot = { r: Response; locked: boolean; revealed: boolean; grade: Grade | null; startedAt: number };

export function Runner(p: RunnerProps) {
  const [items, setItems] = useState(p.items);
  const [slots, setSlots] = useState<Slot[]>(() => p.items.map((q) => ({ r: initial(q), locked: false, revealed: false, grade: null, startedAt: Date.now() })));
  const [i, setI] = useState(0);
  const [done, setDone] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [startedAt] = useState(() => Date.now());
  const submitted = useRef(false);

  const finish = () => {
    if (submitted.current) return;
    submitted.current = true;
    // Side effects (recording attempts) happen here, outside any state updater, so StrictMode cannot double-record.
    const keep = items.map((x, k) => p.exam || !p.endless || slots[k].locked || isAnswered(x, slots[k].r));
    const graded = slots.map((sl, k) => {
      if (sl.locked || !keep[k]) return sl;
      const g = gradeAnswer(items[k], sl.r);
      if (p.exam || isAnswered(items[k], sl.r)) p.onAttempt(items[k], g, Math.round((Date.now() - sl.startedAt) / 1000));
      return { ...sl, locked: true, grade: g };
    });
    setItems(items.filter((_, k) => keep[k]));
    setSlots(graded.filter((_, k) => keep[k]));
    setDone(true);
  };
  const finishRef = useRef(finish);
  useEffect(() => {
    finishRef.current = finish; // always call the latest closure from the timer
  });

  useEffect(() => {
    if (!p.exam || done) return;
    const t = setInterval(() => {
      setNow(Date.now());
      if (p.durationMin && Date.now() - startedAt >= p.durationMin * 60_000) finishRef.current();
    }, 1000);
    return () => clearInterval(t);
  }, [p.exam, p.durationMin, done, startedAt]);

  const q = items[i];
  const s = slots[i];
  const upd = (k: number, patch: Partial<Slot>) => setSlots((prev) => prev.map((x, j) => (j === k ? { ...x, ...patch } : x)));
  const check = () => {
    const g = gradeAnswer(q, s.r);
    upd(i, { locked: true, grade: g });
    p.onAttempt(q, g, Math.round((Date.now() - s.startedAt) / 1000));
  };
  const reveal = () => {
    const g: Grade = { score: 0, correct: false, marking: q.type === "written" ? "self" : "auto", detail: "Answer revealed; counts as 0." };
    upd(i, { locked: true, revealed: true, grade: g });
    p.onAttempt(q, g, Math.round((Date.now() - s.startedAt) / 1000));
  };
  const selfMark = (v: 0 | 0.5 | 1) => {
    const resp: Response = { type: "written", selfScore: v, text: s.r.type === "written" ? s.r.text : "" };
    const g = gradeAnswer(q, resp);
    upd(i, { r: resp, locked: true, grade: g });
    p.onAttempt(q, g, Math.round((Date.now() - s.startedAt) / 1000));
  };
  const next = () => {
    if (p.endless) {
      const n = p.nextItem?.();
      if (!n) return finish();
      setItems((x) => [...x, n]);
      setSlots((x) => [...x, { r: initial(n), locked: false, revealed: false, grade: null, startedAt: Date.now() }]);
      return setI(i + 1);
    }
    if (i === items.length - 1) return finish();
    setI(i + 1);
  };

  if (done || !q) {
    const results: Result[] = items.map((x, k) => ({ q: x, grade: slots[k].grade ?? gradeAnswer(x, slots[k].r), revealed: slots[k].revealed }));
    return <ResultsView pack={p.pack} results={results} onExit={p.onExit} onRetry={() => p.onRetry(results.filter((r) => r.revealed || !r.grade.correct).map((r) => r.q))} />;
  }

  const elapsed = Math.floor((now - startedAt) / 1000);
  const remaining = p.durationMin ? Math.max(0, p.durationMin * 60 - elapsed) : null;
  const fmt = (sec: number) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
  const feedbackNow = !p.exam || q.type === "written";
  const doneCount = slots.filter((x) => x.locked).length;

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted">Practice only. This question set is not proof of complete exam coverage or readiness.</p>
      <div className="flex items-center justify-between gap-3">
        <Button variant="ghost" size="sm" onClick={p.exam ? finish : p.endless ? finish : p.onExit}>{p.exam ? "Submit early" : p.endless ? "End lab" : "Exit"}</Button>
        <div className="text-sm text-muted">{p.endless ? `Lab item ${i + 1}` : `Question ${i + 1} of ${items.length}`}</div>
        <div className="text-sm tabular-nums text-muted" aria-live="off">{p.exam ? (remaining !== null ? `${fmt(remaining)} left` : `${fmt(elapsed)} elapsed`) : `${doneCount} checked`}</div>
      </div>
      {p.exam && (
        <div className="flex flex-wrap gap-1" aria-label="Question navigator">
          {items.map((x, k) => (
            <button key={k} onClick={() => setI(k)} aria-label={`Go to question ${k + 1}`} aria-current={k === i}
              className={cn("size-8 rounded-md border text-xs", k === i ? "border-foreground" : "border-border", isAnswered(x, slots[k].r) && "bg-accent-soft")}>{k + 1}</button>
          ))}
        </div>
      )}
      <Card className="space-y-4">
        <div className="flex flex-wrap items-center gap-2"><OriginBadge q={q} /><span className="text-xs text-muted">{q.marks} mark{q.marks === 1 ? "" : "s"} · {q.type === "written" ? "self-marked" : "auto-marked"}</span></div>
        <p className="whitespace-pre-wrap text-base">{q.prompt}</p>
        <Body q={q} r={s.r} locked={s.locked} set={(r) => upd(i, { r })} />
        {s.locked && s.grade && feedbackNow && (
          <div className="space-y-2 rounded-lg border border-border bg-surface-sunken p-3 text-sm" role="status">
            <p className="font-medium">{s.revealed ? "Revealed (0 marks)." : s.grade.detail} <span className="font-normal text-muted">({s.grade.marking === "auto" ? "auto-marked" : "self-marked"}: {Math.round(s.grade.score * q.marks * 4) / 4}/{q.marks})</span></p>
            {q.type === "written" && <><p className="whitespace-pre-wrap">Reference: {q.reference}</p>{q.rubric.length > 0 && <ul className="list-disc pl-5">{q.rubric.map((x) => <li key={x}>{x}</li>)}</ul>}</>}
            {q.type === "num" && <p>Answer: {q.answer}{q.unit ? ` ${q.unit}` : ""}</p>}
            {q.type === "seq" && <p>Answer: {q.answer}</p>}
            {q.explanation && <p>{q.explanation}</p>}
          </div>
        )}
        {(feedbackNow || s.locked) && <SourceLine q={q} />}
        {q.type === "written" && !s.locked && s.r.type === "written" && (
          <div className="space-y-2">
            <details className="rounded-lg border border-border p-3 text-sm">
              <summary className="cursor-pointer">Reveal reference, then mark yourself</summary>
              <p className="mt-2 whitespace-pre-wrap">{q.reference}</p>
              {q.rubric.length > 0 && <ul className="mt-2 list-disc pl-5">{q.rubric.map((x) => <li key={x}>{x}</li>)}</ul>}
              <div className="mt-3 flex gap-2" role="group" aria-label="Self-mark">
                <Button size="sm" variant="outline" onClick={() => selfMark(0)}>Missed it (0)</Button>
                <Button size="sm" variant="outline" onClick={() => selfMark(0.5)}>Partly (½)</Button>
                <Button size="sm" variant="outline" onClick={() => selfMark(1)}>Got it (1)</Button>
              </div>
              <p className="mt-2 text-xs text-muted">Self-marked results are kept separate from auto-marked ones in mastery.</p>
            </details>
          </div>
        )}
      </Card>
      <div className="flex flex-wrap gap-2">
        {p.exam && i > 0 && <Button variant="outline" onClick={() => setI(i - 1)}>← Back</Button>}
        {!p.exam && !s.locked && q.type !== "written" && <Button onClick={check} disabled={!isAnswered(q, s.r)}>Check</Button>}
        {!p.exam && !s.locked && <Button variant="outline" onClick={reveal}>Show answer</Button>}
        {p.exam && <Button onClick={next}>{i === items.length - 1 ? "Submit" : "Next →"}</Button>}
        {!p.exam && s.locked && <Button onClick={next}>{p.endless ? "Next item →" : i === items.length - 1 ? "See results" : "Next →"}</Button>}
      </div>
    </div>
  );
}

function ResultsView({ pack, results, onExit, onRetry }: { pack: Pack; results: Result[]; onExit: () => void; onRetry: () => void }) {
  const s = summarize(results);
  const title = (id: string) => pack.topics.find((t) => t.id === id)?.title ?? id;
  const pct = s.possible ? Math.round((100 * s.earned) / s.possible) : 0;
  return (
    <div className="space-y-4">
      <Card className="space-y-2">
        <h2 className="font-serif text-2xl">Results</h2>
        <p className="text-sm">{s.n === 0 ? "Nothing answered yet." : `${Math.round(s.earned * 4) / 4} of ${s.possible} marks (${pct}%) · ${s.correct} of ${s.n} fully right`}</p>
        <p className="text-xs text-muted">This practice set may cover only part of your course. It is not an exam-readiness certificate.</p>
        <p className="text-xs text-muted">Auto-marked marks: {Math.round(s.autoEarned * 4) / 4} · Self-marked marks: {Math.round(s.selfEarned * 4) / 4}. Practice scores are not exam predictions.</p>
      </Card>
      <Card>
        <h3 className="mb-2 text-sm font-medium">By topic</h3>
        <table className="w-full text-sm"><thead><tr className="text-left text-muted"><th>Topic</th><th>Marks</th><th>Auto</th><th>Self</th></tr></thead>
          <tbody>{s.byTopic.map((t) => <tr key={t.topicId}><td>{title(t.topicId)}</td><td>{Math.round(t.earned * 4) / 4}/{t.points}</td><td>{t.auto}</td><td>{t.self}</td></tr>)}</tbody></table>
      </Card>
      <div className="space-y-2">
        <h3 className="text-sm font-medium">Review</h3>
        {results.map((r, k) => (
          <details key={k} className="rounded-lg border border-border p-3 text-sm">
            <summary className="cursor-pointer">{r.revealed ? "◌" : r.grade.correct ? "✓" : r.grade.score > 0 ? "◐" : "✗"} {r.q.prompt.slice(0, 90)}</summary>
            <div className="mt-2 space-y-1"><OriginBadge q={r.q} /><p>{r.grade.detail} ({r.grade.marking === "auto" ? "auto-marked" : "self-marked"})</p>
              {(r.q.type === "num" || r.q.type === "seq") && <p>Answer: {String(r.q.answer)}</p>}
              {r.q.explanation && <p>{r.q.explanation}</p>}<SourceLine q={r.q} /></div>
          </details>
        ))}
      </div>
      <div className="flex gap-2">
        {s.missed.length > 0 && <Button onClick={onRetry}>Retry {s.missed.length} missed</Button>}
        <Button variant="outline" onClick={onExit}>Back to workspace</Button>
      </div>
    </div>
  );
  }
