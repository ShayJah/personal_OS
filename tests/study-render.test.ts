import { readFileSync } from "node:fs";
import path from "node:path";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { StudyWorkspace } from "@/app/(app)/study/study-workspace";
import { Runner } from "@/app/(app)/study/study-runner";
import { DEMO_PACK } from "@/lib/study/demo-pack";
import { realizeAll } from "@/lib/study/generators";
import { validatePack } from "@/lib/study/pack";

describe("render smoke tests (server render, no browser)", () => {
  it("the workspace renders five empty course slots and no invented course data", () => {
    const html = renderToString(createElement(StudyWorkspace));
    expect(html.match(/Empty slot/g)).toHaveLength(5);
    expect(html).toMatch(/This page ships no course data/);
    expect(html).not.toMatch(/\b20\d\d-\d\d-\d\d\b/); // no dates appear until a pack supplies them
  });
  it("the runner renders every question type without throwing", () => {
    const items = realizeAll(DEMO_PACK, 3);
    const types = new Set(items.map((q) => q.type));
    expect([...types].sort()).toEqual(["match", "mc", "multi", "num", "order", "seq", "written"]);
    for (const q of items) {
      const html = renderToString(createElement(Runner, { pack: DEMO_PACK, mode: "drill", items: [q], exam: false, endless: false, onAttempt: () => {}, onExit: () => {}, onRetry: () => {} }));
      expect(html, q.id).toMatch(/Generated practice/);
      expect(html, q.id).toMatch(/Source:/);
    }
  });
  it("exam mode shows the navigator and the clock", () => {
    const items = realizeAll(DEMO_PACK, 3).slice(0, 4);
    const html = renderToString(createElement(Runner, { pack: DEMO_PACK, mode: "mock", items, exam: true, endless: false, durationMin: 30, onAttempt: () => {}, onExit: () => {}, onRetry: () => {} }));
    expect(html).toMatch(/Question navigator/);
    expect(html).toMatch(/30:00 left/);
  });
});

describe("blank template", () => {
  it("docs/study-pack.template.json validates and is entirely blank", () => {
    const raw = JSON.parse(readFileSync(path.resolve(__dirname, "../docs/study-pack.template.json"), "utf8"));
    expect(validatePack(raw).ok).toBe(true);
    expect(raw.courses).toHaveLength(5);
    expect(raw.courses.every((c: { code: string; title: string }) => c.code === "" && c.title === "")).toBe(true);
    expect(raw.exams).toEqual([]);
    expect(raw.questions).toEqual([]);
  });
});
