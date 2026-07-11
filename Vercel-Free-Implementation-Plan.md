# PersonalOS v1 — Vercel-Ready, Free-First Implementation Plan

## 1. Direction
This plan is designed for a production-ready PersonalOS v1 that can be deployed on Vercel while staying free-first and low-cost. The goal is to use open-source tools and free-tier services wherever possible, while keeping the architecture clean enough for future growth.

## 2. Free-First Product Stack

### Frontend
- Next.js with TypeScript
- Tailwind CSS
- shadcn/ui for polished, accessible UI components
- PWA support via next-pwa

### Backend
- Next.js API routes and server actions
- Prisma ORM
- PostgreSQL database

### Authentication
- NextAuth.js or Clerk free tier
- Recommended default: NextAuth.js for full control and cost avoidance

### Database
- Neon Postgres free tier
- Suitable for early-stage production use and simple scaling

### Storage
- Vercel Blob or Supabase Storage free tier
- Use for attachments, generated PDFs, and optional images

### AI Layer
- Use a provider-agnostic AI abstraction so the app can switch providers later
- Recommended free-first starting point:
  - Groq or OpenRouter-style free-tier access for chat and summaries
  - Browser speech recognition for voice capture where possible
- Important: keep AI features behind a clear fallback so the app remains usable without AI

### Analytics and Monitoring
- Vercel Analytics free tier
- Sentry free tier for error monitoring

### Deployment
- Vercel free hobby tier for hosting and preview deployments

## 3. Why This Stack Fits the Goal
- It is easy to deploy on Vercel.
- It avoids heavy infrastructure costs in the first version.
- It supports a polished PWA experience on desktop and iPhone.
- It keeps the product modular so the next coding agent can build it incrementally.

## 4. Recommended Folder Structure
```text
PersonalOS/
  app/
    (app)/
      dashboard/
      tasks/
      projects/
      calendar/
      habits/
      coach/
      capture/
      reports/
      share/
    api/
      auth/
      tasks/
      projects/
      calendar/
      habits/
      capture/
      coach/
      reports/
      share/
    layout.tsx
    page.tsx
    globals.css
  components/
    layout/
    ui/
    features/
    forms/
  lib/
    auth/
    db/
    ai/
    storage/
    utils/
  prisma/
    schema.prisma
  public/
    icons/
    manifest.json
  types/
  middleware.ts
  next.config.js
  package.json
  .env.example
```

## 5. Architecture Overview
### Client Layer
- Responsive app shell for desktop and iPhone
- Feature-specific pages for dashboard, tasks, projects, calendar, habits, coach, capture, and reports
- PWA installable shell and offline-safe navigation where practical

### Server Layer
- Next.js app router
- Server actions for mutations
- API routes for AI and data operations
- Background job hooks for report generation and share-link generation

### Data Layer
- PostgreSQL for structured app data
- Prisma for schema management and queries
- Object storage for generated PDFs and media files

### AI Layer
- A single service interface for:
  - coaching responses
  - daily and weekly report generation
  - task prioritization suggestions
  - capture classification
- This keeps AI logic separate from UI and domain logic

## 6. Database Plan
Use a relational schema with the following primary domains:
- Users and profiles
- Projects
- Tasks
- Priorities
- Calendar events
- Habits and habit logs
- Captures
- AI conversation threads
- AI reports
- Share links

### Core schema responsibilities
- Keep user data normalized and queryable.
- Store AI-generated summaries separately from primary user records.
- Keep reports and share metadata easy to query and expire.

## 7. API Architecture
### Recommended API boundaries
- Auth API
- Dashboard API
- Tasks API
- Projects API
- Calendar API
- Habits API
- Capture API
- Coach API
- Reports API
- Share API

### Design rules
- Use REST-style routes for core resources.
- Keep AI requests behind a dedicated service layer.
- Validate input consistently.
- Avoid overloading the UI with business logic.

## 8. MVP Scope for the First Build
### Included in MVP
- Dashboard
- Top 3 daily priorities
- Tasks
- Projects
- Calendar
- Habits
- Quick capture
- AI coach
- Daily and weekly accountability reports
- Shareable progress links and PDFs
- Responsive desktop and iPhone PWA experience

### Explicitly deferred
- Real-time multi-user collaboration
- Deep third-party integrations
- Full streaming voice chat
- Heavy automation rules
- Advanced analytics dashboards

## 9. Free-Tier Guardrails
To keep the app free and sustainable:
- Prefer serverless functions over always-on infrastructure.
- Avoid unnecessary background workers.
- Keep AI prompts lightweight and rate-limited.
- Use browser-based voice transcription when possible.
- Cache dashboard data aggressively.
- Generate reports on demand or on a light schedule rather than continuously.

## 10. Implementation Milestones for the Next Coding Agent
### Milestone 1 — Foundation
- Scaffold the Next.js app
- Configure TypeScript, Tailwind, and PWA support
- Set up Neon Postgres and Prisma
- Set up authentication

### Milestone 2 — Core Data Model
- Implement users, profiles, projects, tasks, and priorities
- Build CRUD APIs and basic UI screens
- Create dashboard summary data

### Milestone 3 — Planning Modules
- Add calendar, habits, and project detail flows
- Build the daily priority experience
- Wire dashboard widgets

### Milestone 4 — Capture and AI
- Build quick capture for text and voice
- Add AI coach conversation flow
- Add daily and weekly report generation

### Milestone 5 — Sharing and Polish
- Add share pages and PDF export
- Improve mobile UX and PWA installation experience
- Add analytics, error monitoring, and accessibility improvements

## 11. Step-by-Step Execution Order
1. Create the Next.js project structure.
2. Configure authentication and user profile creation.
3. Set up PostgreSQL and Prisma schema.
4. Build the app shell and navigation.
5. Implement the dashboard and top 3 priorities.
6. Implement tasks and projects.
7. Implement calendar and habits.
8. Implement capture and AI coach.
9. Implement reports and sharing.
10. Add PWA polish and deployment hardening.

## 12. Recommended Default Providers
If the goal is to remain cost-effective, the best default provider choices are:
- Database: Neon
- Auth: NextAuth.js
- Storage: Vercel Blob or Supabase Storage
- AI: Groq/OpenRouter-style free tier or a mock fallback in early iterations
- Analytics: Vercel Analytics

## 13. Final Recommendation
Build v1 as a polished, lightweight, server-rendered PWA with a strong free-tier foundation. Keep the first release focused on core planning, capture, and accountability workflows. Avoid unnecessary complexity until the product proves traction.
