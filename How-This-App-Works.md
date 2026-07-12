# How This App Works (Plain-English Guide)

This is the "explain it like I'm smart but new to this" guide. It walks through every moving piece of PersonalOS and how they talk to each other — no prior Next.js/Prisma/Neon experience assumed.

---

## 1. The Big Picture, in One Paragraph

You visit a page in your browser. Next.js (the framework) figures out which piece of code should handle that page, runs it on a server, and that code asks Prisma (a translator) to fetch or save data. Prisma sends real SQL commands over the internet to Neon (a Postgres database that lives in the cloud instead of on your laptop). NextAuth handles "who is this person" by talking to GitHub. The result gets turned into HTML and sent back to your browser. That's the whole loop.

```
Your browser  →  Next.js (the app)  →  Prisma (the translator)  →  Neon (the database)
     ↑                                                                      │
     └──────────────────────── HTML / JSON response ──────────────────────┘
```

---

## 2. The Cast of Characters

| Tool | What it actually is | Analogy |
|---|---|---|
| **Next.js** | The framework that runs your app — handles routing, rendering, and serving pages | The building your store operates out of |
| **React** | The library that builds the actual UI (buttons, forms, text) | The furniture and displays inside the building |
| **Tailwind CSS** | A way to style things using short class names instead of writing CSS files | Pre-made paint colors you just point at |
| **Prisma** | A tool that turns JavaScript code into SQL database queries, and turns results back into JavaScript objects | A translator standing between you and a database that only speaks SQL |
| **Neon** | An actual PostgreSQL database, hosted in the cloud, free tier | A filing cabinet that lives on the internet instead of in your office |
| **NextAuth (Auth.js)** | Handles "sign in with GitHub" and remembers who's logged in | The bouncer + wristband system at a club |
| **Vercel** | Where the app is hosted once deployed (not set up yet — that's a later phase) | The actual storefront location, once you're open for business |

---

## 3. Where Things Live (Folder Map)

```
PersonalOS/
├── app/                      ← every URL in your app maps to a file in here
│   ├── page.tsx               → the "/" landing page
│   ├── login/page.tsx         → the "/login" page
│   ├── onboarding/page.tsx    → the "/onboarding" page
│   ├── (app)/                 → routes that require being signed in
│   │   ├── layout.tsx          → the shell (top nav) wrapping every page below
│   │   ├── dashboard/page.tsx  → "/dashboard"
│   │   ├── settings/page.tsx   → "/settings"
│   │   └── ...                 → tasks, projects, calendar, habits, etc.
│   └── api/                   → backend-only endpoints (no visible page, just data)
│       ├── tasks/route.ts      → GET/POST for "/api/tasks"
│       ├── tasks/[id]/route.ts → GET/PATCH/DELETE for "/api/tasks/abc123"
│       └── ...
├── lib/
│   ├── db.ts                  → the one shared connection to your database
│   ├── auth/                  → sign-in logic
│   ├── api/                   → shared helpers for API routes (auth checks, error formatting)
│   ├── user/                  → reading/writing user preferences
│   └── validation/            → rules for what a valid Task/Project/Habit looks like
├── prisma/
│   ├── schema.prisma           → the one file that describes every database table
│   └── migrations/             → a history log of every change ever made to those tables
├── components/                → reusable pieces of UI (buttons, nav bar, cards)
├── proxy.ts                    → runs before almost every request; handles "are you logged in?"
├── .env                        → secrets used by command-line tools (Prisma)
└── .env.local                  → secrets used by the running app (never committed to git)
```

**The rule of thumb:** if it's a page a human looks at, it's in `app/` outside of `app/api/`. If it's raw data in/out with no visual page, it's in `app/api/`. If it's logic reused by multiple pages, it's in `lib/`.

---

## 4. The Database Layer: Prisma + Neon

### What is Neon, really?
Neon is just Postgres — the same open-source database software companies have used for decades — except Neon runs it for you on their servers so you don't have to install and manage Postgres yourself. You get a **connection string**, which is really just an address + username + password all mashed into one URL:

```
postgresql://neondb_owner:PASSWORD@HOST/neondb?sslmode=require
           ↑ username        ↑ password ↑ where it lives  ↑ database name
```

This lives in `.env` and `.env.local`. It's never committed to git (check `.gitignore`) because anyone with that string can read/write your entire database.

### What is Prisma, really?
Without Prisma, to get a task from the database you'd write raw SQL:
```sql
SELECT * FROM "Task" WHERE "userId" = 'abc123' AND "completed" = false;
```
With Prisma, you write TypeScript instead, and Prisma turns it into that SQL for you:
```ts
await prisma.task.findMany({ where: { userId: "abc123", completed: false } });
```
The benefit: your editor autocompletes field names, typos get caught before you even run the code, and you never have to worry about SQL injection.

### The schema file — the single source of truth
`prisma/schema.prisma` describes every table and every column. For example:
```prisma
model Task {
  id        String   @id @default(cuid())
  userId    String
  title     String
  completed Boolean  @default(false)
  ...
}
```
This says: "there's a table called Task, it has an id, a userId, a title, and a completed flag that defaults to false."

### Migrations — the change history
Every time you change `schema.prisma` (add a column, add a table), you need to tell the actual database to catch up. That's what a **migration** is: a recorded, numbered SQL script that says "here's exactly what changed." They live in `prisma/migrations/` and get replayed in order on any fresh database (like when you deploy to production).

The commands you'll use:
- `npx prisma migrate dev --name describe_your_change` — the normal way to evolve the schema during development (asks you to confirm anything risky)
- `npx prisma db push` — a faster, no-history-file way to sync schema during early prototyping (what we used here, since Prisma's interactive migration flow doesn't work over this remote connection)
- `npx prisma studio` — opens a visual, spreadsheet-like editor for your actual data in the browser. Genuinely the easiest way to eyeball what's in your database.
- `npx prisma generate` — regenerates the TypeScript types Prisma uses, based on the schema. Runs automatically after migrate/push.

### The one shared connection: `lib/db.ts`
Every serverless function *could* open its own new connection to Neon, but that gets expensive and slow fast. `lib/db.ts` creates one `PrismaClient` and reuses it everywhere:
```ts
export const prisma = globalForPrisma.prisma || new PrismaClient();
```
Anywhere in the backend code, you just `import { prisma } from "@/lib/db"` and start querying.

---

## 5. The Auth Layer: How "Sign in with GitHub" Actually Works

1. You click **"Continue with GitHub"** on `/login`.
2. Your browser gets redirected to GitHub's real website, where GitHub asks "do you want to let PersonalOS see your email and profile?"
3. You approve. GitHub redirects you back to `http://localhost:3000/api/auth/callback/github` with a temporary code.
4. NextAuth (`lib/auth/auth.ts`) exchanges that code for your GitHub profile info (name, email, avatar).
5. **This is the part that connects to the database:** the `signIn` callback runs `prisma.user.upsert(...)` — meaning "find the User row with this email, or create one if it doesn't exist yet." It also creates an empty `Profile` row for them at the same time.
6. NextAuth then creates a **JWT** (a signed, tamper-proof token) containing your database user ID, and stores it in an encrypted cookie in your browser.
7. On every future request, that cookie proves who you are — no database lookup needed for that check, since the cookie itself is cryptographically signed.

```
You click "Sign in"
   → redirected to github.com (real GitHub, not us)
   → you approve
   → GitHub sends you back with a temporary code
   → our server exchanges the code for your profile
   → we upsert a User + Profile row in Neon
   → we hand your browser a signed cookie
   → every future request just reads that cookie
```

### `proxy.ts` — the bouncer at the door
Next.js 16 renamed the old "middleware.ts" file to `proxy.ts`. It runs *before* almost every request hits a page. Ours does one job: check if you have a valid session cookie, and if you're trying to visit a protected page (`/dashboard`, `/tasks`, etc.) without one, redirect you to `/login`.

### Why some checks happen in `proxy.ts` and others happen in the page itself
`proxy.ts` runs on *every single request*, including ones that just prefetch a link in the background — so it should stay cheap (no database calls). That's why it only checks "is there a valid cookie at all?"

The deeper check — "has this specific user finished onboarding?" — needs an actual database read (`lib/auth/dal.ts` → `requireOnboardedSession()`), so it happens inside the page/layout itself (`app/(app)/layout.tsx`), which only runs when someone actually loads one of those pages, not on every prefetch.

---

## 6. The API Layer: How Data Actually Gets Saved

Every resource (tasks, projects, habits, priorities) follows the exact same recipe. Take tasks as the example:

**`app/api/tasks/route.ts`** handles the plural URL `/api/tasks`:
- `GET` → list all of *your* tasks (never anyone else's — every query is filtered by `userId`)
- `POST` → create a new task

**`app/api/tasks/[id]/route.ts`** handles a specific one, `/api/tasks/abc123`:
- `GET` → fetch that one task
- `PATCH` → update it (mark complete, change the title, etc.)
- `DELETE` → remove it

### Every route follows the same 3 steps
```ts
export async function POST(request: NextRequest) {
  try {
    const userId = await requireUserId();        // 1. Who are you? (401 if not signed in)
    const body = createTaskSchema.parse(...);     // 2. Is your data valid? (400 if not)
    const task = await prisma.task.create(...);   // 3. Do the actual database work
    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    return handleApiError(error);                 // Turns any thrown error into a clean JSON response
  }
}
```

- **Step 1** lives in `lib/api/auth.ts` — throws `UnauthorizedError` if you're not signed in.
- **Step 2** lives in `lib/validation/*.ts` — uses a library called **Zod** to describe "a valid task must have a title between 1–300 characters," etc. If your data doesn't match, it throws automatically before touching the database.
- **Step 3** is just Prisma talking to Neon.
- Every single query includes `userId` in its `where` clause — this is what stops User A from ever seeing or editing User B's tasks. It's not optional or an afterthought; it's baked into every query.

### Why routes instead of directly calling Prisma from a page?
Some parts of the app (like the settings form) call Prisma directly through **Server Actions** (functions marked `"use server"` that run only on the server, callable directly from a form). The `/api/*` routes exist for resources that need a proper URL-based API — useful later if you build a mobile app, a browser extension, or let other tools talk to PersonalOS.

---

## 7. Environment Variables — What Each One Does

| Variable | Used by | Purpose |
|---|---|---|
| `AUTH_SECRET` | NextAuth | Encrypts/signs your session cookies. If this leaked, someone could forge a session as any user. |
| `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET` | NextAuth | Identifies your app to GitHub's OAuth system. Comes from a GitHub OAuth App you create yourself. |
| `DATABASE_URL` | Prisma | The full address + credentials for your Neon database. |

`.env` is read by command-line tools (`npx prisma ...`). `.env.local` is read by the actual running app (`npm run dev`). We keep `DATABASE_URL` in both so both contexts can reach the database. Neither file is ever committed to git — `.gitignore` blocks anything matching `.env*` except `.env.example`, which is a template with the *names* of the variables but none of the real values, safe to commit so future-you (or teammates) knows what to fill in.

---

## 8. Walking Through One Full Request

Let's trace what happens when you open `/dashboard` after signing in:

1. Browser requests `GET /dashboard`.
2. `proxy.ts` runs first — sees your valid session cookie, lets the request through.
3. Next.js runs `app/(app)/layout.tsx` — calls `requireOnboardedSession()`, which checks your session *and* does a real database read (`getUserPreferences`) to confirm you finished onboarding. If not, redirects to `/onboarding`.
4. Layout renders the top nav, then renders `app/(app)/dashboard/page.tsx` inside it.
5. The dashboard page calls `getUserPreferences(session.user.id)` again — but since it's wrapped in React's `cache()`, if it was already fetched once in this same request, it's reused instead of hitting the database twice.
6. The page returns JSX (React's HTML-like syntax), which Next.js turns into actual HTML.
7. That HTML streams back to your browser.

---

## 9. How to Add a New Feature (The Recipe)

Say you want to add "Notes" as a new resource. Here's the repeatable pattern used everywhere in this app:

1. **Schema**: add a `Note` model to `prisma/schema.prisma`.
2. **Migrate**: run `npx prisma migrate dev --name add_notes` (or `db push` if that fails non-interactively).
3. **Validate**: create `lib/validation/note.ts` with a Zod schema for what a valid note looks like.
4. **API**: create `app/api/notes/route.ts` (list + create) and `app/api/notes/[id]/route.ts` (get/update/delete), copying the pattern from `app/api/tasks/`.
5. **UI**: build the page in `app/(app)/notes/page.tsx`, calling your new API (or Prisma directly via a Server Action, like `settings` does).

That's the whole loop, every time.

---

## 10. Handy Commands Cheat Sheet

```bash
npm run dev                                    # start the app locally at localhost:3000
npx prisma studio                              # open a visual editor for your live data
npx prisma migrate dev --name your_change_name # normal way to evolve the schema
npx prisma db push                             # quick schema sync, no migration history file
npx tsc --noEmit                               # check for TypeScript errors without building
npx eslint .                                   # check for code style/quality issues
npm run build                                  # build the production version (catches most bugs)
```
