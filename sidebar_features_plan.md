# Organization Sidebar Features & Implementation Plan

This document outlines the core features to be added to the left sidebar of the main organization page, specifically focusing on daily operations, time management, and team networking, along with technical implementation details for each.

## 1. Leave Management System
**Description:** A centralized hub for requesting time off, viewing leave balances, and manager approvals.
**How to make it:**
- **Database:** Create `LeaveRequest` (userId, startDate, endDate, type, status, reason) and `LeaveBalance` (userId, totalDays, usedDays) models.
- **Backend:** Create API routes: `POST /api/leaves` (submit request), `GET /api/leaves` (fetch history), and `PATCH /api/leaves/[id]/approve` (manager approval).
- **Frontend:** Build a Calendar UI (using `react-day-picker`) for selecting dates, a form component for submission, and a dashboard table for managers to review pending requests.

## 2. Daily Base Charts & Activity 
**Description:** Visual charts showing daily team activity, task completion rates, and project progress.
**How to make it:**
- **Database:** Ensure every action creates an `AuditLog` or `ActivityLog` entry with timestamps.
- **Backend:** Create an aggregation endpoint (`GET /api/analytics/daily-activity`) that groups logs by day, user, and action type.
- **Frontend:** Integrate a charting library like `recharts`. Build Line and Bar chart components to visualize daily task completions and team activity trends.

## 3. Time Tracking & Active Task Page
**Description:** A dedicated page where a user can view their assigned, pending (not done) tasks, select one, and start a stopwatch/timer specifically for that task. Users can only see tasks assigned to themselves, ensuring privacy and focus.
**How to make it:**
- **Database:** Ensure `Card` or `Task` models track `assigneeId` and `status` (pending/done). Create a `TimeLog` model (userId, taskId, startTime, endTime, duration).
- **Backend:** Create an endpoint (`GET /api/tasks/me/pending`) to fetch incomplete tasks assigned specifically to the logged-in user. Create endpoints to start (`POST /api/time/start`) and stop (`POST /api/time/stop`) the timer.
- **Frontend:** Build a dedicated UI page featuring a prominent Stopwatch component. Include a dropdown or list to select from the user's pending tasks. The timer should visually tick and use `localStorage` or server-state to persist across page reloads.

## 4. Tasks of Today (TOT) / Daily Member Page
**Description:** A personalized daily dashboard unique to each member, showing their specific tasks, schedule, and daily performance metrics.
**How to make it:**
- **Database:** Query the `Task` or `Card` models filtered by `assigneeId === currentUser` and `dueDate === today`.
- **Backend:** Create a specific endpoint (`GET /api/members/me/today`) that fetches the user's tasks, active time tracking, and daily schedule in one payload.
- **Frontend:** Build a distraction-free list or Kanban view dedicated strictly to today's work, featuring quick-action buttons (Start Timer, Mark Complete) and a personalized greeting.

## 5. Active Projects Portfolio
**Description:** A high-level overview of all ongoing projects with health indicators.
**How to make it:**
- **Database:** Extend the `Board` or `Project` model to include a `status` field (e.g., On Track, At Risk) and a `progress` percentage.
- **Backend:** Endpoint to aggregate project statuses and calculate overall completion percentages based on child tasks.
- **Frontend:** A dashboard view with progress bars and status badges (using `shadcn/ui` Badge and Progress components).

## 6. Team Directory & Skill Network
**Description:** A searchable database of employees, their roles, and a skill-sharing network.
**How to make it:**
- **Database:** Add a `Profile` model linked to the User, containing fields for `department`, `skillsToTeach`, and `skillsToLearn`.
- **Backend:** Search API (`GET /api/directory?query=X`) that supports full-text search on names and skills.
- **Frontend:** A grid of user profile cards with search and filter inputs to easily find colleagues by department or specific skills.

## 7. Resource Library & SOPs
**Description:** A centralized knowledge base for Standard Operating Procedures (SOPs), company policies, and helpful templates.
**How to make it:**
- **Database:** Create a `Document` model (title, content, category, authorId, isPublic).
- **Backend:** A generic CRUD API for documents (`GET /api/documents`, `POST /api/documents`).
- **Frontend:** A rich text editor (e.g., TipTap or Quill) for writing docs, and a categorized folder view for easy reading and searching.

## 8. Asynchronous Stand-up Logs
**Description:** A feature allowing team members to quickly share what they accomplished yesterday, their focus for today, and any blockers.
**How to make it:**
- **Database:** Create a `StandupLog` model (userId, date, yesterday, today, blockers).
- **Backend:** API endpoint (`POST /api/standups`) that accepts submissions and prevents multiple submissions per day.
- **Frontend:** A simple, three-question form modal that pops up on the first login of the day, and a feed to view everyone's updates.

## 9. Peer Recognition (Kudos)
**Description:** A dedicated board for team members to publicly thank or praise colleagues for their hard work, boosting morale.
**How to make it:**
- **Database:** Create a `Kudos` model (senderId, receiverId, message, timestamp).
- **Backend:** Endpoint (`POST /api/kudos`) that creates the record and potentially sends an email/notification to the receiver.
- **Frontend:** A scrolling feed component showing recent "Kudos", with an input box at the top to send a new one quickly.

## 10. Meeting Notes & Action Items
**Description:** A collaborative space to take notes during team meetings and directly turn bullet points into assigned tasks.
**How to make it:**
- **Database:** Create a `MeetingNote` model (title, date, attendees, content).
- **Backend:** Endpoints to auto-extract action items from the text (using regex or simple parsing) and bulk-create `Task` objects.
- **Frontend:** A collaborative text editor (like Yjs + TipTap) where multiple people can type simultaneously.

## 11. Private Member Scratchpad
**Description:** A simple, private note-taking area for members to jot down quick thoughts or temporary lists not tied to any project.
**How to make it:**
- **Database:** Add a `scratchpad` (text) field to the user's `Profile` or a dedicated `PrivateNote` model.
- **Backend:** An auto-save endpoint (`PATCH /api/members/me/scratchpad`) that debounces saves as the user types.
- **Frontend:** A minimalist, persistent text area panel that can slide out from the right side of the screen at any time for quick access.
