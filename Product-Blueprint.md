# PersonalOS v1 — Product Blueprint

## 1. Product Vision
PersonalOS is a production-ready AI personal operating system designed for desktop and iPhone. It gives users one calm, intelligent place to plan their day, manage commitments, capture ideas, and receive personalized accountability from an AI coach.

The first version should feel polished, fast, and dependable. It must be installable as a PWA, work well on mobile, and provide a clear path from capture to action.

## 2. Product Goals
### Primary goals
- Help users focus on their top 3 priorities each day.
- Make task, project, calendar, and habit management simple and unified.
- Turn scattered ideas into structured next actions.
- Give users a helpful AI companion for planning and accountability.
- Make progress easy to share through elegant links or PDFs.

### Non-goals for v1
- Full desktop replacement operating system behavior.
- Social networking or public community features.
- Deep integrations with every productivity app.
- Complex multi-user collaboration.
- Full real-time streaming voice conversations.

## 3. Target Users
### Primary persona
- Knowledge workers, founders, students, and busy professionals who want clarity and momentum.

### User needs
- Reduce cognitive overload.
- Keep important tasks visible.
- Capture ideas instantly.
- Receive structure and accountability without friction.
- Review progress quickly.

## 4. Core Experience Principles
- Fast: the user should reach core actions in under 3 taps.
- Calm: the interface should be minimal, focused, and distraction-light.
- Intelligent: AI should assist without feeling intrusive.
- Reliable: daily workflows must survive interruptions and mobile usage.
- Private: personal data should be treated as sensitive and protected.

## 5. Product Requirements Document (PRD)

### 5.1 MVP Feature Set
The v1 MVP includes the following:
- Dashboard
- Top 3 daily priorities
- Tasks
- Projects
- Calendar
- Habits
- Quick capture via text and voice
- AI coach
- Daily and weekly AI-generated accountability reports
- Shareable progress links and PDFs
- Responsive desktop and iPhone PWA experience

### 5.2 Functional Requirements
#### Dashboard
- Display a summary of the day, current priorities, upcoming events, habits, and recent captures.
- Allow users to see at-a-glance progress without opening multiple screens.

#### Top 3 Daily Priorities
- Let the user define and edit three priorities each day.
- Show them prominently on the dashboard and mobile home view.
- Allow AI to suggest priorities based on task load and schedule.

#### Tasks
- Create, edit, complete, and delete tasks.
- Support due dates, priorities, tags, project association, and status.
- Display tasks by today, upcoming, and completed.

#### Projects
- Create projects with a title, description, status, and timeline.
- Associate tasks and notes to projects.
- Show progress summaries and next actions.

#### Calendar
- Create calendar events and view them by day or week.
- Link calendar items to tasks and priorities.
- Show upcoming commitments clearly.

#### Habits
- Create habits with frequency and target behavior.
- Track completions and visualize streaks.
- Show habit progress on the dashboard.

#### Quick Capture
- Capture text ideas instantly.
- Capture voice notes and transcribe them.
- Classify captured items into tasks, notes, or ideas.
- Store captures in a simple inbox-like stream.

#### AI Coach
- Answer planning and reflection questions.
- Recommend next actions based on current context.
- Help rewrite or refine goals and priorities.
- Support a conversational thread tied to the user’s data.

#### Accountability Reports
- Generate a daily summary of progress and blockers.
- Generate a weekly summary of momentum, completed work, and priorities.
- Make reports easy to read and share.

#### Sharing
- Create a beautiful shareable progress page.
- Export a shareable PDF summary.
- Preserve privacy controls for what is shared.

### 5.3 UX Requirements
- Desktop-first but mobile-optimized.
- One-tap capture experience on iPhone.
- Clear empty states and onboarding.
- Consistent navigation and accessible interactions.
- Smooth animations and low-friction flows.

### 5.4 Non-Functional Requirements
- Fast initial load on desktop and mobile.
- Installable as a PWA.
- Works reliably with intermittent connectivity.
- Secure authentication and encrypted data storage.
- Strong privacy defaults and clear consent for AI usage.
- Scalable to thousands of users without redesign.

## 6. Application Architecture

### 6.1 Recommended Stack
- Frontend: Next.js with TypeScript and React
- Styling: Tailwind CSS and a polished component system
- PWA support: next-pwa or equivalent
- Backend: Next.js API routes or serverless functions
- Authentication: managed auth provider
- Database: PostgreSQL
- File storage: object storage for attachments and generated reports
- AI layer: provider abstraction for LLM and transcription services
- Background jobs: queue-based processing for reports and notifications
- Deployment: Vercel

