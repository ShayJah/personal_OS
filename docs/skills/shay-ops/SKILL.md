---
name: "shay-ops"
description: Run and extend Sheja's business ops stack (Airus demo factory, outreach agents, shared memory vault, home hub, projector display). Use when he asks to build, automate, maintain, or demo any part of it, or says "init:".
---

# Shay Ops (Amahoro Studio + cobuu Ventures)

Goal: shorten the path from interested prospect to live demo to paying client, at the lowest possible cost. Anything that does not serve that path waits.

## Principles
- Customer-facing systems (demos, webhooks) run in the cloud so they survive home outages.
- Internal automation (leads, drafts, memory, reports) runs on the M1 at home.
- Agents draft; the human approves anything outbound or involving money.
- Spend nothing new until a prospect commits. Free tiers first.
- One source of truth for memory (the vault below). Never keep a second copy by hand.
- Explain each step in one plain line so Sheja learns it, not just receives it.

## Machines
- M1 (always on, clamshell): orchestrator. Claude Code in tmux, launchd jobs, Remote Control. Setup: never sleep, `sudo pmset -a disablesleep 1`, Tailscale, SSH.
- M5 (his own): cockpit. Reaches the M1 over SSH, Tailscale or Remote Control.
- Raspberry Pi 4: read-only display (calendar projector, later the memory board).
- Cloud: Vercel + Supabase free tiers for the demo factory and web board.

## Memory vault (Obsidian, plain markdown)
- Vault folder lives in iCloud Drive, already paid for, so it syncs to the M1, M5 and iPhone for free.
- Human notes live anywhere in the vault. Agents write only inside `/agent/`, which prevents sync conflicts.
- Layers: `people/`, `facts/`, `open-loops/`, `decisions/`, `weekly-digest/`. Every entry gets a date and a source.
- Nightly: the curator agent writes digests, flags stale items (never deletes), and commits a snapshot to a private GitHub repo.
- The Pi and the web board read that repo. Instinct memory feeds in through the shared Drive file unless it offers an export or API (unconfirmed).

## Agents (one job each)
1. Scout: finds and ranks leads (e.g. businesses with no website).
2. Drafter: writes outreach into Gmail drafts, rotating Amahoro and cobuu. Never auto-sends.
3. Demo builder: business description (dictated or scraped) -> config -> live `/d/<slug>` demo.
4. Curator: nightly vault digests and the CRM board update.
5. Watchdog: health, errors and spend; weekly summary text to Sheja.

## Money loop
Prospect replies interested -> demo builder generates their demo from their site -> drafter prepares a reply with the link -> Sheja approves. Optimize this step first.

## Build order with gates
0. Foundations (days 1-2): M1 hub, vault, private repo, secrets. Cost $0.
1. Demo factory + Scout + Drafter (weeks 1-2). Gate: 3+ demos shown per week.
2. Live-demo channels (weeks 2-3): iMessage sandbox and web chat for demos only. No paid line until a client says yes.
3. Memory board, Curator, Watchdog (weeks 3-4): web app first, projector mode second.
4. Calendar projector: not profit-driving, so do it last.

## Demo factory rules
- Dictation -> one Claude call -> config (name, services, prices, hours, staff, tone, colors).
- The intern confirms 5 key facts before presenting. Demos use fake seeded data and a visible demo label.
- Real calendar booking and the iMessage line switch on only for paying clients.

## Initialize
`init: <what> for <business>` -> ask at most 3 picks with defaults: channel (default web chat), data source (one pasted link), host (default cloud). Return a working demo, a one-screen status card (what runs, where, monthly cost), and auto-restart.

## Repo facts (personal_OS, the Amahoro app)
- Next.js 16 + React 19 + Prisma/Neon + next-auth (pinned to 5.0.0-beta.31), PWA on Vercel. Work on branches, never commit to `main` directly.
- Progress log: `progress/YYYY-MM-DD.md` (work log). Obsidian vault = personal notes. The nightly digest reads both. Note the repo is PUBLIC, so never put private items in `progress/`.
- Tables to reuse: Notification, Report (unique per user+type+periodStart; `home_digest` lives here), AgentRun (has costUsd), EmailDraft (status, approvedAt, approvedByUserId), CrmRecord, Business.
- Agents: `agents/runtime.ts`, `agents/definitions.ts`, `lib/agents/*`. Crons are in `vercel.json` and every cron route must check `isCronRequest` (CRON_SECRET).
- Home Base: `/home` (read-only, page only reads). Nightly `/api/cron/home-digest` writes the Report. `/home/tv` projector mode is later and shows work items only.
- New pages need BOTH a prefix in `proxy.ts` and `requireSession()` in the page.
- `npm run build` runs `prisma migrate deploy`. Before adding a migration, confirm preview deploys do not share the production Neon DATABASE_URL. Locally run `npx next build` instead.
- Never open, print or commit `.env*`. Names live in `.env.example`. Gmail scope is compose-only (drafts) until a send scope is explicitly approved.
- Spend: `AI_DAILY_USD_CAP` (default $1) vs AgentRun.costUsd. `lib/ai-limit.ts` caps run counts only.

## Autonomy ladder (per action type, earned)
- Level 0: drafts only (today).
- Level 1: one-click approve, then send (10-minute undo window, logged).
- Level 2: auto-send safe categories (replies to people who already wrote, calendar invites to existing contacts) with daily cap, business hours, undo window, STOP honored, kill switch.
- Level 3: auto-send cold outreach. Last, only with data. Check Canada's anti-spam law (CASL: consent, sender ID, unsubscribe). Not legal advice.
- Promotion: about 20 consecutive approvals with few edits. Any bounce, complaint or wrong fact auto-demotes.
- Always human-approved: money, deleting data, new accounts, public posts.
- Reversible + internal actions (e.g. generating a demo) can be autonomous early.
- Phase 4 (Level 1 plumbing: send scope, OutboundQueue, AutonomyPolicy) needs explicit approval first.

## Safety
Projector and shared views show work items only, never private contacts, money, or personal notes. Keep a kill switch and a monthly spend cap on every agent.
