# Study workspace (`/study`)

A client-side practice workspace for finals. The public app contains **only generic code** plus a clearly labelled demo pack. Course names, exam dates, topics, questions, and your progress come from JSON files you import in your own browser.

## Boundaries
- Protected by `proxy.ts` (`/study` is in `PROTECTED_PREFIXES`) **and** re-checked in `app/(app)/study/page.tsx` with `requireSession()`, on top of the `(app)` layout's `requireOnboardedSession()`. Auth in this app is Google via NextAuth (`lib/auth/auth.ts`).
- No database, no migrations, no API routes, no external or paid calls. Nothing is uploaded.
- Pack and progress live in `localStorage` with a session-user namespace (`study-user:<userId>:study:pack:v1`, `study-user:<userId>:study:progress:v1:<packId>`). **Export backups**: clearing site data deletes them; a different browser has separate data. This is not encryption or cloud sync.

## Practice format
Modeled on the public practice tools `ShayJah/COSC-OnlineHub` (Apricode) and `ShayJah/Unfold`: mock quiz, topic drill, endless lab, exam mode (feedback held, timer, navigator), results by topic, review, retry missed, generated numeric and trace questions with worked explanations, partial credit.  Apricode's MIPS assembler and code-execution checker are **not** ported; written answers are self-marked instead.

## Honest labels
- `origin: "official"` needs a source URL. Generator output is always `"generated"` practice.
- Exams are `unverified` unless the pack supplies source URL, verified-at, date, and timezone. Unverified dates are shown but flagged, and blank means "not supplied".
- Marking is **auto** (the app compared with a stored answer) or **self** (you graded yourself). Mastery keeps them in separate columns, and a level needs at least 5 auto-marked attempts.

## Pack format (`study-pack/1`)
Start from `docs/study-pack.template.json` (five blank course slots) or the **Download blank template** button. Fields: optional `trainingPlan` text, `courses[]`, `topics[]`, `exams[]` (with `coverage` topic ids), `questions[]`. Question `type` is one of `mc`, `multi`, `num`, `match`, `order`, `seq`, `written`, `generated` (`stack-trace`, `queue-trace`, `linear-motion`). Every question carries `source: {label, url}`. Validation errors are listed on import. Keep real packs outside the repo (`*.private.json` and `study-pack.*.json` are git-ignored).

## Spaced revisit
Leitner boxes 1–6 with intervals 1, 2, 4, 8, 16, 32 days. A score of at least 0.8 moves up, below 0.5 resets to box 1, and anything in between holds. The daily plan is retrieval (≤8, due first), timed problems (2), error review (≤5), and spaced revisit (≤4).

## Commands you run yourself (nothing installs or changes accounts)
```bash
npm ci --ignore-scripts      # tests only need dependencies; skips prisma generate
npm test                     # vitest: includes tests/study-*.test.ts
npx eslint lib/study "app/(app)/study"
```
**Do not run `npm run build` against a real database**: it starts with `prisma migrate deploy`.
