"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { quadMatrix3d, type Pt } from "@/lib/homography";

type Props = {
  tvKey: string;
  year: number;
  month: number; // 1-12, first of four planner months
  eventCounts: Record<string, number>;
  pins: { id: string; text: string; date?: string }[];
  priorities: string[];
  pipeline: { stage: string; count: number }[];
  shipped: { title: string; line: string }[];
  agents: string;
};

type Quad = [Pt, Pt, Pt, Pt]; // TL, TR, BR, BL as fractions of the screen
const GRID_W = 700;
const GRID_H = 500;
const STORE = "tv-quads-v1";

// First guess from the planner photo (planner fills the left ~2/3 of a 16:9 screen). Fine-tune with calibration (press C).
function defaultQuads(): Quad[] {
  const px = 0.02, py = 0.04, pw = 0.667, ph = 0.92;
  const panels = [
    [0.028, 0.109, 0.467, 0.355],
    [0.5, 0.097, 0.472, 0.362],
    [0.034, 0.479, 0.466, 0.349],
    [0.505, 0.467, 0.467, 0.358],
  ];
  return panels.map(([x, y, w, h]) => {
    const top = y + h * 0.16;
    const q = (fx: number, fy: number) => ({ x: px + pw * fx, y: py + ph * fy });
    return [q(x, top), q(x + w, top), q(x + w, y + h), q(x, y + h)] as Quad;
  });
}