### 6.2 Architecture Principles
- Keep the product modular and service-oriented.
- Separate UI, domain logic, AI orchestration, and data access.
- Prefer serverless patterns for low operational overhead.
- Make AI capabilities pluggable so providers can be swapped later.

### 6.3 System Components
#### Client Layer
- Responsive app shell
- Dashboard experience
- Feature pages for tasks, projects, calendar, habits, and coach
- Mobile-optimized capture flows

#### Application Layer
- User context and permissions
- Event orchestration for task/project updates
- AI request handling and response formatting
- Report generation engine
- Sharing and export layer

#### Data Layer
- Relational database for structured records
- Storage for attachments, generated PDFs, and media files
- Caching for dashboard summaries and recent activity

#### External Services
- AI model provider for coaching and summaries
- Speech-to-text provider for voice capture
- Optional email or notification provider

### 6.4 High-Level Data Flow
1. User captures an idea, task, or voice note.
2. The app stores the input and classifies it.
3. The AI layer enriches it into action items or summaries.
4. The dashboard and relevant modules update in real time.
5. Daily and weekly reports are generated in the background.
6. The user can share a curated summary through a link or PDF.

## 7. Database Schema

### 7.1 Core Tables
#### users
- id
- email
- auth_provider
- created_at
- updated_at
- onboarding_completed

#### profiles
- id
- user_id
- display_name
- timezone
- theme_preference
- locale
- avatar_url

#### projects
- id
- user_id
- title
- description
- status
- start_date
- end_date
- created_at
- updated_at

#### tasks
- id
- user_id
- project_id
- title
- description
- status
- priority
- due_date
- created_at
- updated_at
- completed_at

#### priorities
- id
- user_id
- date
- priority_1
- priority_2
- priority_3
- source
- created_at
- updated_at

#### calendar_events
- id
- user_id
- title
- description
- start_at
- end_at
- location
- event_type
- task_id
- created_at
- updated_at

#### habits
- id
- user_id
- title
- description
- frequency
- target_count
- created_at
- updated_at

#### habit_logs
- id
- habit_id
- user_id
- logged_at
- notes
- created_at

#### captures
- id
- user_id
- source_type
- content
- transcript
- category
- status
- created_at
- updated_at

#### ai_conversations
- id
- user_id
- thread_id
- role
- content
- created_at

#### ai_reports
- id
- user_id
- report_type
- date_range_start
- date_range_end
- summary
- generated_at

#### share_links
- id
- user_id
- slug
- title
- content_type
- payload
- is_public
- expires_at
- created_at

### 7.2 Relationships
- One user has many projects, tasks, priorities, habits, captures, conversation threads, reports, and share links.
- Tasks belong to one project optionally.
- Calendar events may reference tasks.
- Habit logs belong to one habit.
- AI reports are generated from user activity and linked to the specific date range.

## 8. API Architecture

### 8.1 API Style
- RESTful JSON APIs with clear resource-based routes.
- Server-rendered pages for core navigation and client-side hydration where appropriate.
- Consistent response envelopes for success, validation, and error states.

### 8.2 API Domains
#### Auth
- Sign in, sign out, refresh session, me

#### Dashboard
- Get daily summary
- Get upcoming items
- Get habit snapshot

#### Tasks
- List, create, update, delete tasks
- Bulk update status

#### Projects
- List, create, update, delete projects
- Get project summaries

#### Calendar
- List events by range
- Create and update events

#### Habits
- List habits
- Log completion
- Get streak data

#### Capture
- Create text or voice capture
- Retrieve inbox items
- Convert captures into tasks or notes

#### AI Coach
- Start or continue a conversation
- Retrieve coaching recommendations
- Generate summaries and next actions

#### Reports
- Generate daily and weekly reports
- Retrieve prior reports

#### Sharing
- Create share links
- Export PDF summaries
- Manage public-link visibility

### 8.3 API Design Principles
- Keep APIs predictable and thin.
- Use explicit validation and permission checks.
- Separate read and write concerns for dashboard and reporting workloads.
- Keep AI operations asynchronous where full immediacy is not required.

## 9. Component Hierarchy

