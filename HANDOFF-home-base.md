# Handoff: Home Base + safe autonomy (personal_OS / Amahoro)

Owner: Sheja (CS student, runs Amahoro Studio + cobuu Ventures). Self-described basic coder:
explain each step in one plain line so he learns it. Cost-sensitive: free tiers first.
Status: PLAN APPROVED FOR PHASES 0-3 ONLY. Stop and ask before Phase 4 or anything that sends.

## Ground rules
- Work on a new branch `home-base`. Never commit to `main` directly.
- Do NOT commit the 44 uncommitted deletions currently in the tree (app/fonts, brand/shay-brand, progress/2026-10-03.md). See Phase 0.
- Never open, print or commit `.env*`. Env var names live in `.env.example`.
- Gmail scope is compose-only (drafts). Do not add a send scope until Phase 4 is approved.
- `npm run build` runs `prisma migrate deploy`. Before adding any migration, confirm preview deploys do not share the production Neon DATABASE_URL (use a Neon branch for previews if they do).
- Estimates below are rough guesses, not measurements.

## What already exists (reuse, do not rebuild)
- Next.js 16 + React 19 + Prisma/Neon + next-auth (GitHub/Google), PWA, deployed on Vercel.
- `progress/YYYY-MM-DD.md` daily entries (Oct 4-28) = the progress log.
- Tables: Notification, Report (unique per user+type+periodStart), AgentRun (has costUsd), EmailDraft (status, approvedAt, approvedByUserId), CrmRecord, Business.
- Agent runtime: `agents/runtime.ts`, `agents/definitions.ts` (coach, daily-brief, research-draft), `lib/agents/*` (daily-brief, morning-outreach, research-draft).
- Crons in vercel.json: daily-brief, sheet-sync, hevy-sync (+ morning-outreach route). `isCronRequest` in lib/api/cron.ts checks CRON_SECRET.
- `lib/ai-limit.ts` caps agent runs (100/day), not dollars.
- Auth: `proxy.ts` has a prefix list; pages must also call `requireSession` (see app/(app)/dashboard/page.tsx).
- Sheja's Oct 28 note: wants "a visual, non-technical layer over GitHub that shows tangible product changes instead of raw code". Home Base is that.

## Audit findings (read-only, from Nov 16)
1. LIKELY BREAKER: `app/fonts/` is empty on disk but `app/layout.tsx` loads `./fonts/HankenGrotesk.ttf` and `./fonts/BigShoulders.ttf`. Git shows 44 files deleted (2 fonts, 41 brand files, progress/2026-10-03.md); folder changed Nov 9. It may be an iCloud/mount artifact since the repo is under Documents. VERIFY on the Mac first.
2. Decap CMS login (`app/api/decap/auth`) requests GitHub `repo` scope (all repos, read/write). State cookie is checked, but no allow-list seen. Tighten or remove.
3. `proxy.ts` is a prefix list and many listed prefixes have no route (habits, capture, coach, goals, journal, fitness, share-links, reports, settings). New `/home` must be added AND its page must call `requireSession`.
4. `next-auth` is `^5.0.0-beta.31`: pin exactly.
5. AI cap counts runs, not dollars: add a dollar cap using AgentRun.costUsd before autonomy.
6. Fine: .env.local is git-ignored/untracked; all 4 cron routes check CRON_SECRET; Gmail is draft-only.
7. Tests exist (tests/*.test.ts, vitest) but were not run: run `npm test` first.

## Plan
Phase 0 (about 30 min, read-only first): `git status` on the real Mac. If the deleted files exist elsewhere/iCloud, restore with `git checkout -- <paths>`; if deleted on purpose, ask Sheja and commit the deletion as its own commit. Run `npm test` and `npm run build` locally. Create branch `home-base`.
Phase 1 (about 1 hr): fonts fixed; pin next-auth; tighten/remove Decap `repo` scope; add `/home` to proxy.ts.
Phase 2 (about half a day): Home Base at `/home` (read-only, one screen, each card readable in 5 seconds):
  1. Today: top priorities + due (reuse dashboard queries).
  2. Shipped this week: plain-English cards from git commits + progress entries, no code.
  3. Agents: what ran overnight, what needs approval, spend vs cap (AgentRun).
  (Later: Pipeline card from CRM/outreach board; Memory card from the Obsidian vault digest.)
  Nightly cron `home-digest`: reads new commits + progress files + agent runs, asks Claude for one-line summaries, saves as `Report` type `home_digest` (idempotent per day). Page only reads. Add the cron to vercel.json with CRON_SECRET check.
  Later: `/home/tv` projector mode, big rotating slides, WORK ITEMS ONLY. Progress entries contain personal items (job applications, meetings): tag or section-filter them out of anything shown on shared screens.
Phase 3: rewrite the skill: installed name is `shay-ops`; the draft file I wrote is named `amahoro-ops` (mismatch). Rename, add the autonomy ladder below and these repo facts. Keep Obsidian vault for personal notes and progress/ for the work log; the digest reads both.
Phase 4 (about 1 day, NEEDS EXPLICIT APPROVAL): Level 1 "approve and send": add Gmail send scope used only by a sender worker; `OutboundQueue` with send-after time (10-min undo window); `AutonomyPolicy` table (action type, level, daily cap, allowed hours, kill switch); every send logged to AgentRun/audit with who, what, why; dollar spend cap. Then 2 weeks of clean approvals before any higher level.
Phase 5: Level 2 for warm replies and calendar invites to existing contacts.

## Autonomy ladder (per action type, earned)
- Level 0: drafts only (today).
- Level 1: one-click approve then send.
- Level 2: auto-send for safe categories (replies to people who already wrote), with daily cap, business hours, undo window, STOP honored, kill switch.
- Level 3: auto-send cold outreach. Last, only with data. Canada's anti-spam law (CASL) has consent, sender-ID and unsubscribe rules: Sheja should check it (not legal advice).
- Promotion: about 20 consecutive approvals with few edits. Any bounce, complaint or wrong fact auto-demotes.
- Always human-approved: money, deleting data, new accounts, public posts.
- Reversible + internal actions (e.g. generating a demo) can be autonomous early.

## Open questions for Sheja (ask at the start)
1. Were the fonts/brand files deleted on purpose on Nov 9?
2. Should "Shipped this week" cover only this repo, or Airus and other repos too?
3. First autonomous action: replies to warm leads, or cold outreach?

## First prompt to give Claude Code
"Read HANDOFF-home-base.md. Start Phase 0 only: verify the deleted files, run tests and build, create the home-base branch, then report back and wait."
