import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const read = (rel: string) => readFileSync(path.resolve(__dirname, "..", rel), "utf8");

describe("/study is protected server-side", () => {
  it("proxy.ts lists /study as a protected prefix", () => {
    const m = read("proxy.ts").match(/PROTECTED_PREFIXES\s*=\s*\[([\s\S]*?)\]/);
    expect(m).not.toBeNull();
    expect(m![1]).toMatch(/"\/study"/);
  });
  it("the page re-checks the session itself and does not rely on the proxy alone", () => {
    const page = read("app/(app)/study/page.tsx");
    expect(page).toMatch(/requireSession\(\)/);
    expect(page).not.toMatch(/prisma/);
  });
  it("the study libs never touch the database or server-only modules", () => {
    for (const f of ["pack", "grade", "generators", "progress", "session", "plan", "demo-pack"]) {
      const src = read(`lib/study/${f}.ts`);
      expect(src, f).not.toMatch(/prisma|@\/lib\/db|server-only|fetch\(|XMLHttpRequest/);
    }
  });
});