### 9.1 App Shell
- AppLayout
  - TopBar
  - SidebarNav
  - MobileBottomNav
  - MainContent

### 9.2 Feature Pages
- DashboardPage
  - PriorityCard
  - TodaySummaryCard
  - UpcomingEventsCard
  - HabitCard
  - CaptureQuickActions

- TasksPage
  - TaskList
  - TaskComposer
  - TaskFilters

- ProjectsPage
  - ProjectList
  - ProjectDetailPanel
  - ProjectProgressCard

- CalendarPage
  - CalendarView
  - EventComposer

- HabitsPage
  - HabitList
  - HabitStreakCard

- CoachPage
  - ConversationThread
  - CoachPromptComposer
  - ContextSummaryCard

- CapturePage
  - CaptureComposer
  - CaptureInbox

- ReportsPage
  - DailyReportCard
  - WeeklyReportCard
  - ShareActionPanel

### 9.3 Shared Components
- Button
- Modal
- Sheet
- Card
- EmptyState
- FormFields
- DatePicker
- TagInput
- LoadingState
- Toast

## 10. Technical Risks
- AI quality and latency may vary by provider and prompt complexity.
- Voice transcription quality may be inconsistent in noisy environments.
- PWA behavior differs across iPhone and desktop browsers.
- Report generation may become expensive if done on demand for every user.
- Shared links and PDF exports can create privacy and formatting complexity.
- The initial feature set could expand too quickly and dilute focus.
- Data model growth may become harder to manage without clear ownership boundaries.

## 11. Milestones for Coding Agents
### Milestone 1 — Foundation
- Set up the app shell, routing, auth, and deployment environment.
- Create the data model and initial migrations.
- Implement the base UI system and responsive layout.

### Milestone 2 — Core Product Data
- Build tasks, projects, priorities, and habits.
- Add persistence and CRUD flows.
- Create dashboard summaries based on stored data.

### Milestone 3 — Capture and AI
- Build quick capture flows for text and voice.
- Add AI coach conversation handling.
- Create initial report generation logic.

### Milestone 4 — Polish and Sharing
- Add shareable progress pages and PDF export.
- Improve mobile interactions and PWA installability.
- Harden performance, accessibility, and privacy flows.

### Milestone 5 — Launch Readiness
- Conduct QA on desktop and iPhone.
- Validate analytics, error handling, and observability.
- Prepare release checklist and support docs.

## 12. MVP vs Future Enhancements
### MVP
- Dashboard
- Top 3 priorities
- Tasks
- Projects
- Calendar
- Habits
- Quick capture
- AI coach
- Daily and weekly accountability reports
- Share links and PDFs
- Responsive PWA desktop/iPhone experience

### Future Enhancements
- Real-time voice conversations with streaming audio
- Deep integrations with Google Calendar, Notion, Apple Reminders, and email
- Advanced automation and rules engine
- Team or household shared spaces
- Richer analytics and habit forecasting
- Offline-first sync with conflict resolution

## 13. Prioritized Implementation Roadmap
1. Establish the product foundation
   - Create the app shell, navigation, auth flow, and deployment pipeline.
2. Build the data backbone
   - Implement the core database schema and CRUD APIs for users, projects, tasks, habits, and captures.
3. Deliver the daily planning experience
   - Build dashboard, priorities, and task management flows.
4. Add planning and organization modules
   - Implement projects, calendar, and habits.
5. Build capture and AI experiences
   - Add text and voice capture, coaching conversation, and report generation.
6. Add sharing and presentation
   - Create shareable progress pages and PDF export.
7. Optimize for PWA and mobile quality
   - Improve installability, layout, speed, and touch interaction.
8. Harden the product for launch
   - Improve reliability, testing, observability, and privacy safeguards.

## 14. Definition of Done for v1
- A user can create and manage tasks, projects, habits, and priorities.
- A user can capture ideas and receive AI support.
- A user can view daily and weekly accountability reports.
- A user can share a polished progress summary.
- The experience works smoothly on desktop and iPhone as a PWA.

## 15. Recommended Next Action
The next coding agent should begin with Milestone 1 and build the foundation in the exact order below:
1. Project scaffolding and deployment configuration
2. Authentication and user profile setup
3. Database schema and migrations
4. Core app shell and responsive navigation
5. Dashboard and priority management
6. Task and project modules
7. Calendar and habits
8. Capture and AI coach
9. Reports and sharing
10. PWA polish and launch hardening
