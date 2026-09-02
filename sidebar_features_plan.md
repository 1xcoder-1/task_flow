
## 1. Leave Management System (Chuttiyon Ka System)
**Description (Tafseel):** Ek central hub jahan team members time-off / chutti ki request bhej saken, apna leave balance dekh saken aur managers approvals de saken.
**Kaise Banayein (Implementation):**
- **Database:** `LeaveRequest` (userId, startDate, endDate, type, status, reason) aur `LeaveBalance` (userId, totalDays, usedDays) models banayein.
- **Backend:** API routes: `POST /api/leaves` (request submit karne ke liye), `GET /api/leaves` (history ke liye), aur `PATCH /api/leaves/[id]/approve` (manager approval ke liye).
- **Frontend:** Calendar UI (`react-day-picker` ke zariye) dates select karne ke liye, submission form, aur managers ke liye dashboard table.

---

## 2. Daily Base Charts & Activity (Daily Performance Charts)
**Description (Tafseel):** Visual charts jo daily team activity, task completion rates aur project progress dikhayein.
**Kaise Banayein (Implementation):**
- **Database:** Har user action par `AuditLog` ya `ActivityLog` entry timestamps ke saath save ho.
- **Backend:** Aggregation endpoint (`GET /api/analytics/daily-activity`) jo logs ko day, user, aur action type ke hisab se group kare.
- **Frontend:** `recharts` library integrate karein. Line aur Bar chart components banayein jo daily task completions aur team activity trends display karein.

---

## 3. Time Tracking & Active Task Page (Time Tracker Aur Active Tasks)
**Description (Tafseel):** Ek dedicated page jahan user apne assigned, pending (incomplete) tasks dekh sake, ek task select karke stopwatch/timer start kar sake. User ko sirf apne assigned tasks dikhenge.
**Kaise Banayein (Implementation):**
- **Database:** `Card` ya `Task` models mein `assigneeId` aur `status` (pending/done) track karein. Ek `TimeLog` model (userId, taskId, startTime, endTime, duration) banayein.
- **Backend:** Endpoint (`GET /api/tasks/me/pending`) jo logged-in user ke pending tasks fetch kare. Timer start (`POST /api/time/start`) aur stop (`POST /api/time/stop`) karne ke endpoints banayein.
- **Frontend:** Dedicated UI page jisme prominent Stopwatch component ho, pending tasks ka selection dropdown ho, aur timer `localStorage` / server state ke saath sync rahe.

---

## 4. Tasks of Today (TOT) / Daily Member Page (Aaj Ke Kaam)
**Description (Tafseel):** Har member ke liye personalized daily dashboard jo unke aaj ke specific tasks, schedule aur daily metrics dikhaye.
**Kaise Banayein (Implementation):**
- **Database:** `Task` / `Card` models ko query karein jahan `assigneeId === currentUser` aur `dueDate === today`.
- **Backend:** Endpoint (`GET /api/members/me/today`) jo user ke aaj ke tasks, active time tracking aur daily schedule fetch kare.
- **Frontend:** Distraction-free List ya Kanban view jo sirf aaj ke kaam dikhaye, quick-action buttons (Start Timer, Mark Complete) ke saath.

---

## 5. Active Projects Portfolio (Chalte Hue Projects)
**Description (Tafseel):** Tamam ongoing projects ki high-level overview aur unki health/progress status indicators.
**Kaise Banayein (Implementation):**
- **Database:** `Board` / `Project` model mein `status` (e.g., On Track, At Risk) aur `progress` percentage field add karein.
- **Backend:** Endpoint jo child tasks ke basis par overall completion percentage calculate aur aggregate kare.
- **Frontend:** Dashboard view jisme progress bars aur status badges hon (`shadcn/ui` Badge aur Progress components).

---

## 6. Team Directory & Skill Network (Team Directory Aur Skills)
**Description (Tafseel):** Employees ki searchable directory, unke roles aur skill-sharing network.
**Kaise Banayein (Implementation):**
- **Database:** User se linked `Profile` model banayein jisme `department`, `skillsToTeach`, aur `skillsToLearn` fields hon.
- **Backend:** Search API (`GET /api/directory?query=X`) jo names aur skills par full-text search kare.
- **Frontend:** User profile cards ka grid UI jisme search aur department/skills filters hon.

---

## 7. Resource Library & SOPs (Company Resources & Docs)
**Description (Tafseel):** Centralized knowledge base jahan Standard Operating Procedures (SOPs), company policies aur templates rakhe ja saken.
**Kaise Banayein (Implementation):**
- **Database:** `Document` model (title, content, category, authorId, isPublic) banayein.
- **Backend:** Generic CRUD API documents ke liye (`GET /api/documents`, `POST /api/documents`).
- **Frontend:** Rich text editor (TipTap ya Quill) docs write karne ke liye, aur categorized folder view.

---

## 8. Asynchronous Stand-up Logs (Daily Standup Updates)
**Description (Tafseel):** Team members daily updates share kar saken: kal kya kiya, aaj kya karenge, aur koi blockers hain ya nahi.
**Kaise Banayein (Implementation):**
- **Database:** `StandupLog` model (userId, date, yesterday, today, blockers) banayein.
- **Backend:** API endpoint (`POST /api/standups`) jo daily 1 submission restrict/enforce kare.
- **Frontend:** Simple 3-question form modal jo din ki pehli login par pop-up ho, aur team feed.

---

## 9. Peer Recognition (Kudos / Appreciations)
**Description (Tafseel):** Ek dedicated board jahan team members ek doosre ki mehnat ko publicly appreciate/thank kar saken.
**Kaise Banayein (Implementation):**
- **Database:** `Kudos` model (senderId, receiverId, message, timestamp) banayein.
- **Backend:** Endpoint (`POST /api/kudos`) jo record save kare aur receiver ko email/notification bheje.
- **Frontend:** Recent Kudos ka scrolling feed component aur quick-send input box.

---

## 10. Private Member Scratchpad (Zati Quick Notes)
**Description (Tafseel):** Member ke liye private, simple note-taking area jahan wo apne quick thoughts ya temporary lists save kar saken.
**Kaise Banayein (Implementation):**
- **Database:** User `Profile` ya `PrivateNote` model mein `scratchpad` (text) field add karein.
- **Backend:** Auto-save endpoint (`PATCH /api/members/me/scratchpad`) jo typing ke dauran debounced auto-save kare.
- **Frontend:** Minimalist slide-out text panel jo screen ke right side se kisi bhi waqt slide-out ho sake.

---


