# PersonalOS v1 — Build in Order Checklist

## 1. Phase 0 — Product Setup
- [ ] Confirm the MVP scope: dashboard, priorities, tasks, projects, calendar, habits, quick capture, AI coach, reports, sharing.
- [ ] Finalize the visual direction: calm, minimal, premium, mobile-first, desktop-friendly.
- [ ] Create a simple onboarding flow for first-time users.
- [ ] Define the exact success criteria for v1.

## 2. Phase 1 — Project Foundation
- [ ] Create the Next.js app with TypeScript.
- [ ] Set up Tailwind CSS and a basic component system.
- [ ] Enable PWA support.
- [ ] Create the initial app shell with top navigation and mobile-friendly layout.
- [ ] Set up environment variables and deployment configuration for Vercel.

## 3. Phase 2 — Authentication and User Setup
- [ ] Add authentication.
- [ ] Create the user profile model and onboarding state.
- [ ] Add protected routes.
- [ ] Set up basic user settings such as timezone and theme.

## 4. Phase 3 — Database and Core Backend
- [ ] Set up PostgreSQL and Prisma.
- [ ] Create the initial schema for users, profiles, projects, tasks, priorities, and habits.
- [ ] Add migrations.
- [ ] Create CRUD APIs for core resources.
- [ ] Add validation and basic error handling.

## 5. Phase 4 — Dashboard and Daily Planning
- [ ] Build the dashboard page.
- [ ] Implement the top 3 priorities experience.
- [ ] Add a daily summary card with upcoming items and progress.
- [ ] Add a quick actions area for capture and planning.
- [ ] Connect the dashboard to real data from tasks, calendar, and habits.

## 6. Phase 5 — Tasks and Projects
- [ ] Build the tasks list page.
- [ ] Implement create, edit, complete, and delete flows.
- [ ] Add filters for today, upcoming, and completed.
- [ ] Add task priority, due date, project association, and tags.
- [ ] Build the projects page and project detail experience.
- [ ] Link tasks to projects and show project-level summary progress.

## 7. Phase 6 — Calendar and Habits
- [ ] Build the calendar view.
- [ ] Add event creation and editing.
- [ ] Connect calendar events to tasks and priorities where useful.
- [ ] Build the habits page.
- [ ] Add habit creation and completion tracking.
- [ ] Show streaks and habit progress.

## 8. Phase 7 — Quick Capture
- [ ] Build the quick capture entry point.
- [ ] Support text capture.
- [ ] Support voice capture and transcription.
- [ ] Classify captures into tasks, ideas, or notes.
- [ ] Add an inbox-style capture stream.

## 9. Phase 8 — AI Coach and Reports
- [ ] Add a simple AI coach conversation experience.
- [ ] Connect the coach to user context from tasks, projects, and priorities.
- [ ] Create daily accountability report generation.
- [ ] Create weekly accountability report generation.
- [ ] Make reports readable and easy to share.

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
