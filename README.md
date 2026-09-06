# TaskFlow - Full-Stack Team Management & Collaboration Platform

TaskFlow is a modern, full-stack team management and real-time collaboration application designed for fast-moving product teams. Powered by Next.js 15, React 19, TypeScript, PostgreSQL, Prisma ORM, Clerk, Liveblocks, and Inngest.

---

## Key Features & Page Architecture

### 1. Marketing Landing Page & Branding
* Single-screen hero page framed without page scrollbars.
* Custom TaskFlow vector mark logo.

### 2. Authentication & Team Management Pages
* Sign In and Sign Up authentication pages powered by Clerk.
* Organization Selection page to create teams and switch workspaces.
* Team member management with Admin and Member role permissions.

### 3. Main Dashboard & Admin vs Member Access Controls
* Main Organization Dashboard displaying active boards, workspace header, and team information.
* Admin toggle control switch to turn automated Inngest folder creation ON or OFF permanently.
* Real Time Liveblocks setting sync updating the folder creation status across all active tabs instantly.
* Admin only permissions to manage organization settings, create workspaces, and compare member analytics.
* Member view optimization hiding administrative controls for non admin team members for a clean experience.
* Discord notification integration option using webhook channel dispatch for task assignment alerts alongside in app bell notifications.

### 4. Automated & Protected Folder Tree Engine
* Inngest background engine that automatically generates Year, Month, and Day folders.
* Folder pages for Folder, Year, Month, and Day holding daily boards.
* Password-protected folders for confidential team work privacy.
* User access management to grant or revoke folder access per team member.

### 5. Interactive Board Views & Drag-and-Drop Engine
* Built-in Unsplash wallpaper template picker to create custom background board themes.
* Full drag and drop reordering for lists and cards across columns using smooth animations.
* Multiple view switcher modes including Kanban columns, Timeline scheduling, and Calendar due date grid.
* Card status tracking (Pending, In Progress, Done) with visual status badges and order persistence.
* Inline title editing for boards and list headers, list copying, and card modal launcher.

### 6. Task Cards, Subtasks & Attachments
* Task assignments to team members with profile picture avatars.
* Subtasks checklist with auto-calculated progress percentage bars.
* Image attachments upload and document or link attachments.
* Team discussion comments with user avatars and timestamps.
* Priority tags (High, Medium, Low) and custom colored tags.
* Task status tracking (Pending, In Progress, Done).

### 7. Real Time Bell Icon Notifications
* In app bell icon notification center in the top header.
* Displays real time alerts whenever a task is assigned or updated.

### 8. Focus Time Tracker Page
* Stopwatch time tracker page for assigned pending tasks.
* Start, Pause, Reset, and Mark Done controls.
* Smart state memory so timers only run when started manually and stay paused when navigating pages.
* Clean light mode interface with hidden Y-axis scrollbar.

### 9. Daily Analytics & Productivity Charts Page
* Interactive analytics dashboard tracking team and individual task performance.
* Daily and Overall range toggle to view today stats or full multi-year history.
* Member filter dropdown to view individual user stats or all team members combined.
* Admin comparison mode to compare Person A vs Person B with a live trophy scorecard.
* Real-time KPI cards displaying Total, Completed, Pending, and In Progress tasks.
* Interactive performance trend charts with member breakdown tooltips on hover.
* Automatic midnight timer to reset daily stats automatically at midnight.

### 10. Workspace Activity Audit Logs Page
* History log recording all CREATE, UPDATE, and DELETE actions.
* Shows user avatars, action types, entity names, and timestamps.

### 11. Trash Bin & Auto Cleanup Engine
* Interactive Trash Bin modal dialog with category tabs for Cards, Lists, Boards, Team Folders, and Date Subfolders.
* One click restore button to recover archived items back to active boards and folders with instant optimistic updates.
* Permanent item deletion and one click Empty Trash button to clear all trashed items at once.
* Real-time countdown timer showing remaining days, hours, or minutes before 30 day auto deletion.
* Soft delete system preserving deleted timestamps for a 30 day retention period.
* Automated background cron job purging items older than 30 days automatically.

### 12. Important Boards & Sidebar Workspace Navigation
* Important Board bookmarking system to star high priority boards for instant access.
* Dedicated sidebar navigation menu with accordion workspace switcher.
* Fast navigation links to Teams, Teams Activity, Daily Charts, Time Tracking, and Trash Bin modal.
* Automated background cron job for managing important board reset states.

---

## Tech Stack Used

* **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS, Radix UI, Lucide Icons, Sonner
* **Backend**: Next.js Server Actions, REST API Routes, Prisma ORM
* **Database**: PostgreSQL
* **Authentication**: Clerk Auth & Webhooks
* **Real-Time Engine**: Liveblocks WebSockets
* **Background Engine**: Inngest & Cron Jobs
* **Notifications**: In-App Bell Center & Discord Webhook Channel (`channel: "discord"`)

---

## Getting Started

### Prerequisites

Ensure you have the following installed on your machine:
* Node.js 18.x or higher
* npm, yarn, or pnpm
* PostgreSQL Database

### Installation & Environment Setup

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd mannabi_team_mangemenet
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the root directory and configure the following credentials:
   ```env
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
   CLERK_SECRET_KEY=
   # clerk redirect url(s)
   NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
   NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
   NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/select-org
   NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/select-org

   # Supabase connection strings
   # Transaction connection pooler for the application
   # Connect to Postgres via the shared transaction-mode pooler (IPv4-only)
   DATABASE_URL=
   # Connect to Postgres via the shared session-mode pooler (used for migrations)
   DIRECT_URL=

   # unsplash api key
   NEXT_PUBLIC_UNSPLASH_ACCESS_KEY=

   # app base url
   NEXT_PUBLIC_APP_URL=http://localhost:3000

   # clerk webhook secret
   CLERK_WEBHOOK_SECRET=

   NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY=
   LIVEBLOCKS_SECRET_KEY=

   DISCORD_WEBHOOK_URL=

   INNGEST_DEV=1
   INNGEST_EVENT_KEY=
   INNGEST_SIGNING_KEY=
   ```

4. **Initialize Database**:
   ```bash
   npx prisma db push
   npx prisma generate
   ```

5. **Start Development Server & Inngest Background Engine**:
   Run the Next.js app server and the Inngest Dev Server concurrently:
   ```bash
   # Terminal 1: Next.js App Server
   npm run dev

   # Terminal 2: Inngest Dev Server (Background Worker Engine)
   npx inngest-cli@latest dev
   ```
   Open [http://localhost:3000](http://localhost:3000) for the application and [http://localhost:8288](http://localhost:8288) for the Inngest Dev Server Dashboard.

6. **Build for Production**:
   ```bash
   npm run build
   npm run start
   ```

---

## Architecture & System Documentation

* **Architecture Overview**: Refer to [`architecture.md`](file:///c:/Users/coder/Desktop/mannabi_team_mangemenet/architecture.md) 
---
