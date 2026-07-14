# PersonalOS v1 — Build in Order Checklist

## 1. Phase 0 — Product Setup
- [ ] Confirm the MVP scope: dashboard, priorities, tasks, projects, calendar, habits, quick capture, AI coach, reports, sharing.
- [ ] Finalize the visual direction: calm, minimal, premium, mobile-first, desktop-friendly.
- [ ] Create a simple onboarding flow for first-time users.
- [ ] Define the exact success criteria for v1.

## 2. Phase 1 — Project Foundation
- [x] Create the Next.js app with TypeScript.
- [x] Set up Tailwind CSS and a basic component system.
- [x] Enable PWA support.
- [x] Create the initial app shell with top navigation and mobile-friendly layout.
- [x] Set up environment variables and deployment configuration for Vercel.

## 3. Phase 2 — Authentication and User Setup
- [x] Add authentication.
- [x] Create the user profile model and onboarding state.
- [x] Add protected routes.
- [x] Set up basic user settings such as timezone and theme.

## 4. Phase 3 — Database and Core Backend
- [x] Set up PostgreSQL and Prisma.
- [x] Create the initial schema for users, profiles, projects, tasks, priorities, and habits.
- [x] Add migrations.
- [x] Create CRUD APIs for core resources.
- [x] Add validation and basic error handling.

## 5. Phase 4 — Dashboard and Daily Planning
- [x] Build the dashboard page.
- [x] Implement the top 3 priorities experience.
- [x] Add a daily summary card with upcoming items and progress.
- [x] Add a quick actions area for capture and planning.
- [x] Connect the dashboard to real data from tasks and habits (calendar deferred — no Calendar model exists yet, that's Phase 6).

## 6. Phase 5 — Tasks and Projects
- [x] Build the tasks list page.
- [x] Implement create, edit, complete, and delete flows.
- [x] Add filters for today, upcoming, and completed.
- [x] Add task priority, due date, project association, and tags.
- [x] Build the projects page and project detail experience.
- [x] Link tasks to projects and show project-level summary progress.

## 7. Phase 6 — Calendar and Habits
- [x] Build the calendar view.
- [x] Add event creation and editing.
- [x] Connect calendar events to tasks (priorities skipped — no stable ID to link against; see note below).
- [x] Build the habits page.
- [x] Add habit creation and completion tracking.
- [x] Show streaks and habit progress.

## 8. Phase 7 — Quick Capture
- [x] Build the quick capture entry point.
- [x] Support text capture.
- [x] Support voice capture and transcription (browser Web Speech API — no new API key needed; Chrome/Edge only, degrades gracefully elsewhere).
- [x] Classify captures into tasks, ideas, or notes (manual classification; choosing "Task" also creates a real Task row).
- [x] Add an inbox-style capture stream.

## 9. Phase 8 — AI Coach and Reports
- [x] Add a simple AI coach conversation experience.
- [x] Connect the coach to user context from tasks, projects, and priorities.
- [x] Create daily accountability report generation.
- [x] Create weekly accountability report generation.
- [x] Make reports readable (markdown rendering) — sharing/export is Phase 9, not yet built.

## 10. Phase 9 — Sharing and Export
- [ ] Add shareable progress pages.
- [ ] Add PDF export for reports and summaries.
- [ ] Add privacy controls for what is shared.
- [ ] Add attractive shareable UI states.

## 11. Phase 10 — Polish and PWA Readiness
- [ ] Improve mobile navigation and touch interactions.
- [ ] Ensure the app works smoothly on iPhone and desktop.
- [ ] Add installability and offline-friendly behavior where practical.
- [ ] Improve loading states, empty states, and accessibility.
- [ ] Add analytics, error tracking, and observability.

## 12. Phase 11 — Launch Hardening
- [ ] Run QA across desktop and iPhone.
- [ ] Validate data persistence and auth flows.
- [ ] Test AI and capture flows with realistic usage.
- [ ] Review privacy, sharing, and export behavior.
- [ ] Prepare deployment checklist and basic documentation.

## 13. Recommended Execution Order for the Next Agent
1. Set up the app foundation and deployment configuration.
2. Add authentication and user profile support.
3. Create the database schema and migrations.
4. Build the app shell and navigation.
5. Implement the dashboard and priorities.
6. Implement tasks and projects.
7. Implement calendar and habits.
8. Implement capture and AI coach.
9. Implement reports and sharing.
10. Polish for PWA and launch readiness.

## 14. Definition of Done for v1
- [ ] Users can create and manage tasks, projects, and habits.
- [ ] Users can define and review their top 3 priorities daily.
- [ ] Users can capture ideas and receive AI support.
- [ ] Users can view daily and weekly accountability reports.
- [ ] Users can share a polished progress summary.
- [ ] The experience works on desktop and iPhone as a PWA.