const iso = (y: number, m: number, d: number) => `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

export function TvWall({ tvKey, year, month, eventCounts, pins, priorities, pipeline, shipped, agents }: Props) {
  const router = useRouter();
  const [quads, setQuads] = useState<Quad[]>(defaultQuads);
  const [calibrate, setCalibrate] = useState(false);
  const [vp, setVp] = useState({ w: 1920, h: 1080 });
  const [listening, setListening] = useState(false);
  const [answer, setAnswer] = useState("");
  const [glow, setGlow] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const drag = useRef<{ q: number; c: number } | null>(null);
  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORE) ?? "null");
      if (Array.isArray(saved) && saved.length === 4) setQuads(saved);
    } catch {}
    const size = () => setVp({ w: window.innerWidth, h: window.innerHeight });
    size();
    window.addEventListener("resize", size);
    const refresh = setInterval(() => router.refresh(), 10 * 60_000);
    return () => {
      window.removeEventListener("resize", size);
      clearInterval(refresh);
    };
  }, [router]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (listening) {
        if (e.key === "Escape") setListening(false);
        return;
      }
      if (e.key === "c" || e.key === "C") setCalibrate((v) => !v);
      if (e.key === "r" || e.key === "R") if (calibrate) setQuads(defaultQuads());
      if (e.key === "/" || e.key === " ") {
        e.preventDefault();
        setListening(true); // the input mounts focused; Wispr Flow or the keyboard types into it
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [listening, calibrate]);

  useEffect(() => {
    if (calibrate) try { localStorage.setItem(STORE, JSON.stringify(quads)); } catch {}
  }, [quads, calibrate]);

  useEffect(() => {
    if (glow.length === 0) return;
    const t = setTimeout(() => setGlow([]), 25_000);
    return () => clearTimeout(t);
  }, [glow]);

  async function run(text: string) {
    setBusy(true);
    try {
      const res = await fetch("/api/tv/command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: tvKey, text }),
      });
      const out = await res.json();
      setAnswer(out.answer || (res.ok ? "Done." : "Couldn't do that."));
      setGlow(out.highlight ?? []);
      if (out.pin) router.refresh();
    } catch {
      setAnswer("Couldn't reach the server.");
    } finally {
      setBusy(false);
      setListening(false);
    }
  }

  const months = useMemo(
    () =>
      [0, 1, 2, 3].map((i) => {
        const d = new Date(Date.UTC(year, month - 1 + i, 1));
        const y = d.getUTCFullYear();
        const m = d.getUTCMonth() + 1;
        return { y, m, startDow: d.getUTCDay(), days: new Date(Date.UTC(y, m, 0)).getUTCDate() };
      }),
    [year, month]
  );

  return (
    <main
      className="fixed inset-0 overflow-hidden bg-black text-[#ebe3d3] select-none"
      onPointerMove={(e) => {
        if (!drag.current) return;
        const { q, c } = drag.current;
        setQuads((qs) =>
          qs.map((quad, i) =>
            i === q ? (quad.map((p, j) => (j === c ? { x: e.clientX / vp.w, y: e.clientY / vp.h } : p)) as Quad) : quad
          )
        );
      }}
      onPointerUp={() => (drag.current = null)}
    >
      {months.map((mo, qi) => {
        const q = quads[qi].map((p) => ({ x: p.x * vp.w, y: p.y * vp.h })) as Quad;
        const cells = Array.from({ length: mo.days }, (_, k) => {
          const slot = (mo.startDow + k) % 35; // sixth week wraps onto row 1, like the printed planner
          return { day: k + 1, col: slot % 7, row: Math.floor(slot / 7), date: iso(mo.y, mo.m, k + 1) };
        });
        return (
          <div key={qi}>
            <div
              style={{ position: "absolute", left: 0, top: 0, width: GRID_W, height: GRID_H, transformOrigin: "0 0", transform: quadMatrix3d(GRID_W, GRID_H, q) }}
            >
              {calibrate && <div className="absolute inset-0 border-2 border-dashed border-[#b9814a]" />}
              {cells.map((c) => {
                const n = eventCounts[c.date] ?? 0;
                const pinned = pins.filter((p) => p.date === c.date);
                const hot = glow.includes(c.date);
                return (
                  <div
                    key={c.date}
                    style={{ position: "absolute", left: (c.col * GRID_W) / 7, top: (c.row * GRID_H) / 5, width: GRID_W / 7, height: GRID_H / 5 }}
                    className={`p-1 ${c.date === today ? "outline outline-2 -outline-offset-2 outline-[#b9814a]" : ""} ${hot ? "outline outline-[5px] -outline-offset-4 outline-[#ffb347] animate-pulse" : ""}`}
                  >
                    <div className="absolute bottom-1 left-1 right-1 flex flex-wrap items-end gap-1">
                      {Array.from({ length: Math.min(n, 4) }, (_, i) => (
                        <span key={i} className="size-[9px] rounded-full bg-[#ffb347]" />
                      ))}
                      {pinned.map((p) => (
                        <span key={p.id} className="max-w-full truncate text-[11px] font-semibold leading-none text-[#ffb347]">
                          {p.text}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            {calibrate &&
              quads[qi].map((p, ci) => (
                <button
                  key={ci}
                  aria-label={`Month ${qi + 1} corner ${ci + 1}`}
                  onPointerDown={() => (drag.current = { q: qi, c: ci })}
                  className="absolute size-5 -translate-x-1/2 -translate-y-1/2 cursor-move rounded-full border-2 border-white bg-[#b9814a]"
                  style={{ left: p.x * vp.w, top: p.y * vp.h }}
                />
              ))}
          </div>
        );
      })}

      <aside className="absolute bottom-[4vh] right-[2vw] top-[4vh] flex w-[28vw] flex-col gap-[1.6vh] text-[1.15vw] leading-snug">
        <Block title="Today">
          {priorities.length === 0 ? <p className="text-[#8a7a68]">No priorities set.</p> : priorities.map((p, i) => <p key={i}>{i + 1}. {p}</p>)}
        </Block>
        <Block title="Pipeline">
          <p>{pipeline.length ? pipeline.map((s) => `${s.stage} ${s.count}`).join("  ·  ") : "No leads yet."}</p>
        </Block>
        <Block title="Shipped">
          {shipped.length === 0 ? <p className="text-[#8a7a68]">After tonight&apos;s digest.</p> : shipped.map((s) => <p key={s.title}>{s.title}</p>)}
        </Block>
        <Block title="Agents">
          <p>{agents}</p>
        </Block>
        {pins.some((p) => !p.date) && (
          <Block title="Pinned">
            {pins.filter((p) => !p.date).map((p) => <p key={p.id}>{p.text}</p>)}
          </Block>
        )}
        <div className="mt-auto">
          {answer && <p className="rounded-lg border border-[#ffb347] p-3 text-[1.4vw] text-[#ffb347]">{answer}</p>}
          {listening && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const t = input.current?.value.trim();
                if (t) run(t);
              }}
            >
              <input
                ref={input}
                autoFocus
                disabled={busy}
                placeholder="Say or type a command, Enter to run"
                className="mt-2 w-full rounded-lg border border-[#b9814a] bg-black px-3 py-2 text-[1.3vw] text-[#ebe3d3] outline-none"
              />
            </form>
          )}
          {!listening && <p className="mt-2 text-[0.9vw] text-[#4a3a2c]">/ command · C calibrate</p>}
        </div>
      </aside>
      {calibrate && <p className="absolute left-4 top-2 text-sm text-[#b9814a]">Calibrate: drag the dots onto each month&apos;s cells. R resets, C saves and exits.</p>}
    </main>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-[#3b2a20] p-[1vw]">
      <h2 className="mb-1 text-[0.9vw] font-semibold uppercase tracking-[0.2em] text-[#b9814a]">{title}</h2>
      {children}
    </section>
  );
}
